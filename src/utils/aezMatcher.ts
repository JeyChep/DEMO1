import { ClimateData, AEZData, LivestockData, PastureData, LivestockRecommendation, PastureRecommendation } from '../types';

export const determineAEZ = (climate: ClimateData, aezData: AEZData[]): string => {
  const altitude = climate.altitude;
  const rainfall = climate.annual_Rain;

  // Zone I - Agro-Alpine: Above 2,900m, More than 1,400mm
  if (altitude > 2900 && rainfall > 1400) {
    return 'zone I';
  }
  
  // Zone II - Upper Highlands: 2,400 to 2,900m, 1,200 to 2,000mm
  if (altitude >= 2400 && altitude <= 2900 && rainfall >= 1200 && rainfall <= 2000) {
    return 'zone II';
  }
  
  // Zone III - Lower Highlands: 1,800 to 2,400m, 1,000 to 1,800mm
  if (altitude >= 1800 && altitude <= 2400 && rainfall >= 1000 && rainfall <= 1800) {
    return 'zone III';
  }
  
  // Zone IV - Upper Midlands: 1,500 to 1,800m, 950 to 1,500mm
  if (altitude >= 1500 && altitude <= 1800 && rainfall >= 950 && rainfall <= 1500) {
    return 'zone IV';
  }
  
  // Zone V - Lower Midlands: 1,200 to 1,500m, 850 to 1,200mm
  if (altitude >= 1200 && altitude <= 1500 && rainfall >= 850 && rainfall <= 1200) {
    return 'zone V';
  }
  
  // Zone VI - Upper Lowlands: 600 to 1,200m, 700 to 1,100mm
  if (altitude >= 600 && altitude <= 1200 && rainfall >= 700 && rainfall <= 1100) {
    return 'zone VI';
  }
  
  // Zone VII - Lower Lowlands: 0 to 600m, Less than 700mm
  if (altitude >= 0 && altitude <= 600 && rainfall < 700) {
    return 'zone VII';
  }

  // Fallback logic for edge cases
  if (altitude > 2900) return 'zone I';
  if (altitude >= 2400) return 'zone II';
  if (altitude >= 1800) return 'zone III';
  if (altitude >= 1500) return 'zone IV';
  if (altitude >= 1200) return 'zone V';
  if (altitude >= 600) return 'zone VI';
  return 'zone VII';
};

export const getLivestockRecommendations = (
  livestockData: LivestockData[], 
  climate: ClimateData, 
  aezData: AEZData[]
): LivestockRecommendation[] => {
  const wardAEZ = determineAEZ(climate, aezData);
  
  console.log(`Ward AEZ determined: ${wardAEZ} for ${climate.ward}, ${climate.subcounty}, ${climate.county}`);
  console.log(`Climate conditions: Altitude ${climate.altitude}m, Rainfall ${climate.annual_Rain}mm`);
  
  const recommendations = livestockData.map(livestock => {
    const aezMatch = livestock.AEZ.toLowerCase() === wardAEZ.toLowerCase();
    const suitabilityScore = aezMatch ? 100 : 0;
    
    return {
      livestock,
      suitabilityScore,
      aezMatch,
      zone: wardAEZ
    };
  });

  // Sort by suitability and group suitable ones first
  return recommendations
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .filter(rec => rec.suitabilityScore > 0); // Only show suitable livestock
};

export const getPastureRecommendations = (
  pastureData: PastureData[], 
  climate: ClimateData, 
  aezData: AEZData[]
): PastureRecommendation[] => {
  const wardAEZ = determineAEZ(climate, aezData);
  
  console.log(`Ward AEZ determined: ${wardAEZ} for pasture recommendations`);
  
  const recommendations = pastureData.map(pasture => {
    const aezMatch = pasture.AEZ.toLowerCase() === wardAEZ.toLowerCase();
    const suitabilityScore = aezMatch ? 100 : 0;
    
    return {
      pasture,
      suitabilityScore,
      aezMatch,
      zone: wardAEZ
    };
  });

  // Sort by suitability and group suitable ones first
  return recommendations
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .filter(rec => rec.suitabilityScore > 0); // Only show suitable pasture
};

export const groupLivestockByType = (recommendations: LivestockRecommendation[]): Record<string, LivestockRecommendation[]> => {
  return recommendations.reduce((groups, recommendation) => {
    const type = recommendation.livestock.Livestock;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(recommendation);
    return groups;
  }, {} as Record<string, LivestockRecommendation[]>);
};

export const groupPastureByType = (recommendations: PastureRecommendation[]): Record<string, PastureRecommendation[]> => {
  return recommendations.reduce((groups, recommendation) => {
    const type = recommendation.pasture['Pasture/fodder'];
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(recommendation);
    return groups;
  }, {} as Record<string, PastureRecommendation[]>);
};