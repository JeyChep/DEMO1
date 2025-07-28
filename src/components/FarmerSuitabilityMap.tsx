import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { Map, Sprout, ChevronDown, Info, Eye, Palette, Target } from 'lucide-react';
import { CropData, ClimateData, CropRecommendation } from '../types';
import { calculateCropSuitability } from '../utils/cropMatcher';
import 'leaflet/dist/leaflet.css';

interface FarmerSuitabilityMapProps {
  cropsData: CropData[];
  climateData: ClimateData[];
}

interface WardSuitabilityData extends ClimateData {
  suitabilityScore: number;
  recommendation: CropRecommendation;
  suitabilityLevel: string;
  wardBoundary: [number, number][];
}

// Component to handle map updates
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

// Farmer-friendly suitability levels
const getSuitabilityLevel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Fair';
  return 'Poor';
};

// Generate much larger, highly visible ward boundaries
const generateWardBoundary = (lat: number, lon: number, size: number = 0.08): [number, number][] => {
  const halfSize = size / 2;
  // Create a large square boundary that's very easy to see
  return [
    [lat - halfSize, lon - halfSize],
    [lat - halfSize, lon + halfSize],
    [lat + halfSize, lon + halfSize],
    [lat + halfSize, lon - halfSize],
    [lat - halfSize, lon - halfSize]
  ];
};

export const FarmerSuitabilityMap: React.FC<FarmerSuitabilityMapProps> = ({ cropsData, climateData }) => {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedSubcounty, setSelectedSubcounty] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedVariety, setSelectedVariety] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.2921, 36.8219]); // Nairobi center
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Get unique values for filters
  const counties = [...new Set(climateData.map(d => d.county))].sort();
  const subcounties = selectedCounty 
    ? [...new Set(climateData.filter(d => d.county === selectedCounty).map(d => d.subcounty))].sort()
    : [];
  const crops = [...new Set(cropsData.map(d => d.Crop))].sort();
  const varieties = selectedCrop 
    ? [...new Set(cropsData.filter(d => d.Crop === selectedCrop).map(d => d.Variety))].sort()
    : [];

  // Filter climate data based on selections
  const filteredClimateData = useMemo(() => {
    let filtered = climateData;
    
    if (selectedCounty) {
      filtered = filtered.filter(d => d.county === selectedCounty);
    }
    if (selectedSubcounty) {
      filtered = filtered.filter(d => d.subcounty === selectedSubcounty);
    }
    
    return filtered;
  }, [climateData, selectedCounty, selectedSubcounty]);

  // Calculate suitability for selected crop/variety
  const suitabilityData: WardSuitabilityData[] = useMemo(() => {
    if (!selectedCrop || !selectedVariety) return [];
    
    const cropVariety = cropsData.find(c => c.Crop === selectedCrop && c.Variety === selectedVariety);
    if (!cropVariety) return [];

    return filteredClimateData.map(climate => {
      const recommendation = calculateCropSuitability(cropVariety, climate);
      const suitabilityLevel = getSuitabilityLevel(recommendation.suitabilityScore);
      const wardBoundary = generateWardBoundary(climate.lat, climate.lon);
      
      return {
        ...climate,
        suitabilityScore: recommendation.suitabilityScore,
        recommendation,
        suitabilityLevel,
        wardBoundary
      };
    });
  }, [cropsData, filteredClimateData, selectedCrop, selectedVariety]);

  // Update map center when county/subcounty changes
  useEffect(() => {
    if (filteredClimateData.length > 0) {
      const avgLat = filteredClimateData.reduce((sum, d) => sum + d.lat, 0) / filteredClimateData.length;
      const avgLon = filteredClimateData.reduce((sum, d) => sum + d.lon, 0) / filteredClimateData.length;
      setMapCenter([avgLat, avgLon]);
      
      if (selectedSubcounty) {
        setMapZoom(10);
      } else if (selectedCounty) {
        setMapZoom(8);
      } else {
        setMapZoom(6);
      }
    }
  }, [filteredClimateData, selectedCounty, selectedSubcounty]);

  // Much stronger, more visible color coding
  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return '#059669'; // Very Dark Green - Excellent
    if (score >= 65) return '#84cc16'; // Bright Lime - Good
    if (score >= 45) return '#f59e0b'; // Bright Orange - Fair
    return '#dc2626'; // Bright Red - Poor
  };

  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    setSelectedSubcounty('');
  };

  const handleCropChange = (crop: string) => {
    setSelectedCrop(crop);
    setSelectedVariety('');
  };

  // Group wards by suitability for summary
  const suitabilitySummary = useMemo(() => {
    if (suitabilityData.length === 0) return null;
    
    const excellent = suitabilityData.filter(w => w.suitabilityScore >= 80).length;
    const good = suitabilityData.filter(w => w.suitabilityScore >= 65 && w.suitabilityScore < 80).length;
    const fair = suitabilityData.filter(w => w.suitabilityScore >= 45 && w.suitabilityScore < 65).length;
    const poor = suitabilityData.filter(w => w.suitabilityScore < 45).length;
    
    return { excellent, good, fair, poor, total: suitabilityData.length };
  }, [suitabilityData]);

  return (
    <div className="space-y-6">
      {/* Farmer-Friendly Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Kenya Ward Suitability Map</h3>
            <p className="text-green-100">See which wards are best for growing your crops with clear, large ward boundaries</p>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* County Filter */}
          <div>
            <label className="block text-sm font-medium text-green-100 mb-2">
              <Map className="w-4 h-4 inline mr-2" />
              County (Optional)
            </label>
            <div className="relative">
              <select
                value={selectedCounty}
                onChange={(e) => handleCountyChange(e.target.value)}
                className="w-full p-3 border-0 rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-white focus:ring-opacity-50 appearance-none bg-white"
              >
                <option value="">All Counties</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Subcounty Filter */}
          <div>
            <label className="block text-sm font-medium text-green-100 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Subcounty (Optional)
            </label>
            <div className="relative">
              <select
                value={selectedSubcounty}
                onChange={(e) => setSelectedSubcounty(e.target.value)}
                disabled={!selectedCounty}
                className="w-full p-3 border-0 rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-white focus:ring-opacity-50 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">All Subcounties</option>
                {subcounties.map(subcounty => (
                  <option key={subcounty} value={subcounty}>{subcounty}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Crop Filter */}
          <div>
            <label className="block text-sm font-medium text-green-100 mb-2">
              <Sprout className="w-4 h-4 inline mr-2" />
              Select Crop *
            </label>
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => handleCropChange(e.target.value)}
                className="w-full p-3 border-0 rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-white focus:ring-opacity-50 appearance-none bg-white"
              >
                <option value="">Choose a crop...</option>
                {crops.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Variety Filter */}
          <div>
            <label className="block text-sm font-medium text-green-100 mb-2">
              <Eye className="w-4 h-4 inline mr-2" />
              Select Variety *
            </label>
            <div className="relative">
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                disabled={!selectedCrop}
                className="w-full p-3 border-0 rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-white focus:ring-opacity-50 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Choose variety...</option>
                {varieties.map(variety => (
                  <option key={variety} value={variety}>{variety}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
        {!selectedCrop || !selectedVariety ? (
          <div className="p-16 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Select Your Crop & Variety</h3>
            <p className="text-gray-600 text-lg mb-6">Choose a crop and variety above to see large, clear ward boundaries colored by suitability</p>
            <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-green-700 text-sm">
                <Info className="w-4 h-4 inline mr-2" />
                Each ward will be highlighted with large, solid colored areas showing how suitable it is for your chosen crop
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Map Controls */}
            <div className="absolute top-4 left-4 z-[1000] space-y-3">
              {/* Current Selection */}
              <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sprout className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-gray-800">{selectedCrop}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{selectedVariety}</p>
                <p className="text-xs text-gray-500">
                  {suitabilityData.length} wards analyzed
                  {selectedCounty && (
                    <span className="block">in {selectedCounty}</span>
                  )}
                </p>
              </div>

              {/* Legend Toggle */}
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {showLegend ? 'Hide' : 'Show'} Legend
                </span>
              </button>
            </div>

            {/* Enhanced Legend */}
            {showLegend && (
              <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Ward Suitability Guide
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded border-2 border-gray-400" style={{ backgroundColor: '#059669' }}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Excellent (80-100%)</div>
                      <div className="text-xs text-gray-500">Perfect conditions</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded border-2 border-gray-400" style={{ backgroundColor: '#84cc16' }}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Good (65-79%)</div>
                      <div className="text-xs text-gray-500">Very suitable</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded border-2 border-gray-400" style={{ backgroundColor: '#f59e0b' }}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Fair (45-64%)</div>
                      <div className="text-xs text-gray-500">Possible with care</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded border-2 border-gray-400" style={{ backgroundColor: '#dc2626' }}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Poor (0-44%)</div>
                      <div className="text-xs text-gray-500">Not recommended</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Large colored areas represent entire ward boundaries
                  </p>
                </div>
              </div>
            )}

            {/* Map with Much Larger Ward Boundaries */}
            <div className="h-96 md:h-[500px] lg:h-[600px]">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="rounded-xl"
              >
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {suitabilityData.map((ward, index) => (
                  <Polygon
                    key={index}
                    positions={ward.wardBoundary}
                    pathOptions={{
                      fillColor: getSuitabilityColor(ward.suitabilityScore),
                      fillOpacity: 0.9, // Very high opacity for maximum visibility
                      color: '#000000', // Black borders for maximum contrast
                      weight: 6, // Very thick borders (increased from 4)
                      opacity: 1, // Full opacity for borders
                      dashArray: undefined // Solid lines
                    }}
                  >
                    <Popup>
                      <div className="p-3 min-w-[280px]">
                        <div className="text-center mb-4">
                          <h4 className="text-lg font-bold text-gray-800">{ward.ward} Ward</h4>
                          <p className="text-sm text-gray-600">{ward.subcounty}, {ward.county}</p>
                        </div>
                        
                        <div className="mb-4">
                          <div 
                            className="text-center py-3 px-4 rounded-lg text-white font-bold text-lg"
                            style={{ backgroundColor: getSuitabilityColor(ward.suitabilityScore) }}
                          >
                            {ward.suitabilityLevel} ({ward.suitabilityScore}%)
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <h5 className="font-medium text-gray-700 mb-2">Ward Climate Conditions:</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>🌡️ {ward.annual_Temp}°C avg temp</div>
                            <div>🌧️ {ward.annual_Rain}mm rainfall</div>
                            <div>⛰️ {ward.altitude}m elevation</div>
                            <div>🧪 pH {ward.ke_ph} soil</div>
                          </div>
                        </div>

                        {ward.recommendation.matchingFactors.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-3 mb-3">
                            <h5 className="font-medium text-green-700 mb-2">✅ Why this ward is suitable:</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {ward.recommendation.matchingFactors.slice(0, 3).map((factor, idx) => (
                                <li key={idx}>• {factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ward.recommendation.warnings.length > 0 && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <h5 className="font-medium text-amber-700 mb-2">⚠️ Things to consider:</h5>
                            <ul className="text-sm text-amber-600 space-y-1">
                              {ward.recommendation.warnings.slice(0, 2).map((warning, idx) => (
                                <li key={idx}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Polygon>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Summary */}
      {selectedCrop && selectedVariety && suitabilitySummary && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
          <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-green-600" />
            Ward Suitability Summary for {selectedCrop} - {selectedVariety}
            {selectedCounty && <span className="text-base font-normal text-gray-600">in {selectedCounty}</span>}
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {suitabilitySummary.excellent}
              </div>
              <div className="text-sm font-medium text-green-700">Excellent Wards</div>
              <div className="text-xs text-green-600">Perfect for farming</div>
            </div>
            
            <div className="text-center p-4 bg-lime-50 rounded-lg border-2 border-lime-200">
              <div className="text-3xl font-bold text-lime-600 mb-1">
                {suitabilitySummary.good}
              </div>
              <div className="text-sm font-medium text-lime-700">Good Wards</div>
              <div className="text-xs text-lime-600">Very suitable</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {suitabilitySummary.fair}
              </div>
              <div className="text-sm font-medium text-amber-700">Fair Wards</div>
              <div className="text-xs text-amber-600">Possible with care</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {suitabilitySummary.poor}
              </div>
              <div className="text-sm font-medium text-red-700">Poor Wards</div>
              <div className="text-xs text-red-600">Not recommended</div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">💡 Farmer Guidance:</h5>
            <p className="text-blue-700 text-sm mb-2">
              <strong>Best Strategy:</strong> Focus on <span className="font-bold text-green-700">Excellent</span> and <span className="font-bold text-lime-700">Good</span> wards for highest success rates.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Alternative Options:</strong> <span className="font-bold text-amber-700">Fair</span> wards may work with improved varieties or additional inputs. 
              Avoid <span className="font-bold text-red-700">Poor</span> wards for this specific crop.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};