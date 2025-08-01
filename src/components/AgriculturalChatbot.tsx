import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Sprout, MapPin, Lightbulb } from 'lucide-react';
import { CropData, ClimateData, LivestockData, PastureData, AEZData } from '../types';
import { getTopCropRecommendations } from '../utils/cropMatcher';
import { getLivestockRecommendations, getPastureRecommendations } from '../utils/aezMatcher';
import { enhanceRecommendationsWithEconomics } from '../utils/costBenefitAnalysis';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
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
      text: "Hello! I'm your KALRO agricultural assistant. I can help you find the best crops, livestock, and pasture for any location in Kenya. Try asking me something like 'What crops can I grow in Kandara ward?' or 'Show me cereals for Nairobi'.",
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

  const findLocationByName = (locationName: string): ClimateData | null => {
    const searchTerm = locationName.toLowerCase().trim();
    
    // Extract potential location words from the message
    const words = searchTerm.split(/[\s,.-]+/).filter(word => word.length > 2);
    
    console.log('Searching for location in:', searchTerm);
    console.log('Search words:', words);
    console.log('Available locations sample:', climateData.slice(0, 5).map(l => `${l.ward}, ${l.subcounty}, ${l.county}`));
    
    // Priority 1: Exact ward name matches
    for (const location of climateData) {
      const ward = location.ward.toLowerCase();
      const subcounty = location.subcounty.toLowerCase();
      const county = location.county.toLowerCase();
      
      // Check if any word exactly matches ward, subcounty, or county
      for (const word of words) {
        if (ward === word || subcounty === word || county === word) {
          console.log('Found exact word match:', word, '→', location.ward, location.subcounty, location.county);
          return location;
        }
      }
      
      // Also check full search term
      if (ward === searchTerm || subcounty === searchTerm || county === searchTerm) {
        console.log('Found exact match:', location.ward, location.subcounty, location.county);
        return location;
      }
    }
    
    // Priority 2: Contains matches
    for (const location of climateData) {
      const ward = location.ward.toLowerCase();
      const subcounty = location.subcounty.toLowerCase();
      const county = location.county.toLowerCase();
      
      for (const word of words) {
        if (ward.includes(word) || subcounty.includes(word) || county.includes(word)) {
          console.log('Found contains match:', word, '→', location.ward, location.subcounty, location.county);
          return location;
        }
      }
    }
    
    // Priority 3: Search term contains location name
    for (const location of climateData) {
      const ward = location.ward.toLowerCase();
      const subcounty = location.subcounty.toLowerCase();
      const county = location.county.toLowerCase();
      
      if (searchTerm.includes(ward) || searchTerm.includes(subcounty) || searchTerm.includes(county)) {
        console.log('Found reverse match:', location.ward, location.subcounty, location.county);
        return location;
      }
    }
    
    console.log('No location found for:', searchTerm);
    console.log('Total locations in database:', climateData.length);
    return null;
  };

  const getCropsByType = (crops: CropData[], type: string): CropData[] => {
    return crops.filter(crop => crop.Type.toLowerCase() === type.toLowerCase());
  };

  const generateCropRecommendations = (location: ClimateData, cropType?: string) => {
    // Use the exact same logic as the main app
    const recommendations = getTopCropRecommendations(cropsData, location, 100);
    let filteredRecs = recommendations.filter(rec => rec.suitabilityScore >= 60);
    
    if (filteredRecs.length === 0 && recommendations.length > 0) {
      filteredRecs = recommendations.slice(0, 10);
    }
    
    // Filter by crop type if specified
    if (cropType) {
      filteredRecs = filteredRecs.filter(rec => rec.crop.Type.toLowerCase() === cropType.toLowerCase());
    }
    
    return filteredRecs;
  };

  const createCropCard = (title: string, location: ClimateData, crops: any[], cropType?: string) => {
    const handleCardClick = () => {
      const specificRecs = generateCropRecommendations(location, cropType);
      
      let responseText = `🌾 ${title} for ${location.ward} Ward\n\n`;
      responseText += `📍 Location: ${location.ward} Ward, ${location.subcounty} Sub County, ${location.county}\n\n`;
      
      if (specificRecs.length > 0) {
        const groupedCrops: { [key: string]: string[] } = {};
        
        specificRecs.forEach(rec => {
          const cropName = rec.crop.Crop;
          if (!groupedCrops[cropName]) {
            groupedCrops[cropName] = [];
          }
          groupedCrops[cropName].push(rec.crop.Variety);
        });
        
        Object.entries(groupedCrops).forEach(([cropName, varieties]) => {
          responseText += `**${cropName}**\n`;
          varieties.forEach(variety => {
            responseText += `• ${variety}\n`;
          });
          responseText += '\n';
        });
        
        const topCrop = specificRecs[0];
        responseText += `💡 **Success Tips for ${location.ward} Ward:**\n`;
        responseText += `• **Top choice:** ${topCrop.crop.Crop} - ${topCrop.crop.Variety}\n`;
        responseText += `• Visit local agro-dealer for quality seeds\n`;
        responseText += `• Contact extension officer for guidance\n`;
        responseText += `• Consider soil testing before planting`;
      } else {
        responseText += `❌ No ${cropType || 'crops'} available in our database\n\n`;
        responseText += `**Suggestions:**\n`;
        responseText += `• Try other crop types better suited to your area\n`;
        responseText += `• Improve soil conditions with organic matter\n`;
        responseText += `• Contact KALRO ${location.county} office for alternatives`;
      }
      
      const newMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
    };

    return (
      <div 
        key={title}
        onClick={handleCardClick}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:from-green-100 hover:to-emerald-100"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-green-800">{title}</h4>
        </div>
        <p className="text-sm text-green-700">
          {crops.length} varieties available
        </p>
        <p className="text-xs text-green-600 mt-1">Click to see details</p>
      </div>
    );
  };

  // Simple similarity check for fuzzy matching
  const isSimular = (word1: string, word2: string): boolean => {
    if (Math.abs(word1.length - word2.length) > 2) return false;
    
    // Check if one contains most of the other
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length <= word2.length ? word1 : word2;
    
    if (longer.includes(shorter) && shorter.length > 3) return true;
    
    // Simple character overlap check
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    
    return matches / shorter.length > 0.7; // 70% character overlap
  };

  const processMessage = async (message: string) => {
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = message.toLowerCase();
    let response = '';
    let cards: React.ReactNode[] = [];
    
    // Extract location from message
    const locationMatch = findLocationByName(message);
    
    if (locationMatch) {
      // Check what type of recommendation is requested
      if (lowerMessage.includes('livestock') || lowerMessage.includes('cattle') || lowerMessage.includes('goat') || lowerMessage.includes('sheep') || lowerMessage.includes('chicken') || lowerMessage.includes('poultry')) {
        // LIVESTOCK RECOMMENDATIONS
        // Use the exact same logic as the livestock tab
        const livestockRecs = getLivestockRecommendations(livestockData, locationMatch, aezData);
        
        response = `🐄 Livestock Recommendations for ${locationMatch.ward} Ward\n\n`;
        response += `📍 Location: ${locationMatch.ward} Ward, ${locationMatch.subcounty} Sub County, ${locationMatch.county}\n\n`;
        
        if (livestockRecs.length > 0) {
          const groupedLivestock: { [key: string]: string[] } = {};
          
          livestockRecs.forEach(rec => {
            const type = rec.livestock.Livestock;
            if (!groupedLivestock[type]) {
              groupedLivestock[type] = [];
            }
            groupedLivestock[type].push(rec.livestock.Breed);
          });
          
          Object.entries(groupedLivestock).forEach(([type, breeds]) => {
            response += `**${type}**\n`;
            breeds.forEach(breed => {
              response += `• ${breed}\n`;
            });
            response += '\n';
          });
          
          response += `💡 **Success Tips for ${locationMatch.ward} Ward:**\n`;
          response += `• **AEZ Match:** These breeds are suitable for your agro-ecological zone\n`;
          response += `• Visit local livestock extension officer for guidance\n`;
          response += `• Consider local market demand\n`;
          response += `• Ensure proper housing and feeding`;
        } else {
          response += `❌ No livestock breeds available for your AEZ\n\n`;
          response += `**Suggestions:**\n`;
          response += `• Contact KALRO ${locationMatch.county} office for alternatives\n`;
          response += `• Consider improving local conditions\n`;
          response += `• Look into emerging livestock options`;
        }
      } else if (lowerMessage.includes('pasture') || lowerMessage.includes('fodder') || lowerMessage.includes('grass') || lowerMessage.includes('feed')) {
        // PASTURE RECOMMENDATIONS
        // Use the exact same logic as the pasture tab
        const pastureRecs = getPastureRecommendations(pastureData, locationMatch, aezData);
        
        response = `🌾 Pasture & Fodder Recommendations for ${locationMatch.ward} Ward\n\n`;
        response += `📍 Location: ${locationMatch.ward} Ward, ${locationMatch.subcounty} Sub County, ${locationMatch.county}\n\n`;
        
        if (pastureRecs.length > 0) {
          const groupedPasture: { [key: string]: string[] } = {};
          
          pastureRecs.forEach(rec => {
            const type = rec.pasture['Pasture/fodder'];
            if (!groupedPasture[type]) {
              groupedPasture[type] = [];
            }
            groupedPasture[type].push(rec.pasture.Variety);
          });
          
          Object.entries(groupedPasture).forEach(([type, varieties]) => {
            response += `**${type}**\n`;
            varieties.forEach(variety => {
              response += `• ${variety}\n`;
            });
            response += '\n';
          });
          
          response += `💡 **Success Tips for ${locationMatch.ward} Ward:**\n`;
          response += `• **AEZ Match:** These varieties are suitable for your agro-ecological zone\n`;
          response += `• Consider mixed pasture systems\n`;
          response += `• Plan for seasonal variations\n`;
          response += `• Ensure proper grazing management`;
        } else {
          response += `❌ No pasture varieties available for your AEZ\n\n`;
          response += `**Suggestions:**\n`;
          response += `• Contact KALRO ${locationMatch.county} office for alternatives\n`;
          response += `• Consider improving soil conditions\n`;
          response += `• Look into drought-resistant varieties`;
        }
      } else if (lowerMessage.includes('cereal')) {
        // SPECIFIC CEREAL CROPS
        const cerealCrops = getCropsByType(cropsData, 'Cereal');
        const cerealRecs = generateCropRecommendations(locationMatch, 'cereal');
        
        response = `🌾 Cereal Crops for ${locationMatch.ward} Ward\n\n`;
        response += `📍 Location: ${locationMatch.ward} Ward, ${locationMatch.subcounty} Sub County, ${locationMatch.county}\n\n`;
        
        if (cerealRecs.length > 0) {
          const groupedCrops: { [key: string]: string[] } = {};
          
          cerealRecs.forEach(rec => {
            const cropName = rec.crop.Crop;
            if (!groupedCrops[cropName]) {
              groupedCrops[cropName] = [];
            }
            groupedCrops[cropName].push(rec.crop.Variety);
          });
          
          Object.entries(groupedCrops).forEach(([cropName, varieties]) => {
            response += `**${cropName}**\n`;
            varieties.forEach(variety => {
              response += `• ${variety}\n`;
            });
            response += '\n';
          });
          
          const topCrop = cerealRecs[0];
          response += `💡 **Success Tips for ${locationMatch.ward} Ward:**\n`;
          response += `• **Top choice:** ${topCrop.crop.Crop} - ${topCrop.crop.Variety}\n`;
          response += `• Visit local agro-dealer for quality seeds\n`;
          response += `• Contact extension officer for guidance\n`;
          response += `• Consider soil testing before planting`;
        } else {
          response += `❌ No Cereal crops available in our database\n\n`;
          response += `**Suggestions:**\n`;
          response += `• Try other crop types better suited to your area\n`;
          response += `• Improve soil conditions with organic matter\n`;
          response += `• Contact KALRO ${locationMatch.county} office for alternatives`;
        }
      } else if (lowerMessage.includes('legume')) {
        // SPECIFIC LEGUME CROPS
        const legumeCrops = getCropsByType(cropsData, 'Legume');
        const legumeRecs = generateCropRecommendations(locationMatch, 'legume');
        
        response = `🌱 Legume Crops for ${locationMatch.ward} Ward\n\n`;
        response += `📍 Location: ${locationMatch.ward} Ward, ${locationMatch.subcounty} Sub County, ${locationMatch.county}\n\n`;
        
        if (legumeRecs.length > 0) {
          const groupedCrops: { [key: string]: string[] } = {};
          
          legumeRecs.forEach(rec => {
            const cropName = rec.crop.Crop;
            if (!groupedCrops[cropName]) {
              groupedCrops[cropName] = [];
            }
            groupedCrops[cropName].push(rec.crop.Variety);
          });
          
          Object.entries(groupedCrops).forEach(([cropName, varieties]) => {
            response += `**${cropName}**\n`;
            varieties.forEach(variety => {
              response += `• ${variety}\n`;
            });
            response += '\n';
          });
          
          const topCrop = legumeRecs[0];
          response += `💡 **Success Tips for ${locationMatch.ward} Ward:**\n`;
          response += `• **Top choice:** ${topCrop.crop.Crop} - ${topCrop.crop.Variety}\n`;
          response += `• Visit local agro-dealer for quality seeds\n`;
          response += `• Contact extension officer for guidance\n`;
          response += `• Consider soil testing before planting`;
        } else {
          response += `❌ No Legume crops available in our database\n\n`;
          response += `**Suggestions:**\n`;
          response += `• Try other crop types better suited to your area\n`;
          response += `• Improve soil conditions with organic matter\n`;
          response += `• Contact KALRO ${locationMatch.county} office for alternatives`;
        }
      } else if (lowerMessage.includes('vegetable')) {
        // SPECIFIC VEGETABLE CROPS
        const vegetableCrops = getCropsByType(cropsData, 'Vegetable');
        const vegetableRecs = generateCropRecommendations(locationMatch, 'vegetable');
        
        response = `🥬 Vegetable Crops for ${locationMatch.ward} Ward\n\n`;
        response += `📍 Location: ${locationMatch.ward} Ward, ${locationMatch.subcounty} Sub County, ${locationMatch.county}\n\n`;
        
        if (vegetableRecs.length > 0) {
          const groupedCrops: { [key: string]: string[] } = {};
          
          vegetableRecs.forEach(rec => {
            const cropName = rec.crop.Crop;
            if (!groupedCrops[cropName]) {
              groupedCrops[cropName] = [];
            }
            groupedCrops[cropName].push(rec.crop.Variety);
          });
          
          Object.entries(groupedCrops).forEach(([cropName, varieties]) => {
            response += `${cropName}\n`;
            varieties.forEach(variety => {
              response += `• ${variety}\n`;
            });
            response += '\n';
          });
          
          const topCrop = vegetableRecs[0];
          response += `💡 Success Tips for ${locationMatch.ward} Ward:\n`;
          response += `• Top choice: ${topCrop.crop.Crop} - ${topCrop.crop.Variety}\n`;
          response += `• Visit local agro-dealer for quality seeds\n`;
          response += `• Contact extension officer for guidance\n`;
          response += `• Consider soil testing before planting`;
        } else {
          response += `❌ No Vegetable crops available in our database\n\n`;
          response += `Suggestions:\n`;
          response += `• Try other crop types better suited to your area\n`;
          response += `• Improve soil conditions with organic matter\n`;
          response += `• Contact KALRO ${locationMatch.county} office for alternatives`;
        }
        response += `Click on a crop type below to see all available varieties:\n\n`;
        
        // Create clickable cards for different crop types
        const cropTypes = ['Cereal', 'Legume', 'Vegetable', 'Root', 'Fruit', 'Cash', 'Spice', 'Oil'];
        cropTypes.forEach(type => {
          const typeCrops = cropsData.filter(crop => crop.Type.toLowerCase() === type.toLowerCase());
          if (typeCrops.length > 0) {
            cards.push(createCropCard(`${type} Crops`, locationMatch, typeCrops, type.toLowerCase()));
          }
        });
      }
    } else {
      // No location found
      response = `I couldn't find that location in our database. 📍\n\n`;
      response += `I have data for ${climateData.length} wards across Kenya.\n\n`;
      response += `Please try:\n`;
      response += `• Ward name: "crops in kamagut ward"\n`;
      response += `• County name: "crops for Murang'a"\n`;
      response += `• Subcounty name: "livestock for Kandara"\n\n`;
      response += `Examples that work:\n`;
      response += `• "crops in Nairobi"\n`;
      response += `• "livestock for Meru"\n`;
      response += `• "pasture in Kisumu"\n`;
      response += `• "cereals for Nakuru"\n\n`;
      response += `Try a different spelling or a nearby location! 🌾`;
    }
    
    setIsTyping(false);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
      cards: cards.length > 0 ? cards : undefined
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

  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={index} className="font-bold text-gray-800 mt-2 mb-1">{line.slice(2, -2)}</div>;
      }
      if (line.startsWith('• ')) {
        return <div key={index} className="ml-4 text-gray-700">{line}</div>;
      }
      if (line.startsWith('🌾') || line.startsWith('🌱') || line.startsWith('🥬')) {
        return <div key={index} className="font-bold text-lg text-green-700 mb-2">{line}</div>;
      }
      if (line.startsWith('📍')) {
        return <div key={index} className="text-green-600 font-medium mb-2">{line}</div>;
      }
      if (line.startsWith('🏆')) {
        return <div key={index} className="font-semibold text-orange-600 mb-2">{line}</div>;
      }
      if (line.startsWith('💡')) {
        return <div key={index} className="font-semibold text-blue-600 mb-1">{line}</div>;
      }
      if (line.startsWith('❌')) {
        return <div key={index} className="text-red-600 font-medium mb-2">{line}</div>;
      }
      return <div key={index} className="text-gray-700">{line}</div>;
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-green-600 to-amber-600 hover:from-green-700 hover:to-amber-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
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
      <div className="bg-gradient-to-r from-green-600 to-amber-600 text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Sprout className="w-5 h-5" />
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
                    {formatMessageText(message.text)}
                  </div>
                  {message.cards && (
                    <div className="mt-3 space-y-2">
                      {message.cards}
                    </div>
                  )}
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
                placeholder="Ask about crops for your location..."
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