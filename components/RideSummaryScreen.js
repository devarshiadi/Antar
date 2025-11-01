import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Used for the Star icons

// --- Custom Payment Toggle Component ---
const PaymentToggle = ({ selected, onSelect }) => {
  const options = ['Card', 'Cash'];
  return (
    <View style={styles.toggleContainer}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.toggleOption,
            selected === option && styles.toggleSelected,
            index === 0 ? styles.toggleLeft : styles.toggleRight,
          ]}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.toggleText,
              selected === option ? styles.toggleTextSelected : styles.toggleText,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- Main Screen Component ---
const RideSummaryScreen = () => {
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Initial state set to 'Cash' based on image
  const [rating, setRating] = useState(4); // 4 stars based on image
  const [note, setNote] = useState('');

  // Hardcoded fare data based on the image
  const fareBreakdown = {
    'Base Fare': 3.0,
    'Distance (4.2km):': 8.4,
    'Time (12 min)': 3.4,
    'Service Fee': 2.4,
    'Service Fee ': 1.7, // Note the extra space to match the image's layout
  };
  const tripTotal = 15.50; // $15.50

  // Renders the star rating component
  const renderStars = () => {
    const totalStars = 5;
    const stars = [];
    for (let i = 1; i <= totalStars; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Icon
            name={i <= rating ? 'star' : 'star-o'} // 'star' is filled, 'star-o' is outline
            size={30}
            color={i <= rating ? '#4A90E2' : '#666'} // Blue color for filled stars
            style={{ marginHorizontal: 3 }}
          />
        </TouchableOpacity>,
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header Section */}
        <Text style={styles.headerText}>Trip Total</Text>
        <Text style={styles.totalAmount}>${tripTotal.toFixed(2)}</Text>

        {/* Fare Breakdown Card */}
        <View style={styles.card}>
          <View style={styles.fareHeader}>
            <Text style={styles.fareHeaderTextLeft}>Lopectral</Text>
            <Text style={styles.fareHeaderTextRight}>Fares</Text>
          </View>
          <View style={styles.progressBarPlaceholder} />

          {/* Fare Items */}
          {Object.entries(fareBreakdown).map(([label, amount]) => (
            <View key={label} style={styles.fareItem}>
              <Text style={styles.fareLabel}>{label}</Text>
              <Text style={styles.fareAmount}>${amount.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.separator} />

          {/* Payment Method */}
          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          <PaymentToggle selected={paymentMethod} onSelect={setPaymentMethod} />
        </View>

        {/* Rating Section */}
        {renderStars()}

        {/* Short Note Input */}
        <TextInput
          style={styles.noteInput}
          placeholder="Add a short note..."
          placeholderTextColor="#666"
          value={note}
          onChangeText={setNote}
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000', // Deep black for the entire screen background
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerText: {
    color: '#AAA',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  totalAmount: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E1E1E', // Dark grey/black for the card background
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  fareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fareHeaderTextLeft: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '500',
  },
  fareHeaderTextRight: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '500',
  },
  progressBarPlaceholder: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginBottom: 15,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fareLabel: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '400',
  },
  fareAmount: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 15,
  },
  paymentMethodTitle: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  // --- Toggle Styles ---
  toggleContainer: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000', // Background of the toggle itself
    marginBottom: 10,
  },
  toggleOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleLeft: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  toggleRight: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  toggleSelected: {
    backgroundColor: '#4A90E2', // Blue background for selected
    borderRadius: 20,
  },
  toggleText: {
    color: '#AAA', // Default text color
    fontSize: 16,
    fontWeight: '500',
  },
  toggleTextSelected: {
    color: '#FFF', // White text color for selected
  },
  // --- Rating & Note Styles ---
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noteInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    color: '#FFF',
    fontSize: 16,
    height: 60,
    marginBottom: 30,
  },
  // --- Button Styles ---
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#333', // Darker background for "Save"
    borderRadius: 10,
    paddingVertical: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#4A90E2', // Blue background for "Done"
    borderRadius: 10,
    paddingVertical: 15,
    marginLeft: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RideSummaryScreen;