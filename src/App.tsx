import React, { useState, useEffect } from 'react';
import { Leaf, MapPin, Navigation, AlertCircle, Phone, Mail, Globe, MapPin as Location, DollarSign } from 'lucide-react';
import { LocationSelector } from './components/LocationSelector';
import { ClimateInfo } from './components/ClimateInfo';
import { CropRecommendations } from './components/CropRecommendations';
import { LivestockRecommendations } from './components/LivestockRecommendations';
import { PastureRecommendations } from './components/PastureRecommendations';
import { FarmerSuitabilityMap } from './components/FarmerSuitabilityMap';
import { AgriculturalChatbot } from './components/AgriculturalChatbot';
import { LocationConfirmationMap } from './components/LocationConfirmationMap';
import { TabNavigation } from './components/TabNavigation';
import { parseCropsCSV, parseClimateCSV, parseLivestockCSV, parsePastureCSV, parseAEZCSV, parseCropEconomicsCSV } from './utils/csvParser';
import { getTopCropRecommendations } from './utils/cropMatcher';
import { getLivestockRecommendations, getPastureRecommendations } from './utils/aezMatcher';
import { enhanceRecommendationsWithEconomics } from './utils/costBenefitAnalysis';
import { CropData, ClimateData, CropRecommendation, LivestockData, PastureData, AEZData, LivestockRecommendation, PastureRecommendation } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'crops' | 'livestock' | 'pasture' | 'suitability-map'>('crops');
  const [cropsData, setCropsData] = useState<CropData[]>([]);
  const [cropEconomicsData, setCropEconomicsData] = useState<CropEconomics[]>([]);
  const [livestockData, setLivestockData] = useState<LivestockData[]>([]);
  const [pastureData, setPastureData] = useState<PastureData[]>([]);
  const [aezData, setAezData] = useState<AEZData[]>([]);
  const [climateData, setClimateData] = useState<ClimateData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ClimateData | null>(null);
  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [cropRecommendationsWithEconomics, setCropRecommendationsWithEconomics] = useState<CropRecommendationWithEconomics[]>([]);
  const [livestockRecommendations, setLivestockRecommendations] = useState<LivestockRecommendation[]>([]);
  const [pastureRecommendations, setPastureRecommendations] = useState<PastureRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [dataError, setDataError] = useState<string>('');
  const [showLocationMap, setShowLocationMap] = useState<boolean>(false);
  const [showEconomics, setShowEconomics] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProgress(5);
        console.log('Starting data load...');
        
        // Load crops data
        const cropsResponse = await fetch('/src/data/CROPS_DATASET.csv');
        if (!cropsResponse.ok) {
          throw new Error(`Failed to load crops dataset: ${cropsResponse.status} ${cropsResponse.statusText}`);
        }
        setLoadingProgress(15);
        
        const cropsText = await cropsResponse.text();
        const crops = parseCropsCSV(cropsText);
        setCropsData(crops);
        setLoadingProgress(25);

        // Load crop economics data
        const economicsResponse = await fetch('/src/data/crop_economics.csv');
        if (!economicsResponse.ok) {
          throw new Error(`Failed to load crop economics dataset: ${economicsResponse.status} ${economicsResponse.statusText}`);
        }
        setLoadingProgress(35);
        
        const economicsText = await economicsResponse.text();
        const economics = parseCropEconomicsCSV(economicsText);
        setCropEconomicsData(economics);
        setLoadingProgress(40);

        // Load climate data
        const climateResponse = await fetch('/src/data/WARDS_CLIMATE.csv');
        if (!climateResponse.ok) {
          throw new Error(`Failed to load climate dataset: ${climateResponse.status} ${climateResponse.statusText}`);
        }
        setLoadingProgress(50);
        
        const climateText = await climateResponse.text();
        const climate = parseClimateCSV(climateText);
        setClimateData(climate);
        setLoadingProgress(65);

        // Load livestock data
        const livestockResponse = await fetch('/src/data/livestock_aez.csv');
        if (!livestockResponse.ok) {
          throw new Error(`Failed to load livestock dataset: ${livestockResponse.status} ${livestockResponse.statusText}`);
        }
        setLoadingProgress(75);
        
        const livestockText = await livestockResponse.text();
        const livestock = parseLivestockCSV(livestockText);
        setLivestockData(livestock);
        setLoadingProgress(85);

        // Load pasture data
        const pastureResponse = await fetch('/src/data/pasture_aez.csv');
        if (!pastureResponse.ok) {
          throw new Error(`Failed to load pasture dataset: ${pastureResponse.status} ${pastureResponse.statusText}`);
        }
        setLoadingProgress(90);
        
        const pastureText = await pastureResponse.text();
        const pasture = parsePastureCSV(pastureText);
        setPastureData(pasture);
        setLoadingProgress(95);

        // Load AEZ data
        const aezResponse = await fetch('/src/data/AEZs.csv');
        if (!aezResponse.ok) {
          throw new Error(`Failed to load AEZ dataset: ${aezResponse.status} ${aezResponse.statusText}`);
        }
        
        const aezText = await aezResponse.text();
        const aez = parseAEZCSV(aezText);
        setAezData(aez);
        setLoadingProgress(100);

        console.log(`Successfully loaded:
          - ${crops.length} crop varieties
          - ${economics.length} crop economic profiles
          - ${climate.length} locations
          - ${livestock.length} livestock breeds
          - ${pasture.length} pasture varieties
          - ${aez.length} AEZ definitions`);
        
        if (crops.length === 0) {
          throw new Error('No valid crop data found in the dataset');
        }
        
        if (economics.length === 0) {
          console.warn('No crop economics data found - cost-benefit analysis will be limited');
        }
        
        if (climate.length === 0) {
          throw new Error('No valid climate data found in the dataset');
        }

        if (livestock.length === 0) {
          throw new Error('No valid livestock data found in the dataset');
        }

        if (pasture.length === 0) {
          throw new Error('No valid pasture data found in the dataset');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setDataError(error instanceof Error ? error.message : 'Failed to load data');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedLocation && cropsData.length > 0) {
      console.log('Generating crop recommendations for:', selectedLocation.ward, selectedLocation.subcounty, selectedLocation.county);
      
      const cropRecs = getTopCropRecommendations(cropsData, selectedLocation, 100);
      const filteredCropRecs = cropRecs.filter(rec => rec.suitabilityScore >= 60);
      
      if (filteredCropRecs.length === 0 && cropRecs.length > 0) {
        const topCropRecs = cropRecs.slice(0, 10);
        setCropRecommendations(topCropRecs);
        
        // Enhance with economics if available
        if (cropEconomicsData.length > 0) {
          const enhancedRecs = enhanceRecommendationsWithEconomics(topCropRecs, cropEconomicsData);
          setCropRecommendationsWithEconomics(enhancedRecs);
        }
      } else {
        setCropRecommendations(filteredCropRecs);
        
        // Enhance with economics if available
        if (cropEconomicsData.length > 0) {
          const enhancedRecs = enhanceRecommendationsWithEconomics(filteredCropRecs, cropEconomicsData);
          setCropRecommendationsWithEconomics(enhancedRecs);
        }
      }
    }
  }, [selectedLocation, cropsData, cropEconomicsData]);

  useEffect(() => {
    if (selectedLocation && livestockData.length > 0 && aezData.length > 0) {
      console.log('Generating livestock recommendations for:', selectedLocation.ward, selectedLocation.subcounty, selectedLocation.county);
      
      const livestockRecs = getLivestockRecommendations(livestockData, selectedLocation, aezData);
      setLivestockRecommendations(livestockRecs);
    }
  }, [selectedLocation, livestockData, aezData]);

  useEffect(() => {
    if (selectedLocation && pastureData.length > 0 && aezData.length > 0) {
      console.log('Generating pasture recommendations for:', selectedLocation.ward, selectedLocation.subcounty, selectedLocation.county);
      
      const pastureRecs = getPastureRecommendations(pastureData, selectedLocation, aezData);
      setPastureRecommendations(pastureRecs);
    }
  }, [selectedLocation, pastureData, aezData]);

  const handleLocationDetection = () => {
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        
        if (climateData.length === 0) {
          setLocationError('Climate data not loaded yet. Please try again.');
          return;
        }
        
        // Find closest ward based on coordinates using Haversine formula
        let closest = climateData[0];
        let minDistance = calculateDistance(latitude, longitude, closest.lat, closest.lon);
        
        climateData.forEach(ward => {
          const distance = calculateDistance(latitude, longitude, ward.lat, ward.lon);
          if (distance < minDistance) {
            minDistance = distance;
            closest = ward;
          }
        });
        
        console.log(`Found closest location: ${closest.ward}, ${closest.subcounty}, ${closest.county} (${minDistance.toFixed(2)}km away)`);
        setSelectedLocation(closest);
        setLocationError('');
      },
      (error) => {
        console.error('Geolocation error:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable. Please select manually.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again or select manually.');
            break;
          default:
            setLocationError('An unknown error occurred. Please select location manually.');
            break;
        }
      },
      options
    );
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading KALRO agricultural data...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">{loadingProgress}% complete</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Loading Error</h3>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">KALRO Selector</h1>
                <p className="text-sm text-gray-600">
                  Kenya Agricultural & Livestock Research Organization • Smart Agricultural Recommendations
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {cropsData.length} crops • {livestockData.length} livestock • {pastureData.length} pastures
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLocationDetection}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Navigation className="w-4 h-4" />
              Detect Location
            </button>
          </div>
          {locationError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{locationError}</p>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      {!selectedLocation && activeTab !== 'suitability-map' && (
        <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white py-16">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: 'url(https://images.pexels.com/photos/265216/pexels-photo-265216.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)'
            }}
          ></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              KALRO's Comprehensive Agricultural Guidance
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Get science-based recommendations for crops, livestock, and pasture based on Kenya's agro-ecological zones
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleLocationDetection}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors duration-200 font-semibold"
              >
                <Navigation className="w-5 h-5" />
                Auto-Detect My Location
              </button>
              <div className="text-green-100">or select manually below</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Location Selection - Only show for non-map tabs */}
          {activeTab !== 'suitability-map' && (
            <LocationSelector
              climateData={climateData}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
            />
          )}

          {/* Climate Information - Only show for non-map tabs */}
          {selectedLocation && activeTab !== 'suitability-map' && (
            <div className="space-y-4">
              <ClimateInfo climate={selectedLocation} />
              
              {/* Location Confirmation Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowLocationMap(!showLocationMap)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <MapPin className="w-4 h-4" />
                  {showLocationMap ? 'Hide Location Map' : 'View Location on Map'}
                </button>
              </div>
              
              {/* Location Confirmation Map */}
              {showLocationMap && (
                <LocationConfirmationMap 
                  selectedLocation={selectedLocation}
                  onClose={() => setShowLocationMap(false)}
                />
              )}
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Economics Toggle for Crops Tab */}
          {activeTab === 'crops' && selectedLocation && cropEconomicsData.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Cost-Benefit Analysis</h4>
                    <p className="text-sm text-gray-600">View detailed economic analysis for crop recommendations</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEconomics(!showEconomics)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showEconomics 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showEconomics ? 'Hide Economics' : 'Show Economics'}
                </button>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <>
            {activeTab === 'crops' && selectedLocation && (
              <CropRecommendations 
                recommendations={showEconomics ? cropRecommendationsWithEconomics : cropRecommendations} 
                showEconomics={showEconomics}
              />
            )}
            {activeTab === 'livestock' && selectedLocation && (
              <LivestockRecommendations recommendations={livestockRecommendations} />
            )}
            {activeTab === 'pasture' && selectedLocation && (
              <PastureRecommendations recommendations={pastureRecommendations} />
            )}
            {activeTab === 'suitability-map' && (
              <FarmerSuitabilityMap cropsData={cropsData} climateData={climateData} />
            )}
          </>
        </div>
      </main>

      {/* Agricultural Chatbot */}
      <AgriculturalChatbot 
        cropsData={cropsData}
        climateData={climateData}
        livestockData={livestockData}
        pastureData={pastureData}
        aezData={aezData}
      />

      {/* KALRO Contact Information */}
      <section className="bg-green-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Contact KALRO</h3>
            <p className="text-green-100">Kenya Agricultural & Livestock Research Organization</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Headquarters */}
            <div className="bg-green-700 rounded-lg p-6 text-center">
              <Location className="w-8 h-8 mx-auto mb-3 text-green-200" />
              <h4 className="font-semibold mb-2">Headquarters</h4>
              <p className="text-sm text-green-100">
                KALRO Secretariat<br />
                Kaptagat Road, Loresho<br />
                P.O. Box 57811-00200<br />
                Nairobi, Kenya
              </p>
            </div>

            {/* Phone */}
            <div className="bg-green-700 rounded-lg p-6 text-center">
              <Phone className="w-8 h-8 mx-auto mb-3 text-green-200" />
              <h4 className="font-semibold mb-2">Phone</h4>
              <p className="text-sm text-green-100">
                +254 722 206 986<br />
                +254 734 600 294<br />
                +254 20 4183301-20
              </p>
            </div>

            {/* Email */}
            <div className="bg-green-700 rounded-lg p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-3 text-green-200" />
              <h4 className="font-semibold mb-2">Email</h4>
              <p className="text-sm text-green-100">
                info@kalro.org<br />
                director@kalro.org<br />
                communications@kalro.org
              </p>
            </div>

            {/* Website */}
            <div className="bg-green-700 rounded-lg p-6 text-center">
              <Globe className="w-8 h-8 mx-auto mb-3 text-green-200" />
              <h4 className="font-semibold mb-2">Website</h4>
              <p className="text-sm text-green-100">
                <a href="https://www.kalro.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  www.kalro.org
                </a>
              </p>
              <p className="text-xs text-green-200 mt-2">
                Visit for more research & services
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <p className="font-semibold">KALRO Selector</p>
            </div>
            <p className="mb-2">Empowering Kenyan Farmers with Science-Based Agricultural Decisions</p>
            <p className="text-sm">
              Powered by Kenya Agricultural & Livestock Research Organization (KALRO) • 
              Based on Agro-Ecological Zones and comprehensive agricultural research
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © 2024 KALRO. All rights reserved. • For technical support, contact KALRO ICT Department
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;