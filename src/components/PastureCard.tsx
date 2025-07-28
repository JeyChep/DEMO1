import React from 'react';
import { Wheat, CheckCircle } from 'lucide-react';
import { PastureRecommendation } from '../types';

interface PastureCardProps {
  recommendation: PastureRecommendation;
}

export const PastureCard: React.FC<PastureCardProps> = ({ recommendation }) => {
  const { pasture, suitabilityScore, aezMatch, zone } = recommendation;
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Wheat className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{pasture.Variety}</h3>
              <p className="text-sm text-gray-600">{pasture.Type} • {pasture['Pasture/fodder']}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aezMatch && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Suitable</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Category:</span>
            <span className="text-sm font-medium text-gray-900">{pasture['Pasture/fodder']}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Suitable AEZ:</span>
            <span className="text-sm font-medium text-gray-900">{pasture.AEZ.toUpperCase()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Your Ward AEZ:</span>
            <span className="text-sm font-medium text-gray-900">{zone.toUpperCase()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Suitability:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              suitabilityScore === 100 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              {suitabilityScore}% {suitabilityScore === 100 ? 'Perfect Match' : 'Not Suitable'}
            </div>
          </div>
        </div>

        {aezMatch && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ This {pasture['Pasture/fodder'].toLowerCase()} variety is perfectly suited for your area's agro-ecological zone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};