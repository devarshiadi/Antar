import React, { useEffect, useMemo, useState } from 'react';
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
import { TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import {
  getStoredRides,
  updateRide,
  getRideById,
  addRideRequest,
  updateRideRequest,
  getRideRequests,
} from '../../helpers/rides-storage';
import { addNotification, getNotificationsForUser } from '../../helpers/notifications-storage';
import { useAppTheme } from '../../helpers/use-app-theme';
import { useSession } from '../../helpers/session-context';

export function MatchesScreenNew({ navigation, route }) {
  const { user: sessionUser } = useSession();
  const { city, viewerRole = 'offerer', tripType, source, destination, currentUser: routeUser } = route.params || {};
  const currentUser = routeUser || sessionUser || null;
  const { colors, statusBarStyle } = useAppTheme();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const isSeekerView = viewerRole === 'seeker';
  
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
  const [rideRequests, setRideRequests] = useState([]);

  function normalizeText(value) {
    if (!value || typeof value !== 'string') {
      return '';
    }
    return value.trim().toLowerCase();
  }

  function isRideMatch(ride, sourceParam, destinationParam) {
    const rideFrom = normalizeText(ride.from);
    const rideTo = normalizeText(ride.to);
    const sourceTerm = normalizeText(sourceParam && (sourceParam.address || sourceParam.from));
    const destTerm = normalizeText(destinationParam && (destinationParam.address || destinationParam.to));
    const fromMatches = !sourceTerm || rideFrom.includes(sourceTerm) || sourceTerm.includes(rideFrom);
    const toMatches = !destTerm || rideTo.includes(destTerm) || destTerm.includes(rideTo);
    return fromMatches && toMatches;
  }

  async function loadRiders(isInitial) {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const [storedRides, storedRequests] = await Promise.all([getStoredRides(), getRideRequests()]);
      setRideRequests(storedRequests);
      let combined = [...initialData, ...storedRides];
      if (isSeekerView) {
        combined = combined.filter((ride) => isRideMatch(ride, source, destination));
      }
      const annotated = combined.map((ride) => {
        if (!currentUser) {
          return ride;
        }
        const hasPendingRequest = storedRequests.some(
          (request) => request.rideId === ride.id && request.seekerId === currentUser.id && request.status === 'pending',
        );
        if (!hasPendingRequest) {
          return ride;
        }
        return {
          ...ride,
          requestedByUser: true,
        };
      });
      setRiders(annotated);
    } catch (error) {
      setRiders(initialData);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRiders(true);
  }, [isSeekerView, source, destination, currentUser]);

  function onRefresh() {
    setRefreshing(true);
    loadRiders(false);
  }

  function toggleSelect(id) {
    if (!isSeekerView) {
      return;
    }
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]));
  }

  async function handleRequest() {
    if (!isSeekerView || selectedIds.length === 0) {
      return;
    }
    const passengerName = currentUser?.name?.trim() || 'Passenger';
    const passengerId = currentUser?.id || `seeker-${Date.now()}`;
    const targetIds = [...selectedIds];
    setRiders((prev) =>
      prev.map((rider) =>
        targetIds.includes(rider.id) && rider.status === 'available'
          ? { ...rider, status: 'pending', requestedByUser: true }
          : rider,
      ),
    );
    setSelectedIds([]);
    await Promise.all(
      targetIds.map(async (rideId) => {
        const ride = await getRideById(rideId);
        if (!ride || ride.status !== 'available') {
          return;
        }
        await updateRide(rideId, { status: 'pending' });
        const request = await addRideRequest({
          rideId,
          driverId: ride.driverId || ride.id,
          driverName: ride.driverName || ride.name,
          seekerId: passengerId,
          seekerName: passengerName,
          rideSummary: {
            from: ride.from,
            to: ride.to,
            time: ride.time,
          },
        });
        await addNotification({
          rideId,
          requestId: request.id,
          type: 'request',
          title: 'Ride request received',
          message: `${passengerName} wants to join your ride ${ride.from} → ${ride.to}`,
          recipientId: ride.driverId || ride.id,
          seekerId: passengerId,
          counterpartyName: passengerName,
          routeSummary: `${ride.from} → ${ride.to}`,
        });
      }),
    );
    loadRiders(false);
  }

  function handleChat(rider) {
    if (rider.status !== 'accepted') {
      return;
    }
    navigation.navigate('Chat', {
      matchId: rider.id,
      contact: {
        name: rider.name,
        rating: rider.rating,
        route: `${rider.from} → ${rider.to}`,
        time: rider.time,
        fare: rider.price,
      },
    });
  }

  function handleCancelPending(riderId) {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId && r.status === 'pending' ? { ...r, status: 'available' } : r))
    );
  }

  async function handleAcceptPending(riderId, accepted) {
    if (isSeekerView) {
      return;
    }
    const updatedStatus = accepted ? 'accepted' : 'available';
    setRiders((prev) =>
      prev.map((rider) =>
        rider.id === riderId && rider.status === 'pending'
          ? { ...rider, status: updatedStatus, requestedByUser: false }
          : rider,
      ),
    );
    await updateRide(riderId, { status: updatedStatus });
    const pendingRequest = rideRequests.find(
      (request) => request.rideId === riderId && request.status === 'pending',
    );
    if (pendingRequest) {
      await updateRideRequest(pendingRequest.id, { status: accepted ? 'accepted' : 'rejected' });
      await addNotification({
        rideId: riderId,
        requestId: pendingRequest.id,
        type: accepted ? 'accept' : 'reject',
        title: accepted ? 'Request accepted' : 'Request rejected',
        message: accepted
          ? `${pendingRequest.driverName || 'Driver'} accepted your ride request.`
          : `${pendingRequest.driverName || 'Driver'} could not confirm your request.`,
        recipientId: pendingRequest.seekerId,
        seekerId: pendingRequest.seekerId,
        allowChat: accepted,
        counterpartyName: pendingRequest.driverName || 'Driver',
        routeSummary:
          pendingRequest.rideSummary && pendingRequest.rideSummary.from && pendingRequest.rideSummary.to
            ? `${pendingRequest.rideSummary.from} → ${pendingRequest.rideSummary.to}`
            : undefined,
      });
    }
    loadRiders(false);
  }

  const RiderCard = ({ rider }) => {
    const isAvailable = rider.status === 'available';
    const isPending = rider.status === 'pending';
    const isAccepted = rider.status === 'accepted';
    const isSelected = selectedIds.includes(rider.id);

    return (
      <TouchableOpacity
        style={[styles.riderCard, isSelected && styles.riderCardSelected]}
        onPress={() => isAvailable && toggleSelect(rider.id)}
        disabled={!isSeekerView || !isAvailable}
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
                <Text style={[styles.riderDetail, styles.statusPending]}>
                  {isSeekerView ? 'REQUESTED' : 'PENDING'}
                </Text>
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
            <Clock size={14} color={colors.text.tertiary} />
            <Text style={styles.pendingText}>
              {isSeekerView ? 'Waiting for driver to respond' : 'Traveler requested to join'}
            </Text>
            {!isSeekerView && (
              <View style={styles.pendingActions}>
                <TouchableOpacity style={styles.acceptPending} onPress={() => handleAcceptPending(rider.id, true)}>
                  <Text style={styles.acceptPendingText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelPending} onPress={() => handleAcceptPending(rider.id, false)}>
                  <Text style={styles.cancelPendingText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleChat(rider)}
            accessibilityRole="button"
            accessibilityLabel={`Open chat with ${rider.name}`}
            activeOpacity={0.9}
          >
            <MessageCircle size={16} color={colors.button.primaryText} />
            <Text style={styles.chatButtonText}>
              {isSeekerView ? 'Chat with driver' : 'Coordinate'}
            </Text>
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg.primary }]}>
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isSeekerView ? 'Available Rides' : 'Ride Requests'}</Text>
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
            tintColor={colors.text.secondary}
            colors={[colors.text.primary]}
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

      {isSeekerView && selectedIds.length > 0 && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.requestButton} onPress={handleRequest}>
            <Text style={styles.requestButtonText}>
              SEND REQUEST TO {selectedIds.length} DRIVER{selectedIds.length > 1 ? 'S' : ''}
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

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.bg.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    headerTitle: {
      ...TYPOGRAPHY.title,
      color: colors.text.primary,
    },
    headerSubtitle: {
      ...TYPOGRAPHY.caption,
      color: colors.text.secondary,
      marginTop: SPACING.xs,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: SPACING.md,
      paddingBottom: SPACING.xl,
    },
    riderCard: {
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.bg.card,
    },
    riderCardSelected: {
      borderWidth: 2,
      borderColor: colors.text.primary,
      backgroundColor: colors.bg.elevated,
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
      color: colors.text.primary,
      flexShrink: 1,
    },
    riderRating: {
      ...TYPOGRAPHY.body,
      color: colors.text.secondary,
      marginLeft: SPACING.sm,
    },
    riderRoute: {
      ...TYPOGRAPHY.body,
      color: colors.text.primary,
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
      flexWrap: 'wrap',
    },
    riderDetail: {
      ...TYPOGRAPHY.caption,
      color: colors.text.secondary,
    },
    riderDetailDot: {
      ...TYPOGRAPHY.caption,
      color: colors.text.tertiary,
      marginHorizontal: SPACING.xs,
    },
    statusPending: {
      color: colors.text.tertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    statusAccepted: {
      color: colors.text.primary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    priceText: {
      ...TYPOGRAPHY.body,
      color: colors.text.primary,
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
      borderTopColor: colors.border.subtle,
    },
    pendingText: {
      ...TYPOGRAPHY.caption,
      color: colors.text.tertiary,
      flexShrink: 1,
    },
    pendingActions: {
      marginLeft: 'auto',
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    acceptPending: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      backgroundColor: colors.button.primaryBg,
      borderRadius: RADIUS.sm,
    },
    acceptPendingText: {
      ...TYPOGRAPHY.caption,
      color: colors.button.primaryText,
      fontWeight: '700',
    },
    cancelPending: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: RADIUS.sm,
    },
    cancelPendingText: {
      ...TYPOGRAPHY.caption,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    chatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.sm,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: colors.button.primaryBg,
    },
    chatButtonText: {
      ...TYPOGRAPHY.body,
      color: colors.button.primaryText,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    bottomActions: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
      paddingTop: SPACING.sm,
      gap: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      backgroundColor: colors.bg.primary,
    },
    requestButton: {
      flex: 1,
      backgroundColor: colors.button.primaryBg,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
    },
    requestButtonText: {
      ...TYPOGRAPHY.body,
      fontWeight: '700',
      color: colors.button.primaryText,
      letterSpacing: 0.5,
    },
    cancelButton: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      ...TYPOGRAPHY.body,
      color: colors.text.secondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: SPACING.xl,
    },
    emptyTitle: {
      ...TYPOGRAPHY.title,
      color: colors.text.primary,
      marginBottom: SPACING.xs,
    },
    emptyText: {
      ...TYPOGRAPHY.caption,
      color: colors.text.tertiary,
    },
  });
}

export default MatchesScreenNew;
