import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin, Leaf, Users, Activity } from 'lucide-react-native';

interface LocationData {
  county: string;
  subcounty: string;
  ward: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for accurate recommendations.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocoding to get location details
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        setLocation({
          county: address.region || 'Unknown County',
          subcounty: address.subregion || 'Unknown Subcounty',
          ward: address.district || 'Unknown Ward',
          coordinates: { latitude, longitude }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location. Please try again.');
      console.error('Location error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    detectLocation();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Leaf size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>KALRO Selector</Text>
          <Text style={styles.subtitle}>Smart Agricultural Recommendations for Kenya</Text>
        </View>

        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <MapPin size={24} color="#16a34a" />
            <Text style={styles.locationTitle}>Your Location</Text>
          </View>
          
          {location ? (
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>County: {location.county}</Text>
              <Text style={styles.locationText}>Subcounty: {location.subcounty}</Text>
              <Text style={styles.locationText}>Ward: {location.ward}</Text>
            </View>
          ) : (
            <Text style={styles.locationText}>Detecting your location...</Text>
          )}

          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={detectLocation}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? 'Detecting...' : 'Refresh Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Wheat size={40} color="#16a34a" />
            <Text style={styles.featureTitle}>Crop Recommendations</Text>
            <Text style={styles.featureDescription}>
              Get personalized crop suggestions based on your location's climate and soil conditions.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Users size={40} color="#16a34a" />
            <Text style={styles.featureTitle}>Livestock Guidance</Text>
            <Text style={styles.featureDescription}>
              Discover suitable livestock breeds for your area's environmental conditions.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Activity size={40} color="#16a34a" />
            <Text style={styles.featureTitle}>Pasture Management</Text>
            <Text style={styles.featureDescription}>
              Learn about optimal pasture and fodder crops for sustainable farming.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <MapPin size={40} color="#16a34a" />
            <Text style={styles.featureTitle}>Suitability Maps</Text>
            <Text style={styles.featureDescription}>
              Visualize agricultural suitability data on interactive maps.
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About KALRO</Text>
          <Text style={styles.aboutText}>
            The Kenya Agricultural and Livestock Research Organization (KALRO) is committed to 
            providing science-based solutions for sustainable agricultural development in Kenya.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#16a34a',
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#dcfce7',
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1f2937',
  },
  locationDetails: {
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 4,
  },
  refreshButton: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  featuresGrid: {
    padding: 16,
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  aboutSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
});