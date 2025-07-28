import React from 'react';
import { Wheat } from 'lucide-react';
import { PastureRecommendation } from '../types';
import { PastureCard } from './PastureCard';
import { groupPastureByType } from '../utils/aezMatcher';

interface PastureRecommendationsProps {
  recommendations: PastureRecommendation[];
}

export const PastureRecommendations: React.FC<PastureRecommendationsProps> = ({ recommendations }) => {
  const groupedPasture = groupPastureByType(recommendations);

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
            <div key={type} className="space-y-6">
              <div className="border-l-4 border-amber-500 pl-4">
                <h4 className="text-xl font-bold text-gray-800 mb-2">{type}</h4>
                <p className="text-gray-600 text-sm">
                  {pastures.length} variet{pastures.length !== 1 ? 'ies' : 'y'} suitable for your area
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pastures.map((recommendation, index) => (
                  <PastureCard key={index} recommendation={recommendation} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};