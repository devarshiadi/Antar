import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, X, MessageCircle } from 'lucide-react-native';
import { TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import {
  getNotificationsForUser,
  updateNotification,
  removeNotification,
  addNotification,
} from '../helpers/notifications-storage';
import { updateRide, updateRideRequest } from '../helpers/rides-storage';
import { useAppTheme } from '../helpers/use-app-theme';
import { useSession } from '../helpers/session-context';

function NotificationsScreenNew({ navigation, route }) {
  const routeUser = route.params?.user || null;
  const { user: sessionUser } = useSession();
  const { colors, statusBarStyle } = useAppTheme();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const currentUser = routeUser || sessionUser || null;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    const items = await getNotificationsForUser(currentUser?.id);
    setNotifications(items);
    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadNotifications);
    return unsubscribe;
  }, [navigation, currentUser?.id]);

  async function handleDismiss(notificationId) {
    await removeNotification(notificationId);
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
  }

  async function handleAccept(notification) {
    if (!notification.requestId || !notification.rideId || !notification.seekerId) {
      return;
    }
    await Promise.all([
      updateRide(notification.rideId, { status: 'accepted' }),
      updateRideRequest(notification.requestId, { status: 'accepted' }),
      updateNotification(notification.id, { allowChat: true }),
      addNotification({
        rideId: notification.rideId,
        requestId: notification.requestId,
        type: 'accept',
        title: 'Request accepted',
        message: `${currentUser?.name || 'Driver'} accepted your ride request.`,
        recipientId: notification.seekerId,
        seekerId: notification.seekerId,
        allowChat: true,
        counterpartyName: currentUser?.name || 'Driver',
        routeSummary: notification.routeSummary || notification.message,
      }),
    ]);
    loadNotifications();
  }

  async function handleReject(notification) {
    if (!notification.requestId || !notification.rideId || !notification.seekerId) {
      return;
    }
    await Promise.all([
      updateRide(notification.rideId, { status: 'available' }),
      updateRideRequest(notification.requestId, { status: 'rejected' }),
      removeNotification(notification.id),
      addNotification({
        rideId: notification.rideId,
        requestId: notification.requestId,
        type: 'reject',
        title: 'Request rejected',
        message: `${currentUser?.name || 'Driver'} could not confirm your request.`,
        recipientId: notification.seekerId,
        seekerId: notification.seekerId,
        counterpartyName: currentUser?.name || 'Driver',
        routeSummary: notification.routeSummary || notification.message,
      }),
    ]);
    loadNotifications();
  }

  async function markAsRead(notificationId) {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    );
    await updateNotification(notificationId, { read: true });
  }

  function handleOpenChat(notification) {
    if (!notification.allowChat || !notification.rideId) {
      return;
    }
    navigation.navigate('Chat', {
      matchId: notification.rideId,
      contact: {
        name: notification.counterpartyName || 'Ride partner',
        route: notification.routeSummary || notification.message,
      },
    });
  }

  function renderActions(notification) {
    const isRequestForCurrentUser =
      notification.type === 'request' &&
      (!currentUser || !notification.recipientId || notification.recipientId === currentUser.id);

    if (notification.type === 'request') {
      if (notification.allowChat) {
        return (
          <View style={styles.notificationActions}>
            <TouchableOpacity style={styles.chatButton} onPress={() => handleOpenChat(notification)}>
              <MessageCircle size={14} color={colors.button.primaryText} />
              <Text style={styles.chatButtonText}>Open Chat</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (isRequestForCurrentUser) {
        return (
          <View style={styles.notificationActions}>
            <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(notification)}>
              <CheckCircle size={14} color={colors.button.primaryText} />
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(notification)}>
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return null;
    }

    if (notification.allowChat) {
      return (
        <View style={styles.notificationActions}>
          <TouchableOpacity style={styles.chatButton} onPress={() => handleOpenChat(notification)}>
            <MessageCircle size={14} color={colors.button.primaryText} />
            <Text style={styles.chatButtonText}>Open Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }

  function NotificationCard({ notification }) {
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !notification.read && styles.unreadCard]}
        onPress={() => markAsRead(notification.id)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>{new Date(notification.createdAt).toLocaleString()}</Text>

          {renderActions(notification)}
        </View>

        <TouchableOpacity style={styles.dismissButton} onPress={() => handleDismiss(notification.id)}>
          <X size={18} color={colors.text.tertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    color: colors.text.primary,
  },
  unreadBadge: {
    backgroundColor: colors.text.primary,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.bg.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.sm,
  },
  unreadCard: {
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.elevated,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.primary,
  },
  notificationMessage: {
    ...TYPOGRAPHY.body,
    color: colors.text.secondary,
    marginBottom: SPACING.xs,
  },
  notificationTime: {
    ...TYPOGRAPHY.caption,
    color: colors.text.tertiary,
  },
  notificationActions: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.button.primaryBg,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.button.primaryBg,
  },
  acceptText: {
    ...TYPOGRAPHY.caption,
    color: colors.button.primaryText,
    fontWeight: '600',
  },
  rejectButton: {
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.button.secondaryBorder,
    borderRadius: RADIUS.sm,
  },
  rejectText: {
    ...TYPOGRAPHY.caption,
    color: colors.button.secondaryText,
    fontWeight: '600',
  },
  dismissButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.title,
    color: colors.text.primary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: colors.text.tertiary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: colors.button.primaryBg,
  },
  chatButtonText: {
    ...TYPOGRAPHY.caption,
    color: colors.button.primaryText,
    fontWeight: '600',
  },
  });
}

export default NotificationsScreenNew;
