import { CropData, ClimateData, CropRecommendation, CropEconomics, CropRecommendationWithEconomics } from '../types';

export const calculateProfitabilityScore = (economics: CropEconomics): number => {
  // Base profitability score from ROI
  let score = Math.min(economics.roi_percentage / 5, 100); // Scale ROI to 0-100
  
  // Adjust for risk level
  const riskMultiplier = {
    'Low': 1.0,
    'Medium': 0.85,
    'High': 0.7
  };
  
  score *= riskMultiplier[economics.risk_level as keyof typeof riskMultiplier] || 0.8;
  
  // Bonus for quick payback
  if (economics.payback_period_months <= 6) {
    score += 10;
  } else if (economics.payback_period_months <= 12) {
    score += 5;
  }
  
  // Bonus for high net profit
  if (economics.net_profit_per_acre > 100000) {
    score += 15;
  } else if (economics.net_profit_per_acre > 50000) {
    score += 10;
  } else if (economics.net_profit_per_acre > 25000) {
    score += 5;
  }
  
  return Math.min(Math.max(score, 0), 100);
};

export const calculateRiskAdjustedReturn = (economics: CropEconomics): number => {
  const riskFactor = {
    'Low': 0.95,
    'Medium': 0.85,
    'High': 0.75
  };
  
  const adjustmentFactor = riskFactor[economics.risk_level as keyof typeof riskFactor] || 0.8;
  return economics.roi_percentage * adjustmentFactor;
};

export const enhanceRecommendationsWithEconomics = (
  recommendations: CropRecommendation[],
  economicsData: CropEconomics[]
): CropRecommendationWithEconomics[] => {
  return recommendations.map(rec => {
    // Find matching economics data
    const economics = economicsData.find(econ => 
      econ.Crop === rec.crop.Crop && econ.Variety === rec.crop.Variety
    );
    
    let profitabilityScore = 0;
    let riskAdjustedReturn = 0;
    
    if (economics) {
      profitabilityScore = calculateProfitabilityScore(economics);
      riskAdjustedReturn = calculateRiskAdjustedReturn(economics);
    }
    
    return {
      ...rec,
      economics,
      profitabilityScore,
      riskAdjustedReturn
    };
  });
};

export const calculateScenarioAnalysis = (
  economics: CropEconomics,
  yieldVariation: number = 0.2,
  priceVariation: number = 0.15
) => {
  const scenarios = {
    optimistic: {
      yield: economics.expected_yield_per_acre_kg * (1 + yieldVariation),
      price: economics.market_price_per_kg * (1 + priceVariation),
      description: 'Best case scenario'
    },
    realistic: {
      yield: economics.expected_yield_per_acre_kg,
      price: economics.market_price_per_kg,
      description: 'Expected scenario'
    },
    pessimistic: {
      yield: economics.expected_yield_per_acre_kg * (1 - yieldVariation),
      price: economics.market_price_per_kg * (1 - priceVariation),
      description: 'Worst case scenario'
    }
  };
  
  return Object.entries(scenarios).map(([key, scenario]) => ({
    scenario: key,
    description: scenario.description,
    yield: scenario.yield,
    price: scenario.price,
    grossRevenue: scenario.yield * scenario.price,
    netProfit: (scenario.yield * scenario.price) - economics.total_production_cost_per_acre,
    roi: (((scenario.yield * scenario.price) - economics.total_production_cost_per_acre) / economics.total_production_cost_per_acre) * 100
  }));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-KE').format(num);
};

export const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel.toLowerCase()) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getROIColor = (roi: number): string => {
  if (roi >= 300) return 'text-green-600';
  if (roi >= 200) return 'text-lime-600';
  if (roi >= 100) return 'text-yellow-600';
  if (roi >= 50) return 'text-orange-600';
  return 'text-red-600';
};