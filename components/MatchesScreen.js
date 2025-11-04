import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Car,
  User,
  MessageCircle,
  CheckCircle,
  XCircle,
  Navigation2,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const MatchesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'pending', 'accepted'

  const matches = {
    available: [
      {
        id: 1,
        user: { name: 'Rajesh Kumar', rating: 4.8, trips: 45, avatar: null },
        route: { from: 'MG Road', to: 'Whitefield' },
        matchScore: 95,
        time: '8:30 AM',
        price: 120,
        seats: 2,
        distance: '12 km',
        type: 'rider',
      },
      {
        id: 2,
        user: { name: 'Priya Sharma', rating: 4.9, trips: 67, avatar: null },
        route: { from: 'Koramangala', to: 'Electronic City' },
        matchScore: 88,
        time: '9:00 AM',
        price: 80,
        seats: 1,
        distance: '8 km',
        type: 'rider',
      },
    ],
    pending: [
      {
        id: 3,
        user: { name: 'Amit Patel', rating: 4.7, trips: 32, avatar: null },
        route: { from: 'Indiranagar', to: 'HSR Layout' },
        matchScore: 82,
        time: '7:45 AM',
        price: 100,
        seats: 1,
        distance: '6 km',
        type: 'passenger',
        status: 'Waiting for response',
      },
    ],
    accepted: [
      {
        id: 4,
        user: { name: 'Sneha Reddy', rating: 5.0, trips: 89, avatar: null },
        route: { from: 'Marathahalli', to: 'Bellandur' },
        matchScore: 92,
        time: '8:15 AM',
        price: 60,
        seats: 1,
        distance: '4 km',
        type: 'rider',
        status: 'Trip confirmed',
      },
    ],
  };

  const handleAccept = (matchId) => {
    console.log('Accepted match:', matchId);
    // Show confirmation and navigate to trip details
  };

  const handleReject = (matchId) => {
    console.log('Rejected match:', matchId);
  };

  const MatchCard = ({ match }) => {
    const isAvailable = activeTab === 'available';
    const isPending = activeTab === 'pending';
    const isAccepted = activeTab === 'accepted';

    return (
      <View style={styles.matchCard}>
        {/* Match Score Badge */}
        <View style={styles.matchScoreBadge}>
          <Text style={styles.matchScoreText}>{match.matchScore}%</Text>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <User size={24} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{match.user.name}</Text>
            <View style={styles.userMeta}>
              <Star size={14} color="#FFC107" fill="#FFC107" />
              <Text style={styles.userRating}>{match.user.rating}</Text>
              <Text style={styles.userTrips}>• {match.user.trips} trips</Text>
            </View>
          </View>
          <View style={[styles.typeBadge, match.type === 'rider' ? styles.riderBadge : styles.passengerBadge]}>
            {match.type === 'rider' ? <Car size={14} color="#fff" /> : <User size={14} color="#fff" />}
            <Text style={styles.typeBadgeText}>{match.type === 'rider' ? 'Driver' : 'Passenger'}</Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeSection}>
          <View style={styles.routeItem}>
            <MapPin size={16} color="#4CAF50" />
            <Text style={styles.routeText}>{match.route.from}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeItem}>
            <Navigation2 size={16} color="#f00" />
            <Text style={styles.routeText}>{match.route.to}</Text>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Clock size={16} color="#888" />
            <Text style={styles.detailText}>{match.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={16} color="#888" />
            <Text style={styles.detailText}>{match.distance}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.priceText}>₹{match.price}</Text>
          </View>
          {match.type === 'rider' && (
            <View style={styles.detailItem}>
              <User size={16} color="#888" />
              <Text style={styles.detailText}>{match.seats} seats</Text>
            </View>
          )}
        </View>

        {/* Status or Actions */}
        {isAvailable && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(match.id)}
            >
              <XCircle size={20} color="#fff" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccept(match.id)}
            >
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPending && (
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>{match.status}</Text>
          </View>
        )}

        {isAccepted && (
          <View style={styles.actionsSection}>
            <TouchableOpacity style={[styles.actionButton, styles.chatButton]}>
              <MessageCircle size={20} color="#fff" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.viewButton]}>
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>Matches</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available ({matches.available.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({matches.pending.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            Accepted ({matches.accepted.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {matches[activeTab].length > 0 ? (
          matches[activeTab].map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>Check back later for new matches</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  matchCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    position: 'relative',
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingRight: 60,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userRating: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  userTrips: {
    fontSize: 13,
    color: '#888',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  riderBadge: {
    backgroundColor: '#2196F3',
  },
  passengerBadge: {
    backgroundColor: '#9C27B0',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeSection: {
    marginBottom: 15,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#333',
    marginLeft: 7,
    marginBottom: 8,
  },
  detailsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#ccc',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#333',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  chatButton: {
    backgroundColor: '#2196F3',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  viewButton: {
    backgroundColor: '#fff',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  statusSection: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
});

export default MatchesScreen;
