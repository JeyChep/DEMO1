import React from 'react';
import { Cog as Cow, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { LivestockRecommendation } from '../types';
import { LivestockCard } from './LivestockCard';
import { groupLivestockByType } from '../utils/aezMatcher';

interface LivestockRecommendationsProps {
  recommendations: LivestockRecommendation[];
}

export const LivestockRecommendations: React.FC<LivestockRecommendationsProps> = ({ recommendations }) => {
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = React.useState<Set<string>>(new Set());
  
  const groupedLivestock = groupLivestockByType(recommendations);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleDetails = (breedKey: string) => {
    const newDetails = new Set(showDetails);
    if (newDetails.has(breedKey)) {
      newDetails.delete(breedKey);
    } else {
      newDetails.add(breedKey);
    }
    setShowDetails(newDetails);
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-green-100">
        <Cow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Livestock Recommendations Yet</h3>
        <p className="text-gray-500">Select a location to get livestock recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
        <div className="flex items-center gap-2 mb-6">
          <Cow className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Livestock Recommendations ({recommendations.length})
          </h3>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedLivestock).map(([type, livestock]) => (
            <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Type Header - Clickable */}
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Cow className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-gray-800">{type}</h4>
                    <p className="text-sm text-gray-600">
                      {livestock.length} breed{livestock.length !== 1 ? 's' : ''} suitable for your area
                    </p>
                  </div>
                </div>
                {expandedTypes.has(type) ? 
                  <ChevronDown className="w-5 h-5 text-gray-600" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                }
              </button>
              
              {/* Breeds List - Only show when type is expanded */}
              {expandedTypes.has(type) && (
                <div className="border-t border-gray-200 bg-white">
                  {livestock.map((recommendation, index) => {
                    const breedKey = `${type}-${recommendation.livestock.Breed}`;
                    const showDetailCard = showDetails.has(breedKey);
                    
                    return (
                      <div key={index} className="border-b border-gray-100 last:border-b-0">
                        {/* Breed Summary */}
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h6 className="font-medium text-gray-800">{recommendation.livestock.Breed}</h6>
                            </div>
                          </div>
                          
                          {/* Details Button */}
                          <button
                            onClick={() => toggleDetails(breedKey)}
                            className="ml-4 flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Info className="w-4 h-4" />
                            {showDetailCard ? 'Hide Details' : 'Show Details'}
                          </button>
                        </div>
                        
                        {/* Detailed Card - Only show when details button is clicked */}
                        {showDetailCard && (
                          <div className="px-4 pb-4">
                            <LivestockCard recommendation={recommendation} />
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