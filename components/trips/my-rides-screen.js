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
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
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

function RideCard({ ride, requests, canCancel, onCancelPress, onRequestAction }) {
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
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
        <ActivityIndicator size="large" color={colors.text.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.85}
        >
          <ArrowLeft size={24} color={COLORS.text.primary} />
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
            tintColor={COLORS.text.secondary}
            colors={[COLORS.text.primary]}
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
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  rideCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    backgroundColor: COLORS.bg.card,
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
    color: COLORS.text.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  rideStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  rideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  metaDot: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginHorizontal: 4,
  },
  metaSubText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.sm,
  },
  requestsPillRow: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    alignSelf: 'flex-start',
  },
  requestsPillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.primary,
  },
  requestsPillRowMuted: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    alignSelf: 'flex-start',
  },
  requestsPillMutedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  emptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default MyRidesScreen;

