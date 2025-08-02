import React from 'react';
import { Wheat, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { PastureRecommendation } from '../types';
import { PastureCard } from './PastureCard';
import { groupPastureByType } from '../utils/aezMatcher';

interface PastureRecommendationsProps {
  recommendations: PastureRecommendation[];
}

export const PastureRecommendations: React.FC<PastureRecommendationsProps> = ({ recommendations }) => {
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = React.useState<Set<string>>(new Set());
  
  const groupedPasture = groupPastureByType(recommendations);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
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
        <Wheat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Pasture Recommendations Yet</h3>
        <p className="text-gray-500">Select a location to get pasture recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
        <div className="flex items-center gap-2 mb-6">
          <Wheat className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Pasture & Fodder Recommendations ({recommendations.length})
          </h3>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedPasture).map(([type, pastures]) => (
            <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Type Header - Clickable */}
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                    <Wheat className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-gray-800">{type}</h4>
                    <p className="text-sm text-gray-600">
                      {pastures.length} variet{pastures.length !== 1 ? 'ies' : 'y'} suitable for your area
                    </p>
                  </div>
                </div>
                {expandedTypes.has(type) ? 
                  <ChevronDown className="w-5 h-5 text-gray-600" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                }
              </button>
              
              {/* Varieties List - Only show when type is expanded */}
              {expandedTypes.has(type) && (
                <div className="border-t border-gray-200 bg-white">
                  {pastures.map((recommendation, index) => {
                    const varietyKey = `${type}-${recommendation.pasture.Variety}`;
                    const showDetailCard = showDetails.has(varietyKey);
                    
                    return (
                      <div key={index} className="border-b border-gray-100 last:border-b-0">
                        {/* Variety Summary */}
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h6 className="font-medium text-gray-800">{recommendation.pasture.Variety}</h6>
                            </div>
                          </div>
                          
                          {/* Details Button */}
                          <button
                            onClick={() => toggleDetails(varietyKey)}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-200"
                          >
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <Info className="w-4 h-4" />
                            </div>
                          </button>
                        </div>
                        
                        {/* Detailed Card - Only show when details button is clicked */}
                        {showDetailCard && (
                          <div className="px-4 pb-4">
                            <PastureCard recommendation={recommendation} />
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
      </div>
    </div>
  );
};