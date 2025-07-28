import React from 'react';
import { Sprout, DollarSign, TrendingUp } from 'lucide-react';
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
              <div key={type} className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{type}</h4>
                  <p className="text-gray-600 text-sm">
                    {Object.keys(crops).length} crop{Object.keys(crops).length !== 1 ? 's' : ''} available
                  </p>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(crops).map(([cropName, varieties]) => (
                    <div key={cropName} className="bg-gray-50 rounded-lg p-6">
                      <div className="mb-4">
                        <h5 className="text-lg font-semibold text-gray-800 mb-1">{cropName}</h5>
                        <p className="text-gray-600 text-sm">
                          {varieties.length} variet{varieties.length !== 1 ? 'ies' : 'y'} suitable for your location
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {varieties.map((recommendation, index) => (
                          showEconomics && 'economics' in recommendation ? (
                            <CropCardWithEconomics key={index} recommendation={recommendation as CropRecommendationWithEconomics} />
                          ) : (
                            <CropCard key={index} recommendation={recommendation} />
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
};