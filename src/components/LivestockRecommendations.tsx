import React from 'react';
import { Cog as Cow } from 'lucide-react';
import { LivestockRecommendation } from '../types';
import { LivestockCard } from './LivestockCard';
import { groupLivestockByType } from '../utils/aezMatcher';

interface LivestockRecommendationsProps {
  recommendations: LivestockRecommendation[];
}

export const LivestockRecommendations: React.FC<LivestockRecommendationsProps> = ({ recommendations }) => {
  const groupedLivestock = groupLivestockByType(recommendations);

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
            <div key={type} className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="text-xl font-bold text-gray-800 mb-2">{type}</h4>
                <p className="text-gray-600 text-sm">
                  {livestock.length} breed{livestock.length !== 1 ? 's' : ''} suitable for your area
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {livestock.map((recommendation, index) => (
                  <LivestockCard key={index} recommendation={recommendation} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};