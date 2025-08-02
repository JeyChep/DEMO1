import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Sprout, MapPin, Lightbulb, Bot } from 'lucide-react';
import { CropData, ClimateData, LivestockData, PastureData, AEZData } from '../types';
import { getTopCropRecommendations } from '../utils/cropMatcher';
import { getLivestockRecommendations, getPastureRecommendations } from '../utils/aezMatcher';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isHtml?: boolean;
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
      text: "🌾 Hello! I'm your KALRO Agricultural Assistant. I can help you find the best crops, livestock, and pasture for any ward in Kenya.\n\n💬 Try asking me:\n• \"What crops are suitable for Kandara ward?\"\n• \"Show me cereals for Nairobi\"\n• \"What livestock can I keep in Meru?\"\n• \"Dairy cattle breeds for my area\"\n• \"Fodder crops for Nakuru ward\"",
      isUser: false,
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

  // Enhanced location finder with fuzzy matching
  const findLocationByName = (locationText: string): ClimateData | null => {
    const searchTerm = locationText.toLowerCase().trim();
    const words = searchTerm.split(/[\s,.-]+/).filter(word => word.length > 2);
    
    console.log('Searching for location:', searchTerm);
    
    // Priority 1: Exact matches
    for (const location of climateData) {
      const ward = location.ward.toLowerCase();
      const subcounty = location.subcounty.toLowerCase();
      const county = location.county.toLowerCase();
      
      if (ward === searchTerm || subcounty === searchTerm || county === searchTerm) {
        return location;
      }
      
      // Check individual words
      for (const word of words) {
        if (ward === word || subcounty === word || county === word) {
          return location;
        }
      }
    }
    
    // Priority 2: Contains matches
    for (const location of climateData) {
      const ward = location.ward.toLowerCase();
      const subcounty = location.subcounty.toLowerCase();
      const county = location.county.toLowerCase();
      
      for (const word of words) {
        if (ward.includes(word) || subcounty.includes(word) || county.includes(word)) {
          return location;
        }
      }
    }
    
    return null;
  };

  // Intent classification using keyword matching
  const classifyIntent = (message: string): { intent: string; cropType?: string } => {
    const lowerMessage = message.toLowerCase();
    
    // Livestock intents
    if (lowerMessage.includes('livestock') || lowerMessage.includes('animal')) {
      return { intent: 'livestock' };
    }
    if (lowerMessage.includes('cattle') || lowerMessage.includes('cow') || lowerMessage.includes('dairy')) {
      return { intent: 'livestock', cropType: 'cattle' };
    }
    if (lowerMessage.includes('goat') || lowerMessage.includes('sheep')) {
      return { intent: 'livestock', cropType: 'goat' };
    }
    if (lowerMessage.includes('chicken') || lowerMessage.includes('poultry')) {
      return { intent: 'livestock', cropType: 'poultry' };
    }
    
    // Pasture/fodder intents
    if (lowerMessage.includes('pasture') || lowerMessage.includes('fodder') || lowerMessage.includes('grass') || lowerMessage.includes('feed')) {
      return { intent: 'pasture' };
    }
    
    // Crop type intents
    if (lowerMessage.includes('cereal')) {
      return { intent: 'crops', cropType: 'cereal' };
    }
    if (lowerMessage.includes('legume') || lowerMessage.includes('bean') || lowerMessage.includes('pea')) {
      return { intent: 'crops', cropType: 'legume' };
    }
    if (lowerMessage.includes('vegetable')) {
      return { intent: 'crops', cropType: 'vegetable' };
    }
    if (lowerMessage.includes('fruit')) {
      return { intent: 'crops', cropType: 'fruit' };
    }
    if (lowerMessage.includes('root') || lowerMessage.includes('potato') || lowerMessage.includes('cassava')) {
      return { intent: 'crops', cropType: 'root' };
    }
    if (lowerMessage.includes('cash crop') || lowerMessage.includes('coffee') || lowerMessage.includes('tea')) {
      return { intent: 'crops', cropType: 'cash' };
    }
    
    // General crop intent
    if (lowerMessage.includes('crop') || lowerMessage.includes('plant') || lowerMessage.includes('grow') || lowerMessage.includes('farm')) {
      return { intent: 'crops' };
    }
    
    return { intent: 'general' };
  };

  // Format varieties horizontally
  const formatVarietiesHorizontally = (varieties: string[]): string => {
    if (varieties.length <= 5) {
      return varieties.join(' • ');
    }
    
    // Group into rows of 5
    const rows: string[] = [];
    for (let i = 0; i < varieties.length; i += 5) {
      rows.push(varieties.slice(i, i + 5).join(' • '));
    }
    return rows.join('\n');
  };

  // Generate crop recommendations
  const generateCropRecommendations = (location: ClimateData, cropType?: string): string => {
    const recommendations = getTopCropRecommendations(cropsData, location, 100);
    let filteredRecs = recommendations.filter(rec => rec.suitabilityScore >= 60);
    
    if (filteredRecs.length === 0 && recommendations.length > 0) {
      filteredRecs = recommendations.slice(0, 15);
    }
    
    // Filter by crop type if specified
    if (cropType) {
      filteredRecs = filteredRecs.filter(rec => rec.crop.Type.toLowerCase() === cropType.toLowerCase());
    }
    
    if (filteredRecs.length === 0) {
      return `<div class="text-red-600">❌ No ${cropType || 'crops'} found suitable for ${location.ward} Ward</div>`;
    }
    
    // Group by crop name
    const groupedCrops: { [key: string]: string[] } = {};
    filteredRecs.forEach(rec => {
      const cropName = rec.crop.Crop;
      if (!groupedCrops[cropName]) {
        groupedCrops[cropName] = [];
      }
      groupedCrops[cropName].push(rec.crop.Variety);
    });
    
    let response = `<div class="font-bold text-green-600 text-lg mb-3">🌾 ${cropType ? cropType.charAt(0).toUpperCase() + cropType.slice(1) + ' Crops' : 'Suitable Crops'} for ${location.ward} Ward</div>`;
    response += `<div class="text-green-700 mb-4">📍 ${location.ward} Ward, ${location.subcounty}, ${location.county}</div>`;
    
    Object.entries(groupedCrops).forEach(([cropName, varieties]) => {
      response += `<div class="mb-3">`;
      response += `<div class="font-semibold text-gray-800 mb-1">${cropName}:</div>`;
      response += `<div class="text-gray-700 text-sm">${formatVarietiesHorizontally(varieties)}</div>`;
      response += `</div>`;
    });
    
    const topCrop = filteredRecs[0];
    response += `<div class="mt-4 p-3 bg-green-50 rounded-lg">`;
    response += `<div class="text-green-800 font-medium">💡 Top Recommendation: ${topCrop.crop.Crop} - ${topCrop.crop.Variety}</div>`;
    response += `<div class="text-green-700 text-sm mt-1">Suitability: ${topCrop.suitabilityScore}%</div>`;
    response += `</div>`;
    
    return response;
  };

  // Generate livestock recommendations
  const generateLivestockRecommendations = (location: ClimateData, livestockType?: string): string => {
    const recommendations = getLivestockRecommendations(livestockData, location, aezData);
    
    let filteredRecs = recommendations;
    if (livestockType) {
      filteredRecs = recommendations.filter(rec => 
        rec.livestock.Livestock.toLowerCase().includes(livestockType.toLowerCase())
      );
    }
    
    if (filteredRecs.length === 0) {
      return `<div class="text-red-600">❌ No ${livestockType || 'livestock'} breeds found suitable for ${location.ward} Ward</div>`;
    }
    
    // Group by livestock type
    const groupedLivestock: { [key: string]: string[] } = {};
    filteredRecs.forEach(rec => {
      const type = rec.livestock.Livestock;
      if (!groupedLivestock[type]) {
        groupedLivestock[type] = [];
      }
      groupedLivestock[type].push(rec.livestock.Breed);
    });
    
    let response = `<div class="font-bold text-green-600 text-lg mb-3">🐄 ${livestockType ? livestockType.charAt(0).toUpperCase() + livestockType.slice(1) : 'Suitable Livestock'} for ${location.ward} Ward</div>`;
    response += `<div class="text-green-700 mb-4">📍 ${location.ward} Ward, ${location.subcounty}, ${location.county}</div>`;
    
    Object.entries(groupedLivestock).forEach(([type, breeds]) => {
      response += `<div class="mb-3">`;
      response += `<div class="font-semibold text-gray-800 mb-1">${type}:</div>`;
      response += `<div class="text-gray-700 text-sm">${formatVarietiesHorizontally(breeds)}</div>`;
      response += `</div>`;
    });
    
    response += `<div class="mt-4 p-3 bg-blue-50 rounded-lg">`;
    response += `<div class="text-blue-800 font-medium">💡 All breeds shown are suitable for your agro-ecological zone</div>`;
    response += `</div>`;
    
    return response;
  };

  // Generate pasture recommendations
  const generatePastureRecommendations = (location: ClimateData): string => {
    const recommendations = getPastureRecommendations(pastureData, location, aezData);
    
    if (recommendations.length === 0) {
      return `<div class="text-red-600">❌ No pasture varieties found suitable for ${location.ward} Ward</div>`;
    }
    
    // Group by pasture type
    const groupedPasture: { [key: string]: string[] } = {};
    recommendations.forEach(rec => {
      const type = rec.pasture['Pasture/fodder'];
      if (!groupedPasture[type]) {
        groupedPasture[type] = [];
      }
      groupedPasture[type].push(rec.pasture.Variety);
    });
    
    let response = `<div class="font-bold text-green-600 text-lg mb-3">🌾 Suitable Pasture & Fodder for ${location.ward} Ward</div>`;
    response += `<div class="text-green-700 mb-4">📍 ${location.ward} Ward, ${location.subcounty}, ${location.county}</div>`;
    
    Object.entries(groupedPasture).forEach(([type, varieties]) => {
      response += `<div class="mb-3">`;
      response += `<div class="font-semibold text-gray-800 mb-1">${type}:</div>`;
      response += `<div class="text-gray-700 text-sm">${formatVarietiesHorizontally(varieties)}</div>`;
      response += `</div>`;
    });
    
    response += `<div class="mt-4 p-3 bg-amber-50 rounded-lg">`;
    response += `<div class="text-amber-800 font-medium">💡 All varieties shown are suitable for your agro-ecological zone</div>`;
    response += `</div>`;
    
    return response;
  };

  // Main message processing function
  const processMessage = async (message: string) => {
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const location = findLocationByName(message);
    const { intent, cropType } = classifyIntent(message);
    
    let response = '';
    let isHtml = false;
    
    if (!location) {
      response = `🔍 I couldn't find that location in our database.\n\n`;
      response += `I have data for ${climateData.length} wards across Kenya.\n\n`;
      response += `Please try:\n`;
      response += `• "What crops are suitable for Kandara ward?"\n`;
      response += `• "Show me livestock for Meru county"\n`;
      response += `• "Cereals for Nairobi"\n\n`;
      response += `Make sure to include the ward, subcounty, or county name! 🌾`;
    } else {
      isHtml = true;
      
      switch (intent) {
        case 'livestock':
          response = generateLivestockRecommendations(location, cropType);
          break;
        case 'pasture':
          response = generatePastureRecommendations(location);
          break;
        case 'crops':
          response = generateCropRecommendations(location, cropType);
          break;
        default:
          // General response with all categories
          response = `<div class="space-y-4">`;
          response += generateCropRecommendations(location);
          response += `<hr class="my-4">`;
          response += generateLivestockRecommendations(location);
          response += `<hr class="my-4">`;
          response += generatePastureRecommendations(location);
          response += `</div>`;
          break;
      }
    }
    
    setIsTyping(false);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
      isHtml
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    await processMessage(inputText);
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
      >
        <MessageCircle className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="bg-green-600 text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">KALRO Assistant</h3>
            <p className="text-xs text-green-100">Agricultural Guidance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
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
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg ${
                  message.isUser 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="text-sm leading-relaxed">
                    {message.isHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: message.text }} />
                    ) : (
                      message.text.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                      ))
                    )}
                  </div>
                  <div className={`text-xs mt-2 ${message.isUser ? 'text-green-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">KALRO Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about crops for your ward..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
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