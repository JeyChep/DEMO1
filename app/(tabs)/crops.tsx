import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wheat, Thermometer, Droplets, MapPin } from 'lucide-react-native';

interface CropRecommendation {
  type: string;
  crop: string;
  variety: string;
  suitability: string;
  minTemp: number;
  maxTemp: number;
  minRainfall: number;
  maxRainfall: number;
}

export default function CropsScreen() {
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Cereals', 'Legumes', 'Vegetables', 'Fruits', 'Cash Crops'];

  const mockRecommendations: CropRecommendation[] = [
    {
      type: 'Cereal',
      crop: 'Maize',
      variety: 'Local White',
      suitability: 'Highly Suitable',
      minTemp: 18,
      maxTemp: 30,
      minRainfall: 600,
      maxRainfall: 1200
    },
    {
      type: 'Legume',
      crop: 'Common Bean',
      variety: 'Rosecoco',
      suitability: 'Suitable',
      minTemp: 16,
      maxTemp: 28,
      minRainfall: 500,
      maxRainfall: 1000
    },
    {
      type: 'Vegetable',
      crop: 'Kale',
      variety: 'Sukuma Wiki',
      suitability: 'Highly Suitable',
      minTemp: 15,
      maxTemp: 25,
      minRainfall: 400,
      maxRainfall: 800
    },
    {
      type: 'Cash Crop',
      crop: 'Coffee',
      variety: 'Arabica',
      suitability: 'Moderately Suitable',
      minTemp: 15,
      maxTemp: 24,
      minRainfall: 1000,
      maxRainfall: 1800
    }
  ];

  useEffect(() => {
    setRecommendations(mockRecommendations);
  }, []);

  const filteredRecommendations = selectedCategory === 'All' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === selectedCategory.slice(0, -1));

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'Highly Suitable': return '#16a34a';
      case 'Suitable': return '#eab308';
      case 'Moderately Suitable': return '#f97316';
      default: return '#ef4444';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crop Recommendations</Text>
        <Text style={styles.headerSubtitle}>Based on your location's climate data</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommendations List */}
      <ScrollView style={styles.recommendationsContainer}>
        {filteredRecommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cropInfo}>
                <Wheat size={24} color="#16a34a" />
                <View style={styles.cropDetails}>
                  <Text style={styles.cropName}>{rec.crop}</Text>
                  <Text style={styles.cropVariety}>{rec.variety}</Text>
                </View>
              </View>
              <View style={[
                styles.suitabilityBadge,
                { backgroundColor: getSuitabilityColor(rec.suitability) }
              ]}>
                <Text style={styles.suitabilityText}>{rec.suitability}</Text>
              </View>
            </View>

            <View style={styles.requirementsContainer}>
              <View style={styles.requirement}>
                <Thermometer size={20} color="#ef4444" />
                <Text style={styles.requirementText}>
                  Temperature: {rec.minTemp}°C - {rec.maxTemp}°C
                </Text>
              </View>
              <View style={styles.requirement}>
                <Droplets size={20} color="#3b82f6" />
                <Text style={styles.requirementText}>
                  Rainfall: {rec.minRainfall}mm - {rec.maxRainfall}mm
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#16a34a',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#dcfce7',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#16a34a',
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  recommendationsContainer: {
    flex: 1,
    padding: 16,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cropDetails: {
    marginLeft: 12,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cropVariety: {
    fontSize: 14,
    color: '#6b7280',
  },
  suitabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suitabilityText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  requirementsContainer: {
    gap: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
});