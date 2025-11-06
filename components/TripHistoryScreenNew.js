import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

function TripHistoryScreenNew({ navigation }) {
  const baseTrips = [
    {
      id: 1,
      date: 'Nov 4, 2024',
      from: 'MG Road',
      to: 'Whitefield',
      fare: 120,
      type: 'passenger',
      partner: 'Rajesh Kumar',
    },
    {
      id: 2,
      date: 'Nov 3, 2024',
      from: 'Koramangala',
      to: 'Indiranagar',
      fare: 80,
      type: 'rider',
      partner: 'Priya Sharma',
    },
    {
      id: 3,
      date: 'Nov 2, 2024',
      from: 'HSR Layout',
      to: 'Electronic City',
      fare: 150,
      type: 'passenger',
      partner: 'Amit Patel',
    },
  ];

  const [filter, setFilter] = useState('all'); // all | rider | passenger
  const [trips, setTrips] = useState(baseTrips);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setTrips((prev) => [...prev]);
      setRefreshing(false);
    }, 500);
  };

  const loadMore = () => {
    const nextId = trips.length + 1;
    const more = [
      { id: nextId, date: 'Nov 1, 2024', from: 'Marathahalli', to: 'Bellandur', fare: 60, type: 'rider', partner: 'Sneha Reddy' },
      { id: nextId + 1, date: 'Oct 31, 2024', from: 'BTM', to: 'HSR', fare: 50, type: 'passenger', partner: 'Vijay N' },
    ];
    setTrips([...trips, ...more]);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return trips;
    return trips.filter((t) => t.type === (filter === 'rider' ? 'rider' : 'passenger'));
  }, [trips, filter]);

  const groupByDate = useMemo(() => {
    const map = new Map();
    filtered.forEach((t) => {
      const key = t.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const relativeDays = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (isNaN(diff)) return dateStr;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  const stats = {
    totalTrips: 45,
    asRider: 20,
    asPassenger: 25,
    totalSaved: 3200,
  };

  const TripCard = ({ trip }) => (
    <TouchableOpacity style={styles.tripCard}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.text.secondary}
            colors={[COLORS.text.primary]}
          />
        }
      >
        {/* Filters */}
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

        {/* Stats Summary */}
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

        {/* Trips List */}
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
                {items.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </View>
            ))
          )}

          {/* Load More */}
          <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load more</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    alignItems: 'center',
  },
  statsDetailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
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

export default TripHistoryScreenNew;
