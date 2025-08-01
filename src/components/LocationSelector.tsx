import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { ClimateData } from '../types';

interface LocationSelectorProps {
  climateData: ClimateData[];
  selectedLocation: ClimateData | null;
  onLocationSelect: (location: ClimateData) => void;
  selectedCounty: string;
  selectedSubcounty: string;
  onCountyChange: (county: string) => void;
  onSubcountyChange: (subcounty: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  climateData,
  selectedLocation,
  onLocationSelect,
  selectedCounty,
  selectedSubcounty,
  onCountyChange,
  onSubcountyChange
}) => {
  const counties = [...new Set(climateData.map(d => d.county))].sort();
  
  const subcounties = selectedCounty 
    ? [...new Set(climateData.filter(d => d.county === selectedCounty).map(d => d.subcounty))].sort()
    : [];
    
  const wards = selectedSubcounty 
    ? climateData.filter(d => d.county === selectedCounty && d.subcounty === selectedSubcounty).sort((a, b) => a.ward.localeCompare(b.ward))
    : [];

  const handleCountyChange = (county: string) => {
    onCountyChange(county);
    onSubcountyChange('');
  };

  const handleSubcountyChange = (subcounty: string) => {
    onSubcountyChange(subcounty);
  };

  const handleWardSelect = (ward: ClimateData) => {
    onLocationSelect(ward);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-800">Select Location</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* County Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
          <div className="relative">
            <select
              value={selectedCounty}
              onChange={(e) => handleCountyChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            >
              <option value="">Select County</option>
              {counties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Subcounty Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Subcounty</label>
          <div className="relative">
            <select
              value={selectedSubcounty}
              onChange={(e) => handleSubcountyChange(e.target.value)}
              disabled={!selectedCounty}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select Subcounty</option>
              {subcounties.map(subcounty => (
                <option key={subcounty} value={subcounty}>{subcounty}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Ward Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
          <div className="relative">
            <select
              value={selectedLocation?.ward || ''}
              onChange={(e) => {
                const ward = wards.find(w => w.ward === e.target.value);
                if (ward) handleWardSelect(ward);
              }}
              disabled={!selectedSubcounty}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select Ward</option>
              {wards.map(ward => (
                <option key={ward.ward} value={ward.ward}>{ward.ward}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};