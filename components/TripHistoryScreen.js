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
  MapPin,
  Navigation2,
  Calendar,
  Star,
  User,
  Car,
  TrendingUp,
  DollarSign,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const TripHistoryScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'rider', 'passenger'

  const trips = [
    {
      id: 1,
      date: '2024-11-04',
      time: '09:30 AM',
      from: 'MG Road',
      to: 'Whitefield',
      distance: '12 km',
      fare: 120,
      type: 'passenger',
      partner: { name: 'Rajesh Kumar', rating: 4.8 },
      status: 'completed',
    },
    {
      id: 2,
      date: '2024-11-03',
      time: '06:15 PM',
      from: 'Koramangala',
      to: 'Indiranagar',
      distance: '8 km',
      fare: 80,
      type: 'rider',
      partner: { name: 'Priya Sharma', rating: 4.9 },
      status: 'completed',
    },
    {
      id: 3,
      date: '2024-11-02',
      time: '08:00 AM',
      from: 'HSR Layout',
      to: 'Electronic City',
      distance: '15 km',
      fare: 150,
      type: 'passenger',
      partner: { name: 'Amit Patel', rating: 4.7 },
      status: 'completed',
    },
    {
      id: 4,
      date: '2024-11-01',
      time: '07:30 PM',
      from: 'Marathahalli',
      to: 'Bellandur',
      distance: '6 km',
      fare: 60,
      type: 'rider',
      partner: { name: 'Sneha Reddy', rating: 5.0 },
      status: 'completed',
    },
  ];

  const stats = {
    totalTrips: 45,
    totalSaved: 4500,
    avgRating: 4.8,
  };

  const filteredTrips = selectedFilter === 'all' 
    ? trips 
    : trips.filter(trip => trip.type === selectedFilter);

  const TripCard = ({ trip }) => (
    <TouchableOpacity style={styles.tripCard}>
      {/* Type Badge */}
      <View style={[
        styles.typeBadge,
        trip.type === 'rider' ? styles.riderBadge : styles.passengerBadge
      ]}>
        {trip.type === 'rider' ? <Car size={12} color="#fff" /> : <User size={12} color="#fff" />}
        <Text style={styles.typeBadgeText}>
          {trip.type === 'rider' ? 'Driver' : 'Passenger'}
        </Text>
      </View>

      {/* Date & Time */}
      <View style={styles.tripHeader}>
        <View style={styles.dateInfo}>
          <Calendar size={16} color="#888" />
          <Text style={styles.dateText}>{trip.date}</Text>
          <Text style={styles.timeText}>{trip.time}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <View style={styles.routeDot} />
          <Text style={styles.locationText}>{trip.from}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <Navigation2 size={14} color="#4CAF50" />
          <Text style={styles.locationText}>{trip.to}</Text>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.tripFooter}>
        <View style={styles.partnerInfo}>
          <View style={styles.partnerAvatar}>
            <User size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.partnerName}>{trip.partner.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color="#FFC107" fill="#FFC107" />
              <Text style={styles.ratingText}>{trip.partner.rating}</Text>
            </View>
          </View>
        </View>
        <View style={styles.footerRight}>
          <View style={styles.distanceInfo}>
            <MapPin size={14} color="#888" />
            <Text style={styles.distanceText}>{trip.distance}</Text>
          </View>
          <Text style={styles.priceAmount}>₹{trip.fare}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{stats.totalTrips}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={24} color="#FFC107" />
            <Text style={styles.statValue}>₹{stats.totalSaved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={24} color="#2196F3" />
            <Text style={styles.statValue}>{stats.avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === 'all' && styles.filterTextActive
            ]}>
              All ({trips.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterButton,
              selectedFilter === 'rider' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('rider')}
          >
            <Car size={16} color={selectedFilter === 'rider' ? '#000' : '#888'} />
            <Text style={[
              styles.filterText,
              selectedFilter === 'rider' && styles.filterTextActive
            ]}>
              As Driver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterButton,
              selectedFilter === 'passenger' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('passenger')}
          >
            <User size={16} color={selectedFilter === 'passenger' ? '#000' : '#888'} />
            <Text style={[
              styles.filterText,
              selectedFilter === 'passenger' && styles.filterTextActive
            ]}>
              As Passenger
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trips List */}
        <View style={styles.tripsContainer}>
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </View>

        {filteredTrips.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No trips found</Text>
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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  filterTextActive: {
    color: '#000',
  },
  tripsContainer: {
    paddingHorizontal: 20,
  },
  tripCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  riderBadge: {
    backgroundColor: '#2196F3',
  },
  passengerBadge: {
    backgroundColor: '#9C27B0',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingRight: 70,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 13,
    color: '#888',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  routeContainer: {
    marginBottom: 15,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#333',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tripPartner: {
    fontSize: 12,
    color: '#ccc',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: '600',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    color: '#888',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});

export default TripHistoryScreen;
