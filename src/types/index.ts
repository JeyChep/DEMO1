export interface CropData {
  Type: string;
  Crop: string;
  Variety: string;
  tex1: string;
  tex2: string;
  tex3: string;
  minpH: number;
  maxpH: number;
  minTemp: number;
  maxTemp: number;
  minPrep: number;
  maxPrep: number;
  minAlti: number;
  maxAlti: number;
  drought_tolerant: number;
  pest_tolerant: number;
  availability: number;
  farmer_preference: number;
}

export interface ClimateData {
  county: string;
  subcounty: string;
  ward: string;
  lat: number;
  lon: number;
  altitude: number;
  annual_Rain: number;
  annual_Temp: number;
  ke_elev: number;
  ke_ph: number;
  LR_Rain: number;
  LR_Temp: number;
  SR_Rain: number;
  SR_Temp: number;
}

export interface LocationData {
  county: string;
  subcounty: string;
  ward: string;
  climate: ClimateData;
}

export interface CropRecommendation {
  crop: CropData;
  suitabilityScore: number;
  matchingFactors: string[];
  warnings: string[];
}

export interface LivestockData {
  Livestock: string;
  Breed: string;
  AEZ: string;
}

export interface PastureData {
  'Pasture/fodder': string;
  Type: string;
  Variety: string;
  AEZ: string;
}

export interface AEZData {
  'Agro-Ecological Zone': string;
  'Altitude Range (meters above sea level)': string;
  'Average Annual Rainfall (mm)': string;
}

export interface LivestockRecommendation {
  livestock: LivestockData;
  suitabilityScore: number;
  aezMatch: boolean;
  zone: string;
}

export interface PastureRecommendation {
  pasture: PastureData;
  suitabilityScore: number;
  aezMatch: boolean;
  zone: string;
}

export interface CropEconomics {
  Crop: string;
  Variety: string;
  Type: string;
  seed_cost_per_kg: number;
  seeds_per_acre: number;
  fertilizer_cost_per_acre: number;
  pesticide_cost_per_acre: number;
  labor_cost_per_acre: number;
  other_costs_per_acre: number;
  total_production_cost_per_acre: number;
  expected_yield_per_acre_kg: number;
  market_price_per_kg: number;
  gross_revenue_per_acre: number;
  net_profit_per_acre: number;
  break_even_yield_kg: number;
  roi_percentage: number;
  payback_period_months: number;
  risk_level: string;
}

export interface CropRecommendationWithEconomics extends CropRecommendation {
  economics?: CropEconomics;
  profitabilityScore: number;
  riskAdjustedReturn: number;
}

export interface WardSuitabilityData extends ClimateData {
  suitabilityScore: number;
  recommendation: CropRecommendation;
  suitabilityLevel: string;
}