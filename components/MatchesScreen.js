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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

const MatchesScreen = ({ navigation, route }) => {
  const { city, tripType, userLocation } = route.params || {};
  // Sample data with city information and status
  const allRiders = [
    {
      id: 1,
      user: { name: 'Rajesh Kumar', rating: 4.8, trips: 45, avatar: null },
      route: { from: 'MG Road', to: 'Whitefield', city: 'Bangalore' },
      location: { latitude: 12.9716, longitude: 77.5946 },
      matchScore: 95,
      time: '8:30 AM',
      price: 120,
      seats: 2,
      distance: '12 km',
      type: 'rider',
      requestStatus: 'available',
    },
    {
      id: 2,
      user: { name: 'Priya Sharma', rating: 4.9, trips: 67, avatar: null },
      route: { from: 'Koramangala', to: 'Electronic City', city: 'Bangalore' },
      location: { latitude: 12.9352, longitude: 77.6245 },
      matchScore: 88,
      time: '9:00 AM',
      price: 80,
      seats: 1,
      distance: '8 km',
      type: 'rider',
      requestStatus: 'available',
    },
    {
      id: 3,
      user: { name: 'Amit Patel', rating: 4.7, trips: 32, avatar: null },
      route: { from: 'Marine Drive', to: 'Bandra', city: 'Mumbai' },
      location: { latitude: 18.9432, longitude: 72.8236 },
      matchScore: 92,
      time: '9:30 AM',
      price: 200,
      seats: 2,
      distance: '15 km',
      type: 'rider',
      requestStatus: 'available',
    },
    {
      id: 4,
      user: { name: 'Suresh Singh', rating: 4.6, trips: 28, avatar: null },
      route: { from: 'Indiranagar', to: 'HSR Layout', city: 'Bangalore' },
      location: { latitude: 12.9719, longitude: 77.6412 },
      matchScore: 82,
      time: '7:45 AM',
      price: 100,
      seats: 1,
      distance: '6 km',
      type: 'rider',
      requestStatus: 'pending',
    },
    {
      id: 5,
      user: { name: 'Sneha Reddy', rating: 5.0, trips: 89, avatar: null },
      route: { from: 'Marathahalli', to: 'Bellandur', city: 'Bangalore' },
      location: { latitude: 12.9591, longitude: 77.6974 },
      matchScore: 92,
      time: '8:15 AM',
      price: 60,
      seats: 1,
      distance: '4 km',
      type: 'rider',
      requestStatus: 'accepted',
    },
  ];

  let allMatches = allRiders;

  if (tripType === 'find' && userLocation) {
    const MAX_DISTANCE_KM = 20;
    allMatches = allRiders
      .map(rider => {
        const distanceFromUser = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          rider.location.latitude,
          rider.location.longitude
        );
        return { ...rider, distanceFromUser };
      })
      .filter(rider => rider.distanceFromUser <= MAX_DISTANCE_KM)
      .sort((a, b) => a.distanceFromUser - b.distanceFromUser);
  } else if (city) {
    allMatches = allRiders.filter(rider => 
      rider.route.city.toLowerCase() === city.toLowerCase()
    );
  }

  const pageTitle = tripType === 'find' ? 'Available Drivers' : tripType === 'offer' ? 'Ride Posted' : 'Matches';

  const handleRequestRide = (matchId) => {
    console.log('Requested ride:', matchId);
    // Handle ride request logic here
    // You can navigate to trip details or show confirmation
  };

  const handleChatPress = (matchId) => {
    navigation.navigate('Chat', { matchId });
  };

  const MatchCard = ({ match }) => {
    const isAvailable = match.requestStatus === 'available';
    const isPending = match.requestStatus === 'pending';
    const isAccepted = match.requestStatus === 'accepted';

    return (
      <View style={styles.matchCard}>
        {/* Match Score Badge */}
        <View style={styles.matchScoreBadge}>
          <Text style={styles.matchScoreText}>{match.matchScore}%</Text>
        </View>
        
        {/* Status Badge */}
        {(isPending || isAccepted) && (
          <View style={[
            styles.statusBadge,
            isPending && styles.pendingBadge,
            isAccepted && styles.acceptedBadge
          ]}>
            <Text style={styles.statusBadgeText}>
              {isPending ? 'Pending' : 'Accepted'}
            </Text>
          </View>
        )}

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
          {match.distanceFromUser && (
            <View style={styles.detailItem}>
              <MapPin size={16} color="#4CAF50" />
              <Text style={[styles.detailText, { color: '#4CAF50', fontWeight: '600' }]}>
                {match.distanceFromUser.toFixed(1)} km away
              </Text>
            </View>
          )}
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
          <TouchableOpacity 
            style={styles.requestRideButton}
            onPress={() => handleRequestRide(match.id)}
          >
            <Car size={20} color="#fff" />
            <Text style={styles.requestRideButtonText}>Request for Ride</Text>
          </TouchableOpacity>
        )}

        {isPending && (
          <View style={styles.pendingSection}>
            <Clock size={18} color="#FFC107" />
            <Text style={styles.pendingText}>Waiting for rider's response</Text>
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => handleChatPress(match.id)}
          >
            <MessageCircle size={20} color="#fff" />
            <Text style={styles.chatButtonText}>Chat with Rider</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Show message if no riders found in the city
  if (city && allMatches.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.noRidersText}>No riders available in {city} yet.</Text>
        <Text style={styles.noRidersSubtext}>Please check back later or try a different location.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {tripType === 'find' && (
        <View style={styles.cityHeader}>
          <MapPin size={18} color="#4CAF50" />
          <Text style={styles.cityText}>
            {userLocation 
              ? `Showing drivers within 20 km ${city ? `in ${city}` : 'of your location'}`
              : (city ? `Showing drivers in ${city}` : 'Showing all available drivers')
            }
          </Text>
        </View>
      )}
      
      {tripType === 'offer' && (
        <View style={[styles.cityHeader, { backgroundColor: '#1a4d1a' }]}>
          <CheckCircle size={18} color="#4CAF50" />
          <Text style={styles.cityText}>Your ride has been posted successfully!</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pageTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* All Matches List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {allMatches.length > 0 ? (
          allMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {tripType === 'find' && userLocation 
                ? 'No drivers found within 20 km'
                : 'No matches found'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {tripType === 'find' && userLocation 
                ? 'Try again later or expand your search radius'
                : 'Check back later for new matches'
              }
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#1a1a1a',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  cityText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  noRidersText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  noRidersSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  matchCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  matchScoreText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pendingBadge: {
    backgroundColor: '#FFB300',
    shadowColor: '#FFB300',
  },
  acceptedBadge: {
    backgroundColor: '#00C853',
    shadowColor: '#00C853',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingRight: 60,
    marginTop: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
    marginBottom: 18,
    backgroundColor: '#252525',
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.2,
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
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#4CAF50',
    letterSpacing: 0.5,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    gap: 10,
    marginTop: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  pendingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    marginTop: 8,
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB300',
    letterSpacing: 0.3,
  },
  viewButton: {
    backgroundColor: '#fff',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  requestRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    gap: 10,
    marginTop: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  requestRideButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
