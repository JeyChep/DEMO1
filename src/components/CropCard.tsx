import React from 'react';
import { Leaf, AlertTriangle, CheckCircle, Shield, Droplets } from 'lucide-react';
import { CropRecommendation } from '../types';

interface CropCardProps {
  recommendation: CropRecommendation;
}

export const CropCard: React.FC<CropCardProps> = ({ recommendation }) => {
  const { crop, suitabilityScore, matchingFactors, warnings } = recommendation;
  
  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSuitabilityText = (score: number) => {
    if (score >= 80) return 'Highly Suitable';
    if (score >= 60) return 'Moderately Suitable';
    return 'Low Suitability';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{crop.Variety}</h3>
              <p className="text-sm text-gray-600">{crop.Crop} • {crop.Type}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSuitabilityColor(suitabilityScore)}`}>
            {suitabilityScore}% • {getSuitabilityText(suitabilityScore)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-sm">
            <span className="text-gray-500">Temperature:</span>
            <span className="ml-1 font-medium">{crop.minTemp}-{crop.maxTemp}°C</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Rainfall:</span>
            <span className="ml-1 font-medium">{crop.minPrep}-{crop.maxPrep}mm</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Altitude:</span>
            <span className="ml-1 font-medium">{crop.minAlti}-{crop.maxAlti}m</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">pH Range:</span>
            <span className="ml-1 font-medium">{crop.minpH}-{crop.maxpH}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Soil Types:</h4>
          <div className="flex flex-wrap gap-2">
            {[crop.tex1, crop.tex2, crop.tex3].filter(Boolean).map((soil, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {soil}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {crop.drought_tolerant === 1 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Droplets className="w-3 h-3" />
              <span>Drought Tolerant</span>
            </div>
          )}
          {crop.pest_tolerant === 1 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Shield className="w-3 h-3" />
              <span>Pest Resistant</span>
            </div>
          )}
          {crop.availability === 1 && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <CheckCircle className="w-3 h-3" />
              <span>Available</span>
            </div>
          )}
        </div>

        {matchingFactors.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-green-700 mb-2">✓ Suitable Conditions:</h4>
            <ul className="text-xs text-green-600 space-y-1">
              {matchingFactors.map((factor, index) => (
                <li key={index}>• {factor}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Considerations:
            </h4>
            <ul className="text-xs text-amber-600 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};