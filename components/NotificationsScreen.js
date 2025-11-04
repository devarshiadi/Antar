import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Car,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  Settings,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const NotificationsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'matches', 'trips', 'alerts'

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

  const filterNotifications = () => {
    if (selectedFilter === 'all') return notifications;
    if (selectedFilter === 'matches') return notifications.filter(n => n.type === 'match');
    if (selectedFilter === 'trips') return notifications.filter(n => n.type === 'trip');
    if (selectedFilter === 'alerts') return notifications.filter(n => n.type === 'alert');
    return notifications;
  };

  const filteredNotifications = filterNotifications();
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
        <TouchableOpacity onPress={() => console.log('Settings')}>
          <Settings size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity 
            style={[
              styles.filterChip,
              selectedFilter === 'all' && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Bell size={16} color={selectedFilter === 'all' ? '#000' : '#888'} />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'all' && styles.filterChipTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterChip,
              selectedFilter === 'matches' && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter('matches')}
          >
            <User size={16} color={selectedFilter === 'matches' ? '#000' : '#888'} />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'matches' && styles.filterChipTextActive
            ]}>
              Matches
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterChip,
              selectedFilter === 'trips' && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter('trips')}
          >
            <Car size={16} color={selectedFilter === 'trips' ? '#000' : '#888'} />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'trips' && styles.filterChipTextActive
            ]}>
              Trips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterChip,
              selectedFilter === 'alerts' && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter('alerts')}
          >
            <AlertTriangle size={16} color={selectedFilter === 'alerts' ? '#000' : '#888'} />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'alerts' && styles.filterChipTextActive
            ]}>
              Alerts
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton}>
            <CheckCircle size={18} color="#4CAF50" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}

        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Bell size={48} color="#333" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
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
  filterContainer: {
    marginBottom: 15,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  filterChipTextActive: {
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
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
