import React from 'react';
import { Thermometer, CloudRain, Mountain, Beaker } from 'lucide-react';
import { ClimateData } from '../types';

interface ClimateInfoProps {
  climate: ClimateData;
}

export const ClimateInfo: React.FC<ClimateInfoProps> = ({ climate }) => {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Climate Conditions</h3>
      <div className="text-sm text-gray-600 mb-4">
        {climate.county} → {climate.subcounty} → {climate.ward}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Temperature</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{climate.annual_Temp.toFixed(1)}°C</div>
          <div className="text-xs text-gray-500">Annual Average</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Rainfall</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{climate.annual_Rain}mm</div>
          <div className="text-xs text-gray-500">Annual Total</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Mountain className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Altitude</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{climate.altitude.toFixed(0)}m</div>
          <div className="text-xs text-gray-500">Above Sea Level</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Soil pH</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{climate.ke_ph.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Acidity Level</div>
        </div>
      </div>
    </div>
  );
};