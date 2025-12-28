import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
<<<<<<< HEAD
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
=======
import { TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
>>>>>>> aditya mule delay zala ahe sagla
import { getStoredRides, getRideRequests, updateRideStatus, updateRide, updateRideRequest } from '../../helpers/rides-storage';
import { addNotification, markNotificationsForRide } from '../../helpers/notifications-storage';
import { useAppTheme } from '../../helpers/use-app-theme';

function filterRidesForUser(rides, user) {
  if (!user || !user.id) {
    return rides;
  }
  return rides.filter((ride) => ride.driverId === user.id);
}

function groupRequestsByRide(requests) {
  const map = {};
  requests.forEach((request) => {
    const key = request.rideId;
    if (!key) {
      return;
    }
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(request);
  });
  return map;
}

function getRequestSummary(list) {
  if (!list || list.length === 0) {
    return {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
    };
  }
  let pending = 0;
  let accepted = 0;
  let rejected = 0;
  list.forEach((item) => {
    if (item.status === 'pending') {
      pending += 1;
      return;
    }
    if (item.status === 'accepted') {
      accepted += 1;
      return;
    }
    if (item.status === 'rejected') {
      rejected += 1;
    }
  });
  return {
    total: list.length,
    pending,
    accepted,
    rejected,
  };
}

function getStatusLabel(status) {
  if (!status) {
    return 'UNKNOWN';
  }
  const value = String(status).toLowerCase();
  if (value === 'available') {
    return 'AVAILABLE';
  }
  if (value === 'pending') {
    return 'PENDING';
  }
  if (value === 'accepted') {
    return 'ACCEPTED';
  }
  if (value === 'completed') {
    return 'COMPLETED';
  }
  if (value === 'cancelled') {
    return 'CANCELLED';
  }
  return value.toUpperCase();
}

<<<<<<< HEAD
function RideCard({ ride, requests, canCancel, onCancelPress, onRequestAction }) {
=======
function RideCard({ ride, requests, canCancel, onCancelPress, onRequestAction, styles }) {
>>>>>>> aditya mule delay zala ahe sagla
  const summary = getRequestSummary(requests);
  const hasRequests = summary.total > 0;

  return (
    <View style={styles.rideCard}>
      <View style={styles.rideHeaderRow}>
        <Text style={styles.rideTitle} numberOfLines={1}>
          {ride.from} → {ride.to}
        </Text>
        <Text style={styles.rideStatus}>{getStatusLabel(ride.status)}</Text>
      </View>
      <View style={styles.rideMetaRow}>
        <Text style={styles.metaText}>{ride.time || 'Scheduled'}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{ride.seats} seat{ride.seats > 1 ? 's' : ''}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>₹{ride.price}</Text>
      </View>
      <Text style={styles.metaSubText}>{ride.vehicleType === 'bike' ? 'Bike' : 'Car'} • {ride.vehicleNumber}</Text>
      {hasRequests ? (
        <View style={styles.requestsPillRow}>
          <Text style={styles.requestsPillText}>
            {summary.total} request{summary.total > 1 ? 's' : ''}
            {summary.pending > 0 ? ` • ${summary.pending} pending` : ''}
            {summary.accepted > 0 ? ` • ${summary.accepted} accepted` : ''}
          </Text>
        </View>
      ) : (
        <View style={styles.requestsPillRowMuted}>
          <Text style={styles.requestsPillMutedText}>No requests yet</Text>
        </View>
      )}
      {hasRequests && (
        <View style={styles.requestsList}>
          {requests.map((request) => {
            const statusValue = String(request.status || '').toLowerCase();
            const isPending = statusValue === 'pending';
            const isAccepted = statusValue === 'accepted';
            const isRejected = statusValue === 'rejected';
            return (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestRow}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName} numberOfLines={1}>
                      {request.seekerName || 'Passenger'}
                    </Text>
                    <Text style={styles.requestMeta} numberOfLines={1}>
                      {request.rideSummary && request.rideSummary.time
                        ? request.rideSummary.time
                        : ride.time || 'Requested'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.requestStatus,
                      isPending && styles.requestStatusPending,
                      isAccepted && styles.requestStatusAccepted,
                      isRejected && styles.requestStatusRejected,
                    ]}
                  >
                    {getStatusLabel(request.status)}
                  </Text>
                </View>
                {isPending && onRequestAction && (
                  <View style={styles.requestActionsRow}>
                    <TouchableOpacity
                      style={styles.requestAccept}
                      onPress={() => onRequestAction(ride, request, true)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Accept this request"
                    >
                      <Text style={styles.requestAcceptText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.requestReject}
                      onPress={() => onRequestAction(ride, request, false)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Reject this request"
                    >
                      <Text style={styles.requestRejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
      {canCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancelPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Cancel this ride"
        >
          <Text style={styles.cancelButtonText}>Cancel ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function MyRidesScreen({ navigation, route }) {
  const currentUser = route.params?.currentUser || null;
  const { colors, statusBarStyle } = useAppTheme();
<<<<<<< HEAD
=======
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
>>>>>>> aditya mule delay zala ahe sagla
  const [rides, setRides] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData(true);
  }, [currentUser?.id]);

  useFocusEffect(
    React.useCallback(() => {
      loadData(false);
    }, [currentUser?.id]),
  );

  async function loadData(isInitial) {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const [storedRides, storedRequests] = await Promise.all([getStoredRides(), getRideRequests()]);
      const scopedRides = filterRidesForUser(storedRides, currentUser);
      setRides(scopedRides);
      setRideRequests(storedRequests);
    } catch (error) {
      setRides([]);
      setRideRequests([]);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadData(false);
  }

  const requestsByRideId = useMemo(() => groupRequestsByRide(rideRequests), [rideRequests]);

  const currentRides = useMemo(
    () => rides.filter((ride) => {
      const status = String(ride.status || '').toLowerCase();
      return status === 'available' || status === 'pending' || status === 'accepted';
    }),
    [rides],
  );

  const pastRides = useMemo(
    () =>
      rides.filter((ride) => {
        const status = String(ride.status || '').toLowerCase();
        return status !== 'available' && status !== 'pending' && status !== 'accepted';
      }),
    [rides],
  );

  async function handleRequestAction(ride, request, accepted) {
    if (!ride || !request) {
      return;
    }
    const nextRideStatus = accepted ? 'accepted' : 'available';
    const nextRequestStatus = accepted ? 'accepted' : 'rejected';

    setRideRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: nextRequestStatus,
            }
          : item,
      ),
    );

    setRides((prev) =>
      prev.map((item) =>
        item.id === ride.id
          ? {
              ...item,
              status: nextRideStatus,
            }
          : item,
      ),
    );

    try {
      await Promise.all([
        updateRide(ride.id, { status: nextRideStatus }),
        updateRideRequest(request.id, { status: nextRequestStatus }),
        addNotification({
          rideId: ride.id,
          requestId: request.id,
          type: accepted ? 'accept' : 'reject',
          title: accepted ? 'Request accepted' : 'Request rejected',
          message: accepted
            ? `${request.driverName || 'Driver'} accepted your ride request.`
            : `${request.driverName || 'Driver'} could not confirm your request.`,
          recipientId: request.seekerId,
          seekerId: request.seekerId,
          allowChat: accepted,
          counterpartyName: request.driverName || 'Driver',
          routeSummary:
            request.rideSummary && request.rideSummary.from && request.rideSummary.to
              ? `${request.rideSummary.from} → ${request.rideSummary.to}`
              : undefined,
        }),
        accepted ? markNotificationsForRide(ride.id, { allowChat: true }) : Promise.resolve(),
      ]);
    } catch (error) {
      loadData(false);
    }
  }

  async function handleCancelRide(rideId) {
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === rideId
          ? {
              ...ride,
              status: 'cancelled',
            }
          : ride,
      ),
    );
    await updateRideStatus(rideId, 'cancelled');
  }

  if (loading) {
    return (
<<<<<<< HEAD
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.bg.primary }]} edges={['top']}>
=======
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
>>>>>>> aditya mule delay zala ahe sagla
        <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
        <ActivityIndicator size="large" color={colors.text.primary} />
      </SafeAreaView>
    );
  }

  return (
<<<<<<< HEAD
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
=======
    <SafeAreaView style={styles.container} edges={['top']}>
>>>>>>> aditya mule delay zala ahe sagla
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.85}
        >
<<<<<<< HEAD
          <ArrowLeft size={24} color={COLORS.text.primary} />
=======
          <ArrowLeft size={24} color={colors.text.primary} />
>>>>>>> aditya mule delay zala ahe sagla
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rides</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
<<<<<<< HEAD
            tintColor={COLORS.text.secondary}
            colors={[COLORS.text.primary]}
=======
            tintColor={colors.text.secondary}
            colors={[colors.text.primary]}
>>>>>>> aditya mule delay zala ahe sagla
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current rides</Text>
          {currentRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No active rides</Text>
              <Text style={styles.emptyText}>Publish a ride to see it here.</Text>
            </View>
          ) : (
            currentRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                requests={requestsByRideId[ride.id] || []}
                canCancel
                onCancelPress={() => handleCancelRide(ride.id)}
                onRequestAction={handleRequestAction}
<<<<<<< HEAD
=======
                styles={styles}
>>>>>>> aditya mule delay zala ahe sagla
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past rides</Text>
          {pastRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No past rides</Text>
              <Text style={styles.emptyText}>Your completed or cancelled rides will appear here.</Text>
            </View>
          ) : (
            pastRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                requests={requestsByRideId[ride.id] || []}
                onRequestAction={handleRequestAction}
<<<<<<< HEAD
=======
                styles={styles}
>>>>>>> aditya mule delay zala ahe sagla
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
=======
function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
>>>>>>> aditya mule delay zala ahe sagla
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
<<<<<<< HEAD
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
=======
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.tertiary,
=======
    color: colors.text.tertiary,
>>>>>>> aditya mule delay zala ahe sagla
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  rideCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: COLORS.border.default,
    backgroundColor: COLORS.bg.card,
=======
    borderColor: colors.border.default,
    backgroundColor: colors.bg.card,
>>>>>>> aditya mule delay zala ahe sagla
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  rideTitle: {
    ...TYPOGRAPHY.body,
<<<<<<< HEAD
    color: COLORS.text.primary,
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
    flex: 1,
    marginRight: SPACING.sm,
  },
  rideStatus: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.secondary,
=======
    color: colors.text.secondary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  rideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.secondary,
  },
  metaDot: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
=======
    color: colors.text.secondary,
  },
  metaDot: {
    ...TYPOGRAPHY.caption,
    color: colors.text.tertiary,
>>>>>>> aditya mule delay zala ahe sagla
    marginHorizontal: 4,
  },
  metaSubText: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.tertiary,
=======
    color: colors.text.tertiary,
>>>>>>> aditya mule delay zala ahe sagla
    marginBottom: SPACING.sm,
  },
  requestsPillRow: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: COLORS.border.default,
=======
    borderColor: colors.border.default,
>>>>>>> aditya mule delay zala ahe sagla
    alignSelf: 'flex-start',
  },
  requestsPillText: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.primary,
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  requestsPillRowMuted: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: COLORS.border.subtle,
=======
    borderColor: colors.border.subtle,
>>>>>>> aditya mule delay zala ahe sagla
    alignSelf: 'flex-start',
  },
  requestsPillMutedText: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.tertiary,
=======
    color: colors.text.tertiary,
  },
  requestsList: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  requestItem: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    backgroundColor: colors.bg.elevated,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    ...TYPOGRAPHY.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  requestMeta: {
    ...TYPOGRAPHY.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  requestStatus: {
    ...TYPOGRAPHY.caption,
    color: colors.text.tertiary,
    fontWeight: '700',
  },
  requestStatusPending: {
    color: colors.text.tertiary,
  },
  requestStatusAccepted: {
    color: colors.state.success,
  },
  requestStatusRejected: {
    color: colors.state.error,
  },
  requestActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  requestAccept: {
    flex: 1,
    backgroundColor: colors.button.primaryBg,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs + 2,
    alignItems: 'center',
  },
  requestAcceptText: {
    ...TYPOGRAPHY.caption,
    color: colors.button.primaryText,
    fontWeight: '700',
  },
  requestReject: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.button.secondaryBorder,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs + 2,
    alignItems: 'center',
  },
  requestRejectText: {
    ...TYPOGRAPHY.caption,
    color: colors.button.secondaryText,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: colors.text.secondary,
    fontWeight: '600',
>>>>>>> aditya mule delay zala ahe sagla
  },
  emptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
<<<<<<< HEAD
    color: COLORS.text.primary,
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
    marginBottom: SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.secondary,
=======
    color: colors.text.secondary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  bottomSpacer: {
    height: 80,
  },
<<<<<<< HEAD
});
=======
  });
}
>>>>>>> aditya mule delay zala ahe sagla

export default MyRidesScreen;

