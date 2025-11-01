import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Placeholder Images ---
const vehicleImages = [
    { uri: 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Vehicle+Side' }, // Lighter placeholder for white card effect
    { uri: 'https://via.placeholder.com/150x100/CCCCCC/666666?text=Front' },
    { uri: 'https://via.placeholder.com/150x100/CCCCCC/666666?text=Interior' },
];

// --- Custom Components for Reusability ---

const AttributeChip = ({ label, value, onPress, isLicense = false }) => (
    <TouchableOpacity
        style={[styles.chipContainer, isLicense && styles.licenseChip]}
        onPress={onPress}
        disabled={!onPress}
    >
        {isLicense ? (
            <Text style={styles.chipText}>{label}</Text>
        ) : (
            <>
                <Text style={styles.chipLabel}>{label}:</Text>
                <Text style={styles.chipValue}>{value}</Text>
            </>
        )}
        {isLicense && <Icon name="chevron-right" size={12} color="#666" style={{ marginLeft: 5 }} />}
    </TouchableOpacity>
);

const DocumentUploadCard = ({ title, fileName, statusText, progress, iconName, iconColor }) => (
    <View style={styles.documentCard}>
        <View style={styles.documentIconContainer}>
            {/* The icon can be a custom image or a larger icon */}
            {iconName === 'file-document-outline' ? (
                <MaterialIcon name={iconName} size={30} color={iconColor} />
            ) : (
                <Icon name={iconName} size={25} color={iconColor} />
            )}
        </View>
        <View style={styles.documentDetails}>
            <Text style={styles.documentTitle}>{title}</Text>
            <Text style={styles.documentStatusText}>{statusText}</Text>
        </View>
        <View style={styles.documentStatusIndicator}>
            {/* Status Checkmark or Progress Circle */}
            {progress === 100 ? (
                <Icon name="check-circle" size={28} color="#4CD964" /> // Verified Checkmark (Green)
            ) : progress !== null ? (
                <View style={styles.progressCircleContainer}>
                    {/* Placeholder for a circular progress bar */}
                    <Text style={styles.progressText}>{progress}%</Text>
                    {/* 

[Image of circular progress bar icon 75%]
 */}
                </View>
            ) : null}
        </View>
    </View>
);

// --- Main Screen Component ---
const VehicleDetailsScreen = () => {
    // State to mimic the screen's logic (initial/placeholder values)
    const [vehicle, setVehicle] = useState({
        model: 'Honda',
        seats: 4,
        color: 'Silver',
        licensePlate: 'XYZ 123',
    });
    const [rcProgress, setRcProgress] = useState(100);
    const [insuranceProgress, setInsuranceProgress] = useState(75);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                {/* 1. Image Display Area */}
                <View style={styles.imageGallery}>
                    <Image source={vehicleImages[0]} style={styles.mainImage} />
                    <View style={styles.subImageContainer}>
                        <Image source={vehicleImages[1]} style={styles.subImage} />
                        <Image source={vehicleImages[2]} style={styles.subImage} />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Vehicle Details</Text>

                {/* 2. Attribute Chips */}
                <View style={styles.chipRow}>
                    <AttributeChip label="Model" value={vehicle.model} />
                    <AttributeChip label="Seats" value={vehicle.seats} />
                    <AttributeChip label="Color" value={vehicle.color} />
                </View>

                {/* 3. License Plate Input/Display */}
                <View style={styles.chipRow}>
                    <AttributeChip label="License Plate:" isLicense onPress={() => console.log('Edit License')} />
                    <AttributeChip label={vehicle.licensePlate} isLicense onPress={() => console.log('Edit Plate')} />
                </View>

                {/* 4. Document Upload Cards */}
                <DocumentUploadCard
                    title="Registration Card"
                    fileName="RC.pdf"
                    statusText="(Verified)"
                    progress={rcProgress}
                    iconName="file-document-outline"
                    iconColor="#000" // Dark icon on white background
                />

                <DocumentUploadCard
                    title="Insurance Policy"
                    fileName="Upload Insurance"
                    statusText="Uploading..."
                    progress={insuranceProgress}
                    iconName="camera"
                    iconColor="#000" // Dark icon on white background
                />

                {/* 5. Submit Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => console.log('Submitting for Verification')}
                >
                    <Text style={styles.submitButtonText}>Submit for Verification</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- Stylesheet (Dual-Tone: Dark Background with White Cards) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1C1C1E', // **Dark Background**
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF', // White text for titles
        marginTop: 10,
        marginBottom: 15,
    },
    // --- Image Gallery Styles (Same as before) ---
    imageGallery: {
        flexDirection: 'row',
        height: 180,
        marginBottom: 10,
        borderRadius: 15,
        overflow: 'hidden',
    },
    mainImage: {
        flex: 2,
        height: '100%',
        marginRight: 5,
        borderRadius: 15,
        resizeMode: 'cover',
    },
    subImageContainer: {
        flex: 1,
        height: '100%',
        justifyContent: 'space-between',
        marginLeft: 5,
    },
    subImage: {
        flex: 1,
        borderRadius: 10,
        height: '48%',
        marginBottom: 5,
        resizeMode: 'cover',
    },
    // --- Chip Styles (White Background) ---
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    chipContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF', // **White Background**
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        borderColor: '#EFEFEF',
        borderWidth: 1,
        alignItems: 'center',
    },
    licenseChip: {
        flex: 1,
        backgroundColor: '#FFF', // **White Background**
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginRight: 10,
        marginBottom: 5,
        borderWidth: 0,
        justifyContent: 'space-between',
    },
    chipLabel: {
        color: '#888', // Dark grey for labels
        fontSize: 14,
        fontWeight: '500',
        marginRight: 5,
    },
    chipValue: {
        color: '#333', // Dark text for values
        fontSize: 14,
        fontWeight: '600',
    },
    chipText: { // Used for the license plate chips
        color: '#333', // Dark text
        fontSize: 16,
        fontWeight: '500',
    },
    // --- Document Card Styles (White Background) ---
    documentCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF', // **White Background**
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, // Lighter shadow since the background is dark
        shadowRadius: 4,
        elevation: 3,
    },
    documentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFEFEF', // Light grey for icon circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    documentDetails: {
        flex: 1,
    },
    documentTitle: {
        color: '#333', // Dark text for titles
        fontSize: 16,
        fontWeight: '600',
    },
    documentStatusText: {
        color: '#888', // Dark grey for status text
        fontSize: 14,
    },
    documentStatusIndicator: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
    },
    progressCircleContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#D0E9FF', // Light blue background for progress
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#4A90E2',
        borderWidth: 2,
    },
    progressText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    // --- Button Styles (Maintained Blue) ---
    submitButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        paddingVertical: 15,
        marginTop: 20,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default VehicleDetailsScreen;