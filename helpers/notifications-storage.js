import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = '@ride_notifications';

function parseStoredNotifications(value) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function saveNotifications(items) {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
}

export async function getNotifications() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const items = parseStoredNotifications(stored);
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Failed to read notifications:', error);
    return [];
  }
}

export async function getNotificationsForUser(userId) {
  const notifications = await getNotifications();
  if (!userId) {
    return notifications;
  }
  return notifications.filter((item) => !item.recipientId || item.recipientId === userId);
}

export async function addNotification(notification) {
  const items = await getNotifications();
  const next = {
    id: notification.id ?? String(Date.now()),
    createdAt: Date.now(),
    read: false,
    ...notification,
  };
  const updated = [next, ...items];
  await saveNotifications(updated);
  return next;
}

export async function updateNotification(notificationId, updates) {
  const items = await getNotifications();
  const updated = items.map((item) => (item.id === notificationId ? { ...item, ...updates } : item));
  await saveNotifications(updated);
  return updated.find((item) => item.id === notificationId) || null;
}

export async function removeNotification(notificationId) {
  const items = await getNotifications();
  const filtered = items.filter((item) => item.id !== notificationId);
  await saveNotifications(filtered);
}

export async function markNotificationsForRide(rideId, updates) {
  const items = await getNotifications();
  const updated = items.map((item) =>
    item.rideId === rideId ? { ...item, ...updates } : item,
  );
  await saveNotifications(updated);
  return updated.filter((item) => item.rideId === rideId);
}
