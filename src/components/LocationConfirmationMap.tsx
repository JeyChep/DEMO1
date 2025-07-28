import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Navigation, CheckCircle } from 'lucide-react';
import { ClimateData } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationConfirmationMapProps {
  selectedLocation: ClimateData;
  onClose: () => void;
}

export const LocationConfirmationMap: React.FC<LocationConfirmationMapProps> = ({ 
  selectedLocation, 
  onClose 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Location Confirmation</h3>
              <p className="text-green-100 text-sm">Verify your selected location on the map</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Location Details */}
      <div className="p-4 bg-green-50 border-b border-green-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">County</div>
            <div className="font-semibold text-gray-800">{selectedLocation.county}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Subcounty</div>
            <div className="font-semibold text-gray-800">{selectedLocation.subcounty}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Ward</div>
            <div className="font-semibold text-gray-800">{selectedLocation.ward}</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-80">
        <MapContainer
          center={[selectedLocation.lat, selectedLocation.lon]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
            <Popup>
              <div className="text-center p-2">
                <div className="font-semibold text-gray-800 mb-1">
                  {selectedLocation.ward} Ward
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {selectedLocation.subcounty}, {selectedLocation.county}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}</div>
                  <div>⛰️ {selectedLocation.altitude}m altitude</div>
                  <div>🌡️ {selectedLocation.annual_Temp}°C avg temp</div>
                  <div>🌧️ {selectedLocation.annual_Rain}mm rainfall</div>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Navigation className="w-4 h-4" />
            <span>Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};