import { CropData, ClimateData, CropRecommendation } from '../types';

export const calculateCropSuitability = (crop: CropData, climate: ClimateData): CropRecommendation => {
  let suitabilityScore = 0;
  const matchingFactors: string[] = [];
  const warnings: string[] = [];
  
  // Debug logging for the first few calculations
  const isDebug = Math.random() < 0.01; // Log ~1% of calculations for debugging
  
  if (isDebug) {
    console.log('Calculating suitability for:', {
      crop: crop.Variety,
      climate: {
        temp: climate.annual_Temp,
        rain: climate.annual_Rain,
        altitude: climate.altitude,
        ph: climate.ke_ph
      },
      cropRanges: {
        temp: `${crop.minTemp}-${crop.maxTemp}`,
        rain: `${crop.minPrep}-${crop.maxPrep}`,
        altitude: `${crop.minAlti}-${crop.maxAlti}`,
        ph: `${crop.minpH}-${crop.maxpH}`
      }
    });
  }
  
  // Temperature suitability (30% weight)
  if (climate.annual_Temp >= crop.minTemp && climate.annual_Temp <= crop.maxTemp) {
    suitabilityScore += 30;
    matchingFactors.push(`Temperature suitable (${climate.annual_Temp}°C within ${crop.minTemp}-${crop.maxTemp}°C)`);
  } else {
    const tempDiff = climate.annual_Temp < crop.minTemp ? 
      crop.minTemp - climate.annual_Temp : 
      climate.annual_Temp - crop.maxTemp;
    
    // Partial score for close matches
    if (tempDiff <= 3) {
      suitabilityScore += 15;
      matchingFactors.push(`Temperature close match (${climate.annual_Temp}°C, optimal ${crop.minTemp}-${crop.maxTemp}°C)`);
    } else {
      warnings.push(`Temperature mismatch: Current ${climate.annual_Temp}°C, Required ${crop.minTemp}-${crop.maxTemp}°C`);
    }
  }
  
  // Rainfall suitability (25% weight)
  if (climate.annual_Rain >= crop.minPrep && climate.annual_Rain <= crop.maxPrep) {
    suitabilityScore += 25;
    matchingFactors.push(`Rainfall suitable (${climate.annual_Rain}mm within ${crop.minPrep}-${crop.maxPrep}mm)`);
  } else {
    const rainDiff = climate.annual_Rain < crop.minPrep ? 
      crop.minPrep - climate.annual_Rain : 
      climate.annual_Rain - crop.maxPrep;
    
    // Partial score for close matches (within 200mm)
    if (rainDiff <= 200) {
      suitabilityScore += 12;
      matchingFactors.push(`Rainfall close match (${climate.annual_Rain}mm, optimal ${crop.minPrep}-${crop.maxPrep}mm)`);
    } else {
      warnings.push(`Rainfall mismatch: Current ${climate.annual_Rain}mm, Required ${crop.minPrep}-${crop.maxPrep}mm`);
    }
  }
  
  // Altitude suitability (20% weight)
  if (climate.altitude >= crop.minAlti && climate.altitude <= crop.maxAlti) {
    suitabilityScore += 20;
    matchingFactors.push(`Altitude suitable (${climate.altitude}m within ${crop.minAlti}-${crop.maxAlti}m)`);
  } else {
    const altDiff = climate.altitude < crop.minAlti ? 
      crop.minAlti - climate.altitude : 
      climate.altitude - crop.maxAlti;
    
    // Partial score for close matches (within 300m)
    if (altDiff <= 300) {
      suitabilityScore += 10;
      matchingFactors.push(`Altitude close match (${climate.altitude}m, optimal ${crop.minAlti}-${crop.maxAlti}m)`);
    } else {
      warnings.push(`Altitude mismatch: Current ${climate.altitude}m, Required ${crop.minAlti}-${crop.maxAlti}m`);
    }
  }
  
  // pH suitability (15% weight)
  if (climate.ke_ph >= crop.minpH && climate.ke_ph <= crop.maxpH) {
    suitabilityScore += 15;
    matchingFactors.push(`Soil pH suitable (${climate.ke_ph} within ${crop.minpH}-${crop.maxpH})`);
  } else {
    const phDiff = Math.abs(climate.ke_ph - ((crop.minpH + crop.maxpH) / 2));
    
    // Partial score for close pH matches (within 0.5)
    if (phDiff <= 0.5) {
      suitabilityScore += 7;
      matchingFactors.push(`Soil pH close match (${climate.ke_ph}, optimal ${crop.minpH}-${crop.maxpH})`);
    } else {
      warnings.push(`pH mismatch: Current ${climate.ke_ph}, Required ${crop.minpH}-${crop.maxpH}`);
    }
  }
  
  // Bonus factors (10% weight total)
  if (crop.drought_tolerant === 1 && climate.annual_Rain < 800) {
    suitabilityScore += 3;
    matchingFactors.push('Drought tolerant variety (good for low rainfall)');
  }
  
  if (crop.pest_tolerant === 1) {
    suitabilityScore += 3;
    matchingFactors.push('Pest resistant variety');
  }
  
  if (crop.availability === 1) {
    suitabilityScore += 2;
    matchingFactors.push('Seeds readily available');
  }
  
  if (crop.farmer_preference === 1) {
    suitabilityScore += 2;
    matchingFactors.push('Preferred by local farmers');
  }
  
  if (isDebug) {
    console.log('Suitability result:', {
      crop: crop.Variety,
      score: suitabilityScore,
      factors: matchingFactors.length,
      warnings: warnings.length
    });
  }
  
  return {
    crop,
    suitabilityScore,
    matchingFactors,
    warnings
  };
};

export const getTopCropRecommendations = (crops: CropData[], climate: ClimateData, limit: number = 100): CropRecommendation[] => {
  console.log(`Calculating recommendations for ${crops.length} crops`);
  
  if (crops.length === 0) {
    console.warn('No crops data available for recommendations');
    return [];
  }
  
  const recommendations = crops.map(crop => calculateCropSuitability(crop, climate));
  
  // Sort by suitability score and filter out very low scores
  const sortedRecommendations = recommendations
    .filter(rec => rec.suitabilityScore > 0) // Only include crops with some suitability
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, limit);
  
  console.log(`Generated ${sortedRecommendations.length} recommendations, top score: ${sortedRecommendations[0]?.suitabilityScore || 0}`);
  
  return sortedRecommendations;
};

export const groupCropsByType = (recommendations: CropRecommendation[]): Record<string, CropRecommendation[]> => {
  return recommendations.reduce((groups, recommendation) => {
    const type = recommendation.crop.Type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(recommendation);
    return groups;
  }, {} as Record<string, CropRecommendation[]>);
};

export const groupCropsByTypeAndCrop = (recommendations: CropRecommendation[]): Record<string, Record<string, CropRecommendation[]>> => {
  return recommendations.reduce((groups, recommendation) => {
    const type = recommendation.crop.Type;
    const cropName = recommendation.crop.Crop;
    
    if (!groups[type]) {
      groups[type] = {};
    }
    
    if (!groups[type][cropName]) {
      groups[type][cropName] = [];
    }
    
    groups[type][cropName].push(recommendation);
    return groups;
  }, {} as Record<string, Record<string, CropRecommendation[]>>);
};