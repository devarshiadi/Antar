import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, MessageCircle } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

export function MatchesScreenNew({ navigation, route }) {
  const { city } = route.params || {};
  
  const initialData = [
    { id: 1, name: 'Rajesh Kumar', rating: 4.8, from: 'MG Road', to: 'Whitefield', time: '8:30 AM', price: 120, seats: 2, status: 'available' },
    { id: 2, name: 'Priya Sharma', rating: 4.9, from: 'Koramangala', to: 'Electronic City', time: '9:00 AM', price: 80, seats: 1, status: 'available' },
    { id: 3, name: 'Suresh Singh', rating: 4.6, from: 'Indiranagar', to: 'HSR Layout', time: '7:45 AM', price: 100, seats: 1, status: 'pending' },
    { id: 4, name: 'Sneha Reddy', rating: 5.0, from: 'Marathahalli', to: 'Bellandur', time: '8:15 AM', price: 60, seats: 1, status: 'accepted' },
  ];

  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setRiders(initialData);
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, []);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setRiders((prev) => [...prev]);
      setRefreshing(false);
    }, 500);
  }

  function toggleSelect(id) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function handleRequest() {
    if (selectedIds.length === 0) return;
    setRiders((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) && r.status === 'available' ? { ...r, status: 'pending' } : r))
    );
    setSelectedIds([]);
  }

  function handleChat(riderId) {
    navigation.navigate('Chat', { matchId: riderId });
  }

  function handleCancelPending(riderId) {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId && r.status === 'pending' ? { ...r, status: 'available' } : r))
    );
  }

  const RiderCard = ({ rider }) => {
    const isAvailable = rider.status === 'available';
    const isPending = rider.status === 'pending';
    const isAccepted = rider.status === 'accepted';
    const isSelected = selectedIds.includes(rider.id);

    return (
      <TouchableOpacity
        style={[
          styles.riderCard,
          isSelected && styles.riderCardSelected,
        ]}
        onPress={() => isAvailable && toggleSelect(rider.id)}
        disabled={!isAvailable}
      >
        <View style={styles.riderHeader}>
          <Text style={styles.riderName}>{rider.name}</Text>
          <Text style={styles.riderRating}>{rider.rating}★</Text>
        </View>

        <Text style={styles.riderRoute} numberOfLines={1}>
          {rider.from} → {rider.to}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.detailsLeft}>
            <Text style={styles.riderDetail}>{rider.time}</Text>
            <Text style={styles.riderDetailDot}>•</Text>
            <Text style={styles.riderDetail}>{rider.seats} seat{rider.seats > 1 ? 's' : ''}</Text>
            {isPending && (
              <>
                <Text style={styles.riderDetailDot}>•</Text>
                <Text style={[styles.riderDetail, styles.statusPending]}>PENDING</Text>
              </>
            )}
            {isAccepted && (
              <>
                <Text style={styles.riderDetailDot}>•</Text>
                <Text style={[styles.riderDetail, styles.statusAccepted]}>ACCEPTED</Text>
              </>
            )}
          </View>
          <Text style={styles.priceText}>₹{rider.price}</Text>
        </View>

        {isPending && (
          <View style={styles.pendingMessage}>
            <Clock size={14} color={COLORS.text.tertiary} />
            <Text style={styles.pendingText}>Waiting for response</Text>
            <TouchableOpacity style={styles.cancelPending} onPress={() => handleCancelPending(rider.id)}>
              <Text style={styles.cancelPendingText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleChat(rider.id)}
          >
            <MessageCircle size={16} color={COLORS.text.primary} />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const counts = {
    available: riders.filter((r) => r.status === 'available').length,
    pending: riders.filter((r) => r.status === 'pending').length,
    accepted: riders.filter((r) => r.status === 'accepted').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Riders</Text>
        <Text style={styles.headerSubtitle}>
          {city ? city + ' • ' : ''}
          {counts.available} available • {counts.pending} pending • {counts.accepted} accepted
        </Text>
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
        {riders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyText}>Pull to refresh or adjust filters</Text>
          </View>
        ) : (
          riders.map((rider) => <RiderCard key={rider.id} rider={rider} />)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedIds.length > 0 && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.requestButton} onPress={handleRequest}>
            <Text style={styles.requestButtonText}>
              REQUEST {selectedIds.length} RIDE{selectedIds.length > 1 ? 'S' : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSelectedIds([])}
          >
            <Text style={styles.cancelButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  riderCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
  },
  riderCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.bg.elevated,
  },
  riderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  riderName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  riderRating: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  riderRoute: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  detailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  riderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  riderDetail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  riderDetailDot: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginHorizontal: SPACING.xs,
  },
  statusPending: {
    color: COLORS.text.tertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusAccepted: {
    color: COLORS.text.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  priceText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  pendingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  pendingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  cancelPending: {
    marginLeft: 'auto',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
  },
  cancelPendingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  chatButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    backgroundColor: COLORS.bg.primary,
  },
  requestButton: {
    flex: 1,
    backgroundColor: COLORS.text.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  requestButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.bg.primary,
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
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
});

export default MatchesScreenNew;
