import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Leaf, Cog as Cow, Wheat, MapPin, Info } from 'lucide-react';
import { CropData, ClimateData, LivestockData, PastureData, AEZData, CropRecommendation } from '../types';
import { getTopCropRecommendations, groupCropsByTypeAndCrop } from '../utils/cropMatcher';
import { getLivestockRecommendations, getPastureRecommendations, groupLivestockByType, groupPastureByType, determineAEZ } from '../utils/aezMatcher';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  cards?: React.ReactNode[];
}

interface AgriculturalChatbotProps {
  cropsData: CropData[];
  climateData: ClimateData[];
  livestockData: LivestockData[];
  pastureData: PastureData[];
  aezData: AEZData[];
}

export const AgriculturalChatbot: React.FC<AgriculturalChatbotProps> = ({
  cropsData,
  climateData,
  livestockData,
  pastureData,
  aezData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your KALRO agricultural assistant. I can help you find the best crops, livestock, and pasture for any location in Kenya. Try asking me something like 'What crops can I grow in Kandara ward?' or 'Show me livestock for Nairobi county'.",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findLocation = (query: string): ClimateData | null => {
    const normalizedQuery = query.toLowerCase();
    
    // Try exact matches first (ward, subcounty, county)
    let location = climateData.find(loc => 
      loc.ward.toLowerCase() === normalizedQuery ||
      loc.subcounty.toLowerCase() === normalizedQuery ||
      loc.county.toLowerCase() === normalizedQuery
    );

    // If no exact match, try partial matches with better fuzzy matching
    if (!location) {
      location = climateData.find(loc => 
        loc.ward.toLowerCase().includes(normalizedQuery) ||
        loc.subcounty.toLowerCase().includes(normalizedQuery) ||
        loc.county.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(loc.ward.toLowerCase()) ||
        normalizedQuery.includes(loc.subcounty.toLowerCase()) ||
        normalizedQuery.includes(loc.county.toLowerCase()) ||
        // Add fuzzy matching for common misspellings
        this.fuzzyMatch(loc.ward.toLowerCase(), normalizedQuery) ||
        this.fuzzyMatch(loc.subcounty.toLowerCase(), normalizedQuery) ||
        this.fuzzyMatch(loc.county.toLowerCase(), normalizedQuery)
      );
    }

    return location || null;
  };

  const fuzzyMatch = (str1: string, str2: string): boolean => {
    // Simple fuzzy matching for common misspellings
    const distance = levenshteinDistance(str1, str2);
    return distance <= 2 && str1.length > 3; // Allow 2 character differences for words longer than 3
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const extractLocationFromQuery = (query: string): ClimateData | null => {
    const words = query.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      const location = findLocation(word);
      if (location) return location;
    }

    // Try combinations of words
    for (let i = 0; i < words.length - 1; i++) {
      const combination = words.slice(i, i + 2).join(' ');
      const location = findLocation(combination);
      if (location) return location;
    }

    return null;
  };

  const createCropTypeCard = (cropType: string, crops: Record<string, CropRecommendation[]>) => (
    <div key={cropType} className="bg-white rounded-lg border border-green-200 p-4 mb-3 min-w-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <Leaf className="w-5 h-5 text-green-600" />
        <h4 className="text-lg font-bold text-green-600">{cropType}</h4>
      </div>
      
      <div className="space-y-3">
        {Object.entries(crops).map(([cropName, varieties]) => (
          <div key={cropName}>
            <h5 className="font-semibold text-gray-800 mb-2">{cropName}</h5>
            <div className="flex flex-wrap gap-2">
              {varieties.slice(0, 6).map((rec, idx) => (
                <span key={idx} className="bg-green-100 px-2 py-1 rounded-full text-green-800 text-xs font-medium">
                  {rec.crop.Variety}
                </span>
              ))}
              {varieties.length > 6 && (
                <span className="text-gray-500 text-xs">+{varieties.length - 6} more</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const createDetailedCropCard = (rec: CropRecommendation) => (
    <div className="bg-white rounded-lg border border-green-200 p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-800">{rec.crop.Variety}</h4>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          rec.suitabilityScore >= 80 ? 'bg-green-100 text-green-700' :
          rec.suitabilityScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {rec.suitabilityScore}% Suitable
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>🌡️ <strong>Temperature:</strong> {rec.crop.minTemp}-{rec.crop.maxTemp}°C</div>
          <div>🌧️ <strong>Rainfall:</strong> {rec.crop.minPrep}-{rec.crop.maxPrep}mm</div>
          <div>⛰️ <strong>Altitude:</strong> {rec.crop.minAlti}-{rec.crop.maxAlti}m</div>
          <div>🧪 <strong>pH:</strong> {rec.crop.minpH}-{rec.crop.maxpH}</div>
        </div>

        {rec.crop.tex1 && (
          <div className="text-sm">
            <strong>Soil types:</strong> {[rec.crop.tex1, rec.crop.tex2, rec.crop.tex3].filter(Boolean).join(', ')}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {rec.crop.drought_tolerant === 1 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">🌵 Drought Tolerant</span>
          )}
          {rec.crop.pest_tolerant === 1 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">🛡️ Pest Resistant</span>
          )}
          {rec.crop.availability === 1 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">✅ Seeds Available</span>
          )}
        </div>

        {rec.matchingFactors.length > 0 && (
          <div className="bg-green-50 rounded p-3">
            <div className="text-sm font-medium text-green-700 mb-2">✅ Why it's suitable for your area:</div>
            <ul className="text-sm text-green-600 space-y-1">
              {rec.matchingFactors.map((factor, i) => (
                <li key={i}>• {factor}</li>
              ))}
            </ul>
          </div>
        )}

        {rec.warnings.length > 0 && (
          <div className="bg-amber-50 rounded p-3">
            <div className="text-sm font-medium text-amber-700 mb-2">⚠️ Things to consider:</div>
            <ul className="text-sm text-amber-600 space-y-1">
              {rec.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
  const createLivestockCard = (livestockType: string, livestock: any[], location: ClimateData) => (
    <div key={livestockType} className="bg-white rounded-lg border border-blue-200 p-4 mb-3 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <Cow className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-gray-800">{livestockType}</h4>
      </div>
      
      <div className="space-y-2">
        {livestock.map((rec, idx) => (
          <div key={idx} className="bg-blue-50 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800">{rec.livestock.Breed}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                rec.aezMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {rec.aezMatch ? 'Perfect Match' : 'Not Suitable'}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              <div>Suitable for: {rec.livestock.AEZ.toUpperCase()}</div>
              <div>Your area: {rec.zone.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const createPastureCard = (pastureType: string, pastures: any[], location: ClimateData) => (
    <div key={pastureType} className="bg-white rounded-lg border border-amber-200 p-4 mb-3 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <Wheat className="w-5 h-5 text-amber-600" />
        <h4 className="font-semibold text-gray-800">{pastureType}</h4>
      </div>
      
      <div className="space-y-2">
        {pastures.map((rec, idx) => (
          <div key={idx} className="bg-amber-50 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800">{rec.pasture.Variety}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                rec.aezMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {rec.aezMatch ? 'Perfect Match' : 'Not Suitable'}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              <div>Type: {rec.pasture.Type}</div>
              <div>Suitable for: {rec.pasture.AEZ.toUpperCase()}</div>
              <div>Your area: {rec.zone.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = generateResponse(inputText);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const generateResponse = (query: string): Message => {
    const normalizedQuery = query.toLowerCase();
    const location = extractLocationFromQuery(query);

    if (!location) {
      return {
        id: Date.now().toString(),
        text: "I couldn't find that location. Please try asking about a specific county, subcounty, or ward in Kenya. For example: 'What crops can I grow in Kandara ward?' or 'Show me livestock for Nairobi county'.",
        isBot: true,
        timestamp: new Date()
      };
    }

    const aez = determineAEZ(location, aezData);

    // Determine what type of recommendation is being asked for
    if (normalizedQuery.includes('crop') || normalizedQuery.includes('plant') || normalizedQuery.includes('grow') || normalizedQuery.includes('farm')) {
      const cropRecommendations = getTopCropRecommendations(cropsData, location, 1000);
      const suitableCrops = cropRecommendations.filter(rec => rec.suitabilityScore >= 45);
      
      if (suitableCrops.length === 0) {
        return {
          id: Date.now().toString(),
          text: `No suitable crops found for ${location.ward} Ward, ${location.subcounty}, ${location.county}. The climate conditions might be challenging for most crops in our database.`,
          isBot: true,
          timestamp: new Date()
        };
      }

      const groupedCrops = groupCropsByTypeAndCrop(suitableCrops);
      const cards = Object.entries(groupedCrops).map(([type, crops]) => 
        createCropTypeCard(type, crops)
      );

      return {
        id: Date.now().toString(),
        text: `🌾 **Crop Recommendations for ${location.ward} Ward, ${location.subcounty}**

📍 **Climate:** ${location.annual_Temp.toFixed(1)}°C, ${location.annual_Rain}mm rain, ${location.altitude}m altitude

Found **${suitableCrops.length} suitable crop varieties** across **${Object.keys(groupedCrops).length} categories**:`,
        isBot: true,
        timestamp: new Date(),
        cards
      };
    }

    if (normalizedQuery.includes('livestock') || normalizedQuery.includes('cattle') || normalizedQuery.includes('goat') || normalizedQuery.includes('sheep') || normalizedQuery.includes('chicken') || normalizedQuery.includes('animal')) {
      const livestockRecommendations = getLivestockRecommendations(livestockData, location, aezData);
      
      if (livestockRecommendations.length === 0) {
        return {
          id: Date.now().toString(),
          text: `No suitable livestock found for ${location.ward} Ward, ${location.subcounty}, ${location.county} in the ${aez.toUpperCase()} zone.`,
          isBot: true,
          timestamp: new Date()
        };
      }

      const groupedLivestock = groupLivestockByType(livestockRecommendations);
      const cards = Object.entries(groupedLivestock).map(([type, livestock]) => 
        createLivestockCard(type, livestock, location)
      );

      return {
        id: Date.now().toString(),
        text: `🐄 **Livestock Recommendations for ${location.ward} Ward**

📍 **Location:** ${location.ward} Ward, ${location.subcounty} Sub County, ${location.county}
🌡️ **Climate:** ${location.annual_Temp.toFixed(1)}°C, ${location.annual_Rain}mm rain
⛰️ **Altitude:** ${location.altitude.toFixed(1)}m, Zone: ${aez.toUpperCase()}

Found **${livestockRecommendations.length} suitable livestock breeds** across **${Object.keys(groupedLivestock).length} categories**:`,
        isBot: true,
        timestamp: new Date(),
        cards
      };
    }

    if (normalizedQuery.includes('pasture') || normalizedQuery.includes('fodder') || normalizedQuery.includes('grass') || normalizedQuery.includes('feed')) {
      const pastureRecommendations = getPastureRecommendations(pastureData, location, aezData);
      
      if (pastureRecommendations.length === 0) {
        return {
          id: Date.now().toString(),
          text: `No suitable pasture found for ${location.ward} Ward, ${location.subcounty}, ${location.county} in the ${aez.toUpperCase()} zone.`,
          isBot: true,
          timestamp: new Date()
        };
      }

      const groupedPasture = groupPastureByType(pastureRecommendations);
      const cards = Object.entries(groupedPasture).map(([type, pastures]) => 
        createPastureCard(type, pastures, location)
      );

      return {
        id: Date.now().toString(),
        text: `🌾 **Pasture & Fodder Recommendations for ${location.ward} Ward**

📍 **Location:** ${location.ward} Ward, ${location.subcounty} Sub County, ${location.county}
🌡️ **Climate:** ${location.annual_Temp.toFixed(1)}°C, ${location.annual_Rain}mm rain
⛰️ **Altitude:** ${location.altitude.toFixed(1)}m, Zone: ${aez.toUpperCase()}

Found **${pastureRecommendations.length} suitable pasture varieties** across **${Object.keys(groupedPasture).length} categories**:`,
        isBot: true,
        timestamp: new Date(),
        cards
      };
    }

    // Default response with all recommendations
    const cropRecommendations = getTopCropRecommendations(cropsData, location, 1000);
    const suitableCrops = cropRecommendations.filter(rec => rec.suitabilityScore >= 45);
    const livestockRecommendations = getLivestockRecommendations(livestockData, location, aezData);
    const pastureRecommendations = getPastureRecommendations(pastureData, location, aezData);

    return {
      id: Date.now().toString(),
      text: `📍 **Agricultural Recommendations for ${location.ward} Ward**

**Location:** ${location.ward} Ward, ${location.subcounty} Sub County, ${location.county}
**Climate:** ${location.annual_Temp.toFixed(1)}°C average temperature, ${location.annual_Rain}mm annual rainfall
**Altitude:** ${location.altitude.toFixed(1)}m above sea level
**Agro-Ecological Zone:** ${aez.toUpperCase()}

**Summary:**
🌾 **${suitableCrops.length} crop varieties** suitable for your area
🐄 **${livestockRecommendations.length} livestock breeds** recommended
🌱 **${pastureRecommendations.length} pasture varieties** available

Ask me specifically about "crops", "livestock", or "pasture" for detailed recommendations!`,
      isBot: true,
      timestamp: new Date()
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-green-100 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-green-100 bg-green-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5" />
          <h3 className="font-semibold">KALRO Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-green-700 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-green-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg ${
                  message.isBot 
                    ? 'bg-green-50 text-gray-800 border border-green-100' 
                    : 'bg-green-600 text-white'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                  {message.cards && (
                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                      {message.cards}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-green-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about crops, livestock, or pasture for any location..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};