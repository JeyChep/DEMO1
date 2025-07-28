import { CropData, ClimateData, LivestockData, PastureData, AEZData } from '../types';
import { CropEconomics } from '../types';

export const parseCropsCSV = (csvText: string): CropData[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.error('CSV file appears to be empty or has no data rows');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  console.log('Crop CSV Headers:', headers);
  
  const crops = lines.slice(1).map((line, index) => {
    try {
      const values = parseCSVLine(line);
      const crop: any = {};
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        const cleanValue = value.trim();
        
        // Handle numeric fields
        if (['minpH', 'maxpH', 'minTemp', 'maxTemp', 'minPrep', 'maxPrep', 'minAlti', 'maxAlti', 'drought_tolerant', 'pest_tolerant', 'availability', 'farmer_preference'].includes(header)) {
          const numValue = parseFloat(cleanValue);
          crop[header] = isNaN(numValue) ? 0 : numValue;
        } else {
          crop[header] = cleanValue;
        }
      });
      
      return crop as CropData;
    } catch (error) {
      console.warn(`Error parsing crop row ${index + 2}:`, error);
      return null;
    }
  }).filter((crop): crop is CropData => {
    if (!crop) return false;
    
    // More lenient validation - just check for essential fields
    const hasEssentials = crop.Type && crop.Crop && crop.Variety;
    const hasValidRanges = crop.minTemp !== undefined && crop.maxTemp !== undefined && 
                          crop.minPrep !== undefined && crop.maxPrep !== undefined &&
                          crop.minAlti !== undefined && crop.maxAlti !== undefined &&
                          crop.minpH !== undefined && crop.maxpH !== undefined;
    
    if (!hasEssentials) {
      console.warn('Crop missing essential fields:', crop);
    }
    if (!hasValidRanges) {
      console.warn('Crop missing valid ranges:', crop);
    }
    
    return hasEssentials && hasValidRanges;
  });
  
  console.log(`Parsed ${crops.length} valid crops from ${lines.length - 1} total rows`);
  if (crops.length > 0) {
    console.log('Sample crop:', crops[0]);
  }
  
  return crops;
};

export const parseClimateCSV = (csvText: string): ClimateData[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.error('Climate CSV file appears to be empty or has no data rows');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  console.log('Climate CSV Headers:', headers);
  
  const climateData = lines.slice(1).map((line, index) => {
    try {
      const values = parseCSVLine(line);
      const climate: any = {};
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        const cleanValue = value.trim();
        
        // Handle numeric fields
        if (['lat', 'lon', 'altitude', 'annual_Rain', 'annual_Temp', 'ke_elev', 'ke_ph', 'LR_Rain', 'LR_Temp', 'SR_Rain', 'SR_Temp'].includes(header)) {
          const numValue = parseFloat(cleanValue);
          climate[header] = isNaN(numValue) ? 0 : numValue;
        } else {
          climate[header] = cleanValue;
        }
      });
      
      return climate as ClimateData;
    } catch (error) {
      console.warn(`Error parsing climate row ${index + 2}:`, error);
      return null;
    }
  }).filter((climate): climate is ClimateData => {
    if (!climate) return false;
    
    const hasEssentials = climate.county && climate.subcounty && climate.ward;
    const hasValidData = climate.annual_Temp !== undefined && climate.annual_Rain !== undefined && 
                        climate.altitude !== undefined && climate.ke_ph !== undefined;
    
    return hasEssentials && hasValidData;
  });
  
  console.log(`Parsed ${climateData.length} valid climate records from ${lines.length - 1} total rows`);
  if (climateData.length > 0) {
    console.log('Sample climate data:', climateData[0]);
  }
  
  return climateData;
};

export const parseLivestockCSV = (csvText: string): LivestockData[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.error('Livestock CSV file appears to be empty or has no data rows');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  console.log('Livestock CSV Headers:', headers);
  
  const livestock = lines.slice(1).map((line, index) => {
    try {
      const values = parseCSVLine(line);
      const livestockItem: any = {};
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        livestockItem[header] = value.trim();
      });
      
      return livestockItem as LivestockData;
    } catch (error) {
      console.warn(`Error parsing livestock row ${index + 2}:`, error);
      return null;
    }
  }).filter((item): item is LivestockData => {
    if (!item) return false;
    return item.Livestock && item.Breed && item.AEZ;
  });
  
  console.log(`Parsed ${livestock.length} valid livestock records from ${lines.length - 1} total rows`);
  return livestock;
};

export const parsePastureCSV = (csvText: string): PastureData[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.error('Pasture CSV file appears to be empty or has no data rows');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  console.log('Pasture CSV Headers:', headers);
  
  const pasture = lines.slice(1).map((line, index) => {
    try {
      const values = parseCSVLine(line);
      const pastureItem: any = {};
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        pastureItem[header] = value.trim();
      });
      
      return pastureItem as PastureData;
    } catch (error) {
      console.warn(`Error parsing pasture row ${index + 2}:`, error);
      return null;
    }
  }).filter((item): item is PastureData => {
    if (!item) return false;
    return item['Pasture/fodder'] && item.Type && item.Variety && item.AEZ;
  });
  
  console.log(`Parsed ${pasture.length} valid pasture records from ${lines.length - 1} total rows`);
  return pasture;
};

export const parseAEZCSV = (csvText: string): AEZData[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.error('AEZ CSV file appears to be empty or has no data rows');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  console.log('AEZ CSV Headers:', headers);
  
  const aezData = lines.slice(1).map((line, index) => {
    try {
      const values = parseCSVLine(line);
      const aez: any = {};
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        aez[header] = value.trim();
      });
      
      return aez as AEZData;
    } catch (error) {
      console.warn(`Error parsing AEZ row ${index + 2}:`, error);
      return null;
    }
  }).filter((item): item is AEZData => {
    if (!item) return false;
    return item['Agro-Ecological Zone'] && item['Altitude Range (meters above sea level)'] && item['Average Annual Rainfall (mm)'];
  });
  
  console.log(`Parsed ${aezData.length} valid AEZ records from ${lines.length - 1} total rows`);
  return aezData;
};

export const parseCropEconomicsCSV = (csvText: string): CropEconomics[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.error('Crop Economics CSV file appears to be empty or has no data rows');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  console.log('Crop Economics CSV Headers:', headers);
  
  const economics = lines.slice(1).map((line, index) => {
    try {
      const values = parseCSVLine(line);
      const economicData: any = {};
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        const cleanValue = value.trim();
        
        // Handle numeric fields
        if ([
          'seed_cost_per_kg', 'seeds_per_acre', 'fertilizer_cost_per_acre', 
          'pesticide_cost_per_acre', 'labor_cost_per_acre', 'other_costs_per_acre',
          'total_production_cost_per_acre', 'expected_yield_per_acre_kg', 
          'market_price_per_kg', 'gross_revenue_per_acre', 'net_profit_per_acre',
          'break_even_yield_kg', 'roi_percentage', 'payback_period_months'
        ].includes(header)) {
          const numValue = parseFloat(cleanValue);
          economicData[header] = isNaN(numValue) ? 0 : numValue;
        } else {
          economicData[header] = cleanValue;
        }
      });
      
      return economicData as CropEconomics;
    } catch (error) {
      console.warn(`Error parsing crop economics row ${index + 2}:`, error);
      return null;
    }
  }).filter((item): item is CropEconomics => {
    if (!item) return false;
    return item.Crop && item.Variety && item.Type;
  });
  
  console.log(`Parsed ${economics.length} valid crop economics records from ${lines.length - 1} total rows`);
  return economics;
};

// Enhanced CSV line parser that handles various edge cases
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  result.push(current);
  
  // Clean up the results
  return result.map(field => {
    // Remove surrounding quotes and trim whitespace
    return field.replace(/^"(.*)"$/, '$1').trim();
  });
};