import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Car,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  Bell,
} from 'lucide-react-native';

const NotificationsScreen = ({ navigation }) => {
  const [selectedFilter] = useState('all'); // Keep the filter state but only use 'all'
  const notifications = [
    {
      id: 1,
      type: 'match',
      title: 'New Match Found!',
      message: 'Rajesh Kumar is going your way with 95% route match',
      time: '5 mins ago',
      icon: CheckCircle,
      color: '#4CAF50',
      read: false,
      actionable: true,
    },
    {
      id: 2,
      type: 'trip',
      title: 'Trip Confirmed',
      message: 'Your trip to Whitefield has been confirmed for 8:30 AM',
      time: '15 mins ago',
      icon: Car,
      color: '#2196F3',
      read: false,
      actionable: false,
    },
    {
      id: 3,
      type: 'message',
      title: 'New Message',
      message: 'Priya Sharma: "I\'ll be there in 5 minutes"',
      time: '1 hour ago',
      icon: MessageCircle,
      color: '#9C27B0',
      read: true,
      actionable: false,
    },
    {
      id: 4,
      type: 'match',
      title: 'Match Request',
      message: 'Amit Patel wants to join your ride to HSR Layout',
      time: '2 hours ago',
      icon: User,
      color: '#FF9800',
      read: true,
      actionable: true,
    },
    {
      id: 5,
      type: 'alert',
      title: 'Route Deviation Alert',
      message: 'Driver has deviated from the planned route',
      time: '3 hours ago',
      icon: AlertTriangle,
      color: '#f44336',
      read: true,
      actionable: false,
    },
    {
      id: 6,
      type: 'achievement',
      title: 'Milestone Reached! 🎉',
      message: 'You\'ve completed 50 trips! Keep riding!',
      time: '1 day ago',
      icon: TrendingUp,
      color: '#FFC107',
      read: true,
      actionable: false,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationCard = ({ notification }) => {
    const IconComponent = notification.icon;
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadCard
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: notification.color }]}>
          <IconComponent size={22} color="#fff" />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>{notification.time}</Text>

          {notification.actionable && !notification.read && (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.acceptButton}>
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton}>
                <XCircle size={16} color="#fff" />
                <Text style={styles.rejectText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList}>
        {notifications.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationsList: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    gap: 6,
  },
  acceptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
    gap: 6,
  },
  rejectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
});

export default NotificationsScreen;
