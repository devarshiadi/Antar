import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, X, MessageCircle } from 'lucide-react-native';
<<<<<<< HEAD
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
=======
import { TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
>>>>>>> aditya mule delay zala ahe sagla
import {
  getNotificationsForUser,
  updateNotification,
  removeNotification,
  addNotification,
} from '../helpers/notifications-storage';
import { updateRide, updateRideRequest } from '../helpers/rides-storage';
import { useAppTheme } from '../helpers/use-app-theme';

function NotificationsScreenNew({ navigation, route }) {
  const routeUser = route.params?.user || null;
  const { colors, statusBarStyle } = useAppTheme();
<<<<<<< HEAD
=======
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
>>>>>>> aditya mule delay zala ahe sagla
  const [currentUser, setCurrentUser] = useState(routeUser || null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    const items = await getNotificationsForUser(currentUser?.id);
    setNotifications(items);
    setLoading(false);
  }

  useEffect(() => {
    async function hydrateUser() {
      if (routeUser && routeUser.id) {
        setCurrentUser(routeUser);
        return;
      }
      if (currentUser && currentUser.id) {
        return;
      }
      try {
        const stored = await AsyncStorage.getItem('user');
        if (!stored) {
          return;
        }
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
        }
      } catch (error) {
      }
    }
    hydrateUser();
  }, [routeUser?.id]);

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
<<<<<<< HEAD
              <MessageCircle size={14} color={COLORS.bg.primary} />
=======
              <MessageCircle size={14} color={colors.button.primaryText} />
>>>>>>> aditya mule delay zala ahe sagla
              <Text style={styles.chatButtonText}>Open Chat</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (isRequestForCurrentUser) {
        return (
          <View style={styles.notificationActions}>
            <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(notification)}>
<<<<<<< HEAD
              <CheckCircle size={14} color={COLORS.text.primary} />
=======
              <CheckCircle size={14} color={colors.button.primaryText} />
>>>>>>> aditya mule delay zala ahe sagla
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
<<<<<<< HEAD
            <MessageCircle size={14} color={COLORS.bg.primary} />
=======
            <MessageCircle size={14} color={colors.button.primaryText} />
>>>>>>> aditya mule delay zala ahe sagla
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
<<<<<<< HEAD
          <X size={18} color={COLORS.text.tertiary} />
=======
          <X size={18} color={colors.text.tertiary} />
>>>>>>> aditya mule delay zala ahe sagla
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  return (
<<<<<<< HEAD
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
=======
    <SafeAreaView style={styles.container} edges={['top']}>
>>>>>>> aditya mule delay zala ahe sagla
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
<<<<<<< HEAD
          <ArrowLeft size={24} color={COLORS.text.primary} />
=======
          <ArrowLeft size={24} color={colors.text.primary} />
>>>>>>> aditya mule delay zala ahe sagla
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

<<<<<<< HEAD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
=======
function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
<<<<<<< HEAD
    borderBottomColor: COLORS.border.subtle,
=======
    borderBottomColor: colors.border.subtle,
>>>>>>> aditya mule delay zala ahe sagla
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
<<<<<<< HEAD
    color: COLORS.text.primary,
  },
  unreadBadge: {
    backgroundColor: COLORS.text.primary,
=======
    color: colors.text.primary,
  },
  unreadBadge: {
    backgroundColor: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
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
<<<<<<< HEAD
    color: COLORS.bg.primary,
=======
    color: colors.bg.primary,
>>>>>>> aditya mule delay zala ahe sagla
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
<<<<<<< HEAD
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
  },
  unreadCard: {
    borderColor: COLORS.border.strong,
    backgroundColor: COLORS.bg.elevated,
=======
    borderColor: colors.border.default,
    borderRadius: RADIUS.sm,
  },
  unreadCard: {
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.elevated,
>>>>>>> aditya mule delay zala ahe sagla
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
<<<<<<< HEAD
    color: COLORS.text.primary,
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
<<<<<<< HEAD
    backgroundColor: COLORS.text.primary,
  },
  notificationMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
=======
    backgroundColor: colors.text.primary,
  },
  notificationMessage: {
    ...TYPOGRAPHY.body,
    color: colors.text.secondary,
>>>>>>> aditya mule delay zala ahe sagla
    marginBottom: SPACING.xs,
  },
  notificationTime: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.text.tertiary,
=======
    color: colors.text.tertiary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  notificationActions: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
<<<<<<< HEAD
    borderTopColor: COLORS.border.subtle,
=======
    borderTopColor: colors.border.subtle,
>>>>>>> aditya mule delay zala ahe sagla
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: COLORS.button.primaryBg,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.button.primaryBg,
  },
  acceptText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.button.primaryText,
=======
    borderColor: colors.button.primaryBg,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.button.primaryBg,
  },
  acceptText: {
    ...TYPOGRAPHY.caption,
    color: colors.button.primaryText,
>>>>>>> aditya mule delay zala ahe sagla
    fontWeight: '600',
  },
  rejectButton: {
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: COLORS.button.secondaryBorder,
=======
    borderColor: colors.button.secondaryBorder,
>>>>>>> aditya mule delay zala ahe sagla
    borderRadius: RADIUS.sm,
  },
  rejectText: {
    ...TYPOGRAPHY.caption,
<<<<<<< HEAD
    color: COLORS.button.secondaryText,
=======
    color: colors.button.secondaryText,
>>>>>>> aditya mule delay zala ahe sagla
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
<<<<<<< HEAD
    color: COLORS.text.primary,
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
<<<<<<< HEAD
    color: COLORS.text.tertiary,
=======
    color: colors.text.tertiary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
<<<<<<< HEAD
    backgroundColor: COLORS.button.primaryBg,
  },
  chatButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.button.primaryText,
    fontWeight: '600',
  },
});
=======
    backgroundColor: colors.button.primaryBg,
  },
  chatButtonText: {
    ...TYPOGRAPHY.caption,
    color: colors.button.primaryText,
    fontWeight: '600',
  },
  });
}
>>>>>>> aditya mule delay zala ahe sagla

export default NotificationsScreenNew;
