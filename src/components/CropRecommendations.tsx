import React from 'react';
import { Sprout, DollarSign, TrendingUp, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { CropRecommendation, CropRecommendationWithEconomics } from '../types';
import { CropCard } from './CropCard';
import { CropCardWithEconomics } from './CropCardWithEconomics';
import { groupCropsByTypeAndCrop } from '../utils/cropMatcher';

interface CropRecommendationsProps {
  recommendations: CropRecommendation[] | CropRecommendationWithEconomics[];
  showEconomics?: boolean;
}

export const CropRecommendations: React.FC<CropRecommendationsProps> = ({ 
  recommendations, 
  showEconomics = false 
}) => {
  const [minSuitability, setMinSuitability] = React.useState<number>(60);
  const [sortBy, setSortBy] = React.useState<'suitability' | 'profitability' | 'risk'>('suitability');
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(new Set());
  const [expandedCrops, setExpandedCrops] = React.useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = React.useState<Set<string>>(new Set());
  
  const filteredRecommendations = recommendations.filter(rec => rec.suitabilityScore >= minSuitability);
  
  // Sort recommendations based on selected criteria
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    if (sortBy === 'suitability') {
      return b.suitabilityScore - a.suitabilityScore;
    }
    if (sortBy === 'profitability' && 'profitabilityScore' in a && 'profitabilityScore' in b) {
      return (b as CropRecommendationWithEconomics).profitabilityScore - (a as CropRecommendationWithEconomics).profitabilityScore;
    }
    if (sortBy === 'risk' && 'riskAdjustedReturn' in a && 'riskAdjustedReturn' in b) {
      return (b as CropRecommendationWithEconomics).riskAdjustedReturn - (a as CropRecommendationWithEconomics).riskAdjustedReturn;
    }
    return b.suitabilityScore - a.suitabilityScore;
  });
  
  const groupedCrops = groupCropsByTypeAndCrop(sortedRecommendations);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleCrop = (cropKey: string) => {
    const newExpanded = new Set(expandedCrops);
    if (newExpanded.has(cropKey)) {
      newExpanded.delete(cropKey);
    } else {
      newExpanded.add(cropKey);
    }
    setExpandedCrops(newExpanded);
  };

  const toggleDetails = (varietyKey: string) => {
    const newDetails = new Set(showDetails);
    if (newDetails.has(varietyKey)) {
      newDetails.delete(varietyKey);
    } else {
      newDetails.add(varietyKey);
    }
    setShowDetails(newDetails);
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-green-100">
        <Sprout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Recommendations Yet</h3>
        <p className="text-gray-500">Select a location to get crop recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Crop Recommendations ({sortedRecommendations.length})
              {showEconomics && <span className="text-sm text-blue-600 ml-2">with Cost-Benefit Analysis</span>}
            </h3>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            {showEconomics && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'suitability' | 'profitability' | 'risk')}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="suitability">Suitability</option>
                  <option value="profitability">Profitability</option>
                  <option value="risk">Risk-Adjusted Return</option>
                </select>
              </div>
            )}
            <label className="text-sm font-medium text-gray-700">
              Minimum Suitability: {minSuitability}%
            </label>
            <input
              type="range"
              min="60"
              max="100"
              step="10"
              value={minSuitability}
              onChange={(e) => setMinSuitability(Number(e.target.value))}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {sortedRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No crops match the current suitability threshold</p>
          </div>
        ) : (
          <>
            {showEconomics && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800">Economic Analysis Summary</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {sortedRecommendations.filter(r => 'economics' in r && r.economics).length}
                    </div>
                    <div className="text-gray-600">Crops with Economic Data</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {sortedRecommendations.filter(r => 'profitabilityScore' in r && r.profitabilityScore >= 70).length}
                    </div>
                    <div className="text-gray-600">Highly Profitable Options</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {sortedRecommendations.filter(r => 'economics' in r && r.economics?.risk_level === 'Low').length}
                    </div>
                    <div className="text-gray-600">Low Risk Investments</div>
                  </div>
                </div>
              </div>
            )}
            
          <div className="space-y-8">
            {Object.entries(groupedCrops).map(([type, crops]) => (
              <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Type Header - Clickable */}
                <button
                  onClick={() => toggleType(type)}
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Sprout className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-gray-800">{type}</h4>
                      <p className="text-sm text-gray-600">
                        {Object.keys(crops).length} crop{Object.keys(crops).length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  {expandedTypes.has(type) ? 
                    <ChevronDown className="w-5 h-5 text-gray-600" /> : 
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  }
                </button>
                
                {/* Crops List - Only show when type is expanded */}
                {expandedTypes.has(type) && (
                  <div className="border-t border-gray-200">
                    {Object.entries(crops).map(([cropName, varieties]) => {
                      const cropKey = `${type}-${cropName}`;
                      return (
                        <div key={cropName} className="border-b border-gray-100 last:border-b-0">
                          {/* Crop Header - Clickable */}
                          <button
                            onClick={() => toggleCrop(cropKey)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="text-left">
                              <h5 className="text-md font-semibold text-gray-800">{cropName}</h5>
                              <p className="text-sm text-gray-600">
                                {varieties.length} variet{varieties.length !== 1 ? 'ies' : 'y'} suitable
                              </p>
                            </div>
                            {expandedCrops.has(cropKey) ? 
                              <ChevronDown className="w-4 h-4 text-gray-600" /> : 
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            }
                          </button>
                          
                          {/* Varieties List - Only show when crop is expanded */}
                          {expandedCrops.has(cropKey) && (
                            <div className="bg-white">
                              {varieties.map((recommendation, index) => {
                                const varietyKey = `${cropKey}-${recommendation.crop.Variety}`;
                                const showDetailCard = showDetails.has(varietyKey);
                                
                                return (
                                  <div key={index} className="border-b border-gray-100 last:border-b-0">
                                    {/* Variety Summary */}
                                    <div className="p-4 flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <h6 className="font-medium text-gray-800">{recommendation.crop.Variety}</h6>
                                        </div>
                                      </div>
                                      
                                      {/* Details Button */}
                                      <button
                                        onClick={() => toggleDetails(varietyKey)}
                                        className="ml-4 flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                      >
                                        <Info className="w-4 h-4" />
                                        {showDetailCard ? 'Hide Details' : 'Show Details'}
                                      </button>
                                    </div>
                                    
                                    {/* Detailed Card - Only show when details button is clicked */}
                                    {showDetailCard && (
                                      <div className="px-4 pb-4">
                                        {showEconomics && 'economics' in recommendation ? (
                                          <CropCardWithEconomics recommendation={recommendation as CropRecommendationWithEconomics} />
                                        ) : (
                                          <CropCard recommendation={recommendation} />
                                        )}
                                      </div>
                                    )}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-200"
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
                
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
};