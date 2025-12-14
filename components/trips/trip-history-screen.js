import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import * as Contacts from 'expo-contacts';
import { getStoredRides } from '../../helpers/rides-storage';
import { normalizeTripFromApi, computeTripHistoryStats } from '../../helpers/trip-history-helpers';
import { useAppTheme } from '../../helpers/use-app-theme';

export const tripHistorySeed = [
  {
    id: 1,
    date: 'Nov 4, 2024',
    time: '08:30 AM',
    from: 'MG Road',
    to: 'Whitefield',
    fare: 120,
    type: 'passenger',
    partner: 'Rajesh Kumar',
  },
  {
    id: 2,
    date: 'Nov 3, 2024',
    time: '07:45 AM',
    from: 'Koramangala',
    to: 'Indiranagar',
    fare: 80,
    type: 'rider',
    partner: 'Priya Sharma',
  },
  {
    id: 3,
    date: 'Nov 2, 2024',
    time: '09:15 AM',
    from: 'HSR Layout',
    to: 'Electronic City',
    fare: 150,
    type: 'passenger',
    partner: 'Amit Patel',
  },
];

export function TripHistoryScreen({ navigation }) {
  const { colors, statusBarStyle } = useAppTheme();
  const [filter, setFilter] = useState('all');
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [contactsPermission, setContactsPermission] = useState(null);
  const [contactsPromptVisible, setContactsPromptVisible] = useState(false);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [contactsData, setContactsData] = useState([]);
  const [pendingShareTrip, setPendingShareTrip] = useState(null);

  function onRefresh() {
    hydrateTrips(true);
  }

function ContactsPermissionOverlay({ visible, onAllow, onDismiss }) {
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.permissionOverlay}>
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Sync contacts?</Text>
        <Text style={styles.permissionText}>Access your address book to share rides directly with friends.</Text>
        <View style={styles.permissionActions}>
          <TouchableOpacity style={styles.permissionButtonPrimary} onPress={onAllow} activeOpacity={0.85}>
            <Text style={styles.permissionButtonPrimaryText}>Allow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionButtonGhost} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.permissionButtonGhostText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ContactPickerSheet({ visible, contacts, onClose, onSelect }) {
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.pickerScrim}>
      <TouchableOpacity style={styles.pickerScrim} onPress={onClose} activeOpacity={1} />
      <View style={styles.pickerOverlay}>
        <Text style={styles.pickerTitle}>Share with</Text>
        <ScrollView style={styles.pickerList}>
          {contacts.length === 0 ? (
            <Text style={styles.emptyContactsText}>No contacts found.</Text>
          ) : (
            contacts.map((contact) => (
              <TouchableOpacity key={contact.id} style={styles.contactRow} onPress={() => onSelect(contact)}>
                <Text style={styles.contactName}>{contact.name || 'Unknown contact'}</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumbers?.[0]?.number ?? 'No phone'}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <TouchableOpacity style={styles.permissionButtonGhost} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.permissionButtonGhostText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

  async function hydrateTrips(isRefreshing) {
    if (isRefreshing) {
      setRefreshing(true);
    }
    try {
      const stored = await getStoredRides();
      const base = Array.isArray(stored) ? stored : [];
      const mapped = base.map((item, index) => normalizeTripFromApi(item, index));
      setTrips(mapped);
    } catch (error) {
      setTrips([]);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    hydrateTrips(false);
  }, []);

  function loadMore() {
    hydrateTrips(true);
  }

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return trips;
    }
    return trips.filter((trip) => trip.type === (filter === 'rider' ? 'rider' : 'passenger'));
  }, [trips, filter]);

  const groupByDate = useMemo(() => {
    const map = new Map();
    filtered.forEach((trip) => {
      const key = trip.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(trip);
    });
    return Array.from(map.entries());
  }, [filtered]);

  function relativeDays(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (Number.isNaN(diff)) {
      return dateStr;
    }
    if (diff === 0) {
      return 'Today';
    }
    if (diff === 1) {
      return 'Yesterday';
    }
    return `${diff} days ago`;
  }

  const stats = useMemo(() => computeTripHistoryStats(trips), [trips]);

  useEffect(() => {
    async function primeContacts() {
      try {
        const { status } = await Contacts.getPermissionsAsync();
        setContactsPermission(status);
        if (status === 'granted') {
          await hydrateContacts();
        }
      } catch (error) {
        console.log('Contacts prime error', error);
      }
    }
    primeContacts();
  }, []);

  async function hydrateContacts() {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      const normalized = data.filter((contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0);
      setContactsData(normalized);
    } catch (error) {
      console.log('Contacts fetch error', error);
    }
  }

  function handleTripShareRequest(trip) {
    setPendingShareTrip(trip);
    if (contactsPermission === 'granted' && contactsData.length > 0) {
      setContactPickerVisible(true);
    } else {
      setContactsPromptVisible(true);
    }
  }

  async function handleAllowContacts() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermission(status);
      if (status === 'granted') {
        await hydrateContacts();
        setContactsPromptVisible(false);
        setContactPickerVisible(true);
      } else {
        Alert.alert('Permission required', 'Unable to share rides without contacts access.');
      }
    } catch (error) {
      console.log('Contacts permission error', error);
    }
  }

  function handleDismissContactsPrompt() {
    setContactsPromptVisible(false);
    setPendingShareTrip(null);
  }

  function handleContactSelect(contact) {
    if (!pendingShareTrip) {
      return;
    }
    const phone = contact.phoneNumbers?.[0]?.number ?? 'unknown';
    const payload = `${pendingShareTrip.from} → ${pendingShareTrip.to}
${pendingShareTrip.date}${pendingShareTrip.time ? ` • ${pendingShareTrip.time}` : ''}
Role: ${pendingShareTrip.type === 'rider' ? 'Driver' : 'Passenger'}
Fare: ₹${pendingShareTrip.fare}
Share with: ${contact.name} (${phone})`;
    Share.share({ message: payload });
    setContactPickerVisible(false);
    setPendingShareTrip(null);
  }

  function renderTripCard(trip) {
    return (
      <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => setSelectedTrip(trip)} activeOpacity={0.85}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripDate}>{trip.date}</Text>
          <Text style={styles.tripType}>{trip.type === 'rider' ? 'DRIVER' : 'PASSENGER'}</Text>
        </View>
        <Text style={styles.tripRoute}>
          {trip.from} → {trip.to}
        </Text>
        <View style={styles.tripFooter}>
          <Text style={styles.tripPartner}>with {trip.partner}</Text>
          <Text style={styles.tripFare}>₹{trip.fare}</Text>
        </View>
        <ChevronRight size={18} color={COLORS.text.tertiary} style={styles.tripChevron} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.text.secondary} colors={[COLORS.text.primary]} />
        }
      >
        <View style={styles.filtersRow}>
          {['all', 'rider', 'passenger'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, filter === key && styles.filterChipActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {key === 'all' ? 'All' : key === 'rider' ? 'Driver' : 'Passenger'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>₹{stats.totalSaved}</Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
          </View>
          <View style={styles.statsDetail}>
            <Text style={styles.statsDetailText}>
              {stats.asRider} as driver • {stats.asPassenger} as passenger
            </Text>
          </View>
        </View>
        <View style={styles.tripsSection}>
          <Text style={styles.sectionTitle}>All Trips</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No trips</Text>
              <Text style={styles.emptyText}>Pull to refresh or change filter</Text>
            </View>
          ) : (
            groupByDate.map(([date, items]) => (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateTitle}>{date}</Text>
                  <Text style={styles.dateMeta}>{relativeDays(date)}</Text>
                </View>
                {items.map((trip) => renderTripCard(trip))}
              </View>
            ))
          )}
          <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load more</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TripDetailOverlay trip={selectedTrip} onClose={() => setSelectedTrip(null)} onShareRequest={handleTripShareRequest} />
      <ContactsPermissionOverlay visible={contactsPromptVisible} onAllow={handleAllowContacts} onDismiss={handleDismissContactsPrompt} />
      <ContactPickerSheet
        visible={contactPickerVisible}
        contacts={contactsData}
        onClose={() => {
          setContactPickerVisible(false);
          setPendingShareTrip(null);
        }}
        onSelect={handleContactSelect}
      />
    </SafeAreaView>
  );
}

function TripDetailOverlay({ trip, onClose, onShareRequest }) {
  if (!trip) {
    return null;
  }
  return (
    <View style={styles.detailOverlay}>
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Ride details</Text>
        <Text style={styles.detailRoute}>
          {trip.from} → {trip.to}
        </Text>
        <Text style={styles.detailMeta}>
          {trip.date}
          {trip.time ? ` • ${trip.time}` : ''}
        </Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Partner</Text>
          <Text style={styles.detailValue}>{trip.partner}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role</Text>
          <Text style={styles.detailValue}>{trip.type === 'rider' ? 'Driver' : 'Passenger'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fare</Text>
          <Text style={styles.detailValue}>₹{trip.fare}</Text>
        </View>
        <View style={styles.detailActionRow}>
          <TouchableOpacity style={styles.detailShare} onPress={() => onShareRequest(trip)} activeOpacity={0.85}>
            <Text style={styles.detailShareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailClose} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.detailCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
  },
  filterChipActive: {
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.bg.elevated,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  filterTextActive: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  statsCard: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border.subtle,
  },
  statsDetail: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  tripsSection: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  dateGroup: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  dateTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  dateMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  tripCard: {
    position: 'relative',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg.card,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tripDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  tripType: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.text.tertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tripRoute: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripPartner: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  tripFare: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  tripChevron: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -9,
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    width: '85%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    backgroundColor: COLORS.bg.elevated,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  detailTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
  },
  detailRoute: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  detailMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  detailActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  detailShare: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.text.primary,
    alignItems: 'center',
  },
  detailShareText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  detailClose: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    alignItems: 'center',
  },
  detailCloseText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  pickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    backgroundColor: COLORS.bg.elevated,
    maxHeight: '60%',
    padding: SPACING.md,
  },
  pickerTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  pickerList: {
    flexGrow: 0,
  },
  contactRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  contactName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  contactPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  loadMoreText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
});

export default TripHistoryScreen;
