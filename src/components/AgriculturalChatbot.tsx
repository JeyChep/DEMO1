import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Sprout, MapPin, X, Minimize2, Maximize2, MessageSquare, Zap, Search, Leaf, Cog as Cow, Wheat, ChevronRight } from 'lucide-react';
import { CropData, ClimateData, LivestockData, PastureData, AEZData } from '../types';
import { getTopCropRecommendations } from '../utils/cropMatcher';
import { getLivestockRecommendations, getPastureRecommendations, determineAEZ } from '../utils/aezMatcher';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  hasCards?: boolean;
  cards?: Array<{
    title: string;
    subtitle: string;
    icon: string;
    action: string;
    color: string;
  }>;
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
      type: 'bot',
      content: "🌾 **Hello! I'm your KALRO Agricultural AI Assistant** 🤖\n\nWhat do you want to know about?\n\n🌱 **Crops** - What to plant in your area\n🐄 **Livestock** - Best animals for your farm\n🌾 **Pasture** - Fodder and grass recommendations",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Precise location finder with exact matching priority
  const findLocation = (query: string): ClimateData | null => {
    const searchTerm = query.toLowerCase().trim();
    
    console.log(`🔍 Searching for: "${searchTerm}" in ${climateData.length} locations`);
    
    // 1. EXACT WARD NAME MATCH (highest priority)
    const exactWardMatch = climateData.find(location => 
      location.ward.toLowerCase() === searchTerm
    );
    if (exactWardMatch) {
      console.log(`✅ EXACT ward match: ${exactWardMatch.ward}, ${exactWardMatch.subcounty}, ${exactWardMatch.county}`);
      return exactWardMatch;
    }
    
    // 2. EXACT SUBCOUNTY NAME MATCH
    const exactSubcountyMatch = climateData.find(location => 
      location.subcounty.toLowerCase() === searchTerm
    );
    if (exactSubcountyMatch) {
      console.log(`✅ EXACT subcounty match: ${exactSubcountyMatch.subcounty}, using ward: ${exactSubcountyMatch.ward}`);
      return exactSubcountyMatch;
    }
    
    // 3. EXACT COUNTY NAME MATCH
    const exactCountyMatch = climateData.find(location => 
      location.county.toLowerCase() === searchTerm
    );
    if (exactCountyMatch) {
      console.log(`✅ EXACT county match: ${exactCountyMatch.county}, using ward: ${exactCountyMatch.ward}`);
      return exactCountyMatch;
    }
    
    // 4. WARD NAME STARTS WITH SEARCH TERM
    const wardStartsMatch = climateData.find(location => 
      location.ward.toLowerCase().startsWith(searchTerm)
    );
    if (wardStartsMatch) {
      console.log(`✅ Ward starts with match: ${wardStartsMatch.ward}`);
      return wardStartsMatch;
    }
    
    // 5. SUBCOUNTY NAME STARTS WITH SEARCH TERM
    const subcountyStartsMatch = climateData.find(location => 
      location.subcounty.toLowerCase().startsWith(searchTerm)
    );
    if (subcountyStartsMatch) {
      console.log(`✅ Subcounty starts with match: ${subcountyStartsMatch.subcounty}`);
      return subcountyStartsMatch;
    }
    
    // 6. COUNTY NAME STARTS WITH SEARCH TERM
    const countyStartsMatch = climateData.find(location => 
      location.county.toLowerCase().startsWith(searchTerm)
    );
    if (countyStartsMatch) {
      console.log(`✅ County starts with match: ${countyStartsMatch.county}`);
      return countyStartsMatch;
    }
    
    console.log(`❌ No location found for: "${searchTerm}"`);
    return null;
  };

  // Extract location from user message with better word extraction
  const extractLocation = (message: string): ClimateData | null => {
    const cleanMessage = message.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    const words = cleanMessage.split(' ');
    
    console.log(`🔍 Extracting location from: "${message}"`);
    console.log(`📝 Clean words: [${words.join(', ')}]`);
    
    // Try each word individually first (most precise)
    for (const word of words) {
      if (word.length >= 3) { // Skip very short words
        const location = findLocation(word);
        if (location) {
          console.log(`✅ Found location with single word: "${word}" -> ${location.ward}`);
          return location;
        }
      }
    }
    
    // Try two-word combinations
    for (let i = 0; i < words.length - 1; i++) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      const location = findLocation(twoWords);
      if (location) {
        console.log(`✅ Found location with two words: "${twoWords}" -> ${location.ward}`);
        return location;
      }
    }
    
    // Try three-word combinations
    for (let i = 0; i < words.length - 2; i++) {
      const threeWords = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      const location = findLocation(threeWords);
      if (location) {
        console.log(`✅ Found location with three words: "${threeWords}" -> ${location.ward}`);
        return location;
      }
    }
    
    console.log(`❌ No location extracted from: "${message}"`);
    return null;
  };

  // Determine user intent with specific crop type detection
  const getIntent = (message: string): { category: string; cropType?: string; livestockType?: string; pastureType?: string } => {
    const lowerMessage = message.toLowerCase();
    
    // Specific crop type detection
    if (lowerMessage.includes('cereal') || lowerMessage.includes('maize') || lowerMessage.includes('wheat') || lowerMessage.includes('rice') || lowerMessage.includes('sorghum') || lowerMessage.includes('millet') || lowerMessage.includes('barley')) {
      return { category: 'crops', cropType: 'Cereal' };
    }
    if (lowerMessage.includes('legume') || lowerMessage.includes('bean') || lowerMessage.includes('pea') || lowerMessage.includes('groundnut') || lowerMessage.includes('cowpea') || lowerMessage.includes('pigeon')) {
      return { category: 'crops', cropType: 'Legume' };
    }
    if (lowerMessage.includes('vegetable') || lowerMessage.includes('tomato') || lowerMessage.includes('cabbage') || lowerMessage.includes('kale') || lowerMessage.includes('onion') || lowerMessage.includes('spinach')) {
      return { category: 'crops', cropType: 'Vegetable' };
    }
    if (lowerMessage.includes('fruit') || lowerMessage.includes('banana') || lowerMessage.includes('mango') || lowerMessage.includes('avocado') || lowerMessage.includes('orange') || lowerMessage.includes('passion')) {
      return { category: 'crops', cropType: 'Fruit' };
    }
    if (lowerMessage.includes('root') || lowerMessage.includes('potato') || lowerMessage.includes('cassava') || lowerMessage.includes('sweet potato') || lowerMessage.includes('yam')) {
      return { category: 'crops', cropType: 'Root' };
    }
    if (lowerMessage.includes('cash') || lowerMessage.includes('coffee') || lowerMessage.includes('tea') || lowerMessage.includes('cotton') || lowerMessage.includes('sugarcane') || lowerMessage.includes('tobacco')) {
      return { category: 'crops', cropType: 'Cash' };
    }
    if (lowerMessage.includes('spice') || lowerMessage.includes('chili') || lowerMessage.includes('ginger') || lowerMessage.includes('turmeric')) {
      return { category: 'crops', cropType: 'Spice' };
    }
    if (lowerMessage.includes('oil') || lowerMessage.includes('sunflower') || lowerMessage.includes('sesame')) {
      return { category: 'crops', cropType: 'Oil' };
    }
    
    // Specific livestock type detection
    if (lowerMessage.includes('dairy') || lowerMessage.includes('milk')) {
      return { category: 'livestock', livestockType: 'Dairy cattle' };
    }
    if (lowerMessage.includes('beef') || lowerMessage.includes('meat cattle')) {
      return { category: 'livestock', livestockType: 'Beef cattle' };
    }
    if (lowerMessage.includes('goat')) {
      return { category: 'livestock', livestockType: 'goat' };
    }
    if (lowerMessage.includes('sheep')) {
      return { category: 'livestock', livestockType: 'Sheep' };
    }
    if (lowerMessage.includes('poultry') || lowerMessage.includes('chicken') || lowerMessage.includes('layer') || lowerMessage.includes('broiler')) {
      return { category: 'livestock', livestockType: 'Poultry' };
    }
    if (lowerMessage.includes('pig')) {
      return { category: 'livestock', livestockType: 'Piggery' };
    }
    if (lowerMessage.includes('camel')) {
      return { category: 'livestock', livestockType: 'Camel' };
    }
    
    // Specific pasture type detection
    if (lowerMessage.includes('grass') || lowerMessage.includes('rhodes') || lowerMessage.includes('kikuyu') || lowerMessage.includes('star grass')) {
      return { category: 'pasture', pastureType: 'Pasture' };
    }
    if (lowerMessage.includes('legume pasture') || lowerMessage.includes('lucerne') || lowerMessage.includes('desmodium') || lowerMessage.includes('centro')) {
      return { category: 'pasture', pastureType: 'Legume' };
    }
    if (lowerMessage.includes('fodder') || lowerMessage.includes('napier') || lowerMessage.includes('sorghum fodder')) {
      return { category: 'pasture', pastureType: 'Fodder' };
    }
    if (lowerMessage.includes('tree') || lowerMessage.includes('calliandra') || lowerMessage.includes('leucaena') || lowerMessage.includes('moringa')) {
      return { category: 'pasture', pastureType: 'Tree\\shrub' };
    }
    
    // General categories
    if (lowerMessage.includes('crop') || lowerMessage.includes('plant') || lowerMessage.includes('grow') || lowerMessage.includes('farm') || lowerMessage.includes('cultivate')) {
      return { category: 'crops' };
    }
    if (lowerMessage.includes('livestock') || lowerMessage.includes('animal') || lowerMessage.includes('cattle') || lowerMessage.includes('cow')) {
      return { category: 'livestock' };
    }
    if (lowerMessage.includes('pasture') || lowerMessage.includes('feed') || lowerMessage.includes('grazing')) {
      return { category: 'pasture' };
    }
    if (lowerMessage.includes('climate') || lowerMessage.includes('weather') || lowerMessage.includes('temperature') || lowerMessage.includes('rain') || lowerMessage.includes('rainfall')) {
      return { category: 'climate' };
    }
    
    return { category: 'crops' }; // Default to crops
  };

  // Generate specific crop type recommendations
  const generateSpecificCropResponse = (location: ClimateData, cropType: string): Message => {
    console.log(`🌱 Generating ${cropType} crop recommendations for: ${location.ward}, ${location.subcounty}, ${location.county}`);
    
    // Filter crops by specific type
    const filteredCrops = cropsData.filter(crop => crop.Type === cropType);
    const recommendations = getTopCropRecommendations(filteredCrops, location, 20);
    
    // Try different suitability thresholds to ensure we find crops
    let filteredRecs = recommendations.filter(rec => rec.suitabilityScore >= 40);
    if (filteredRecs.length === 0) {
      filteredRecs = recommendations.filter(rec => rec.suitabilityScore >= 20);
    }
    if (filteredRecs.length === 0) {
      filteredRecs = recommendations.slice(0, 8); // Show top 8 regardless of score
    }
    const finalRecs = filteredRecs;
    
    let response = `🌱 <span style="color: #16a34a; font-weight: bold;">${cropType} Crops for ${location.ward} Ward</span>\n\n`;
    
    // Location info
    response += `📍 <span style="color: #16a34a; font-weight: bold;">Location:</span> ${location.ward}, ${location.subcounty}, ${location.county}\n`;
    
    if (finalRecs.length > 0) {
      response += `🏆 <span style="color: #16a34a; font-weight: bold;">Best ${cropType} Options:</span>\n\n`;
      
      // Group by crop name for better structure
      const cropGroups = finalRecs.reduce((acc, rec) => {
        const cropName = rec.crop.Crop;
        if (!acc[cropName]) acc[cropName] = [];
        acc[cropName].push(rec);
        return acc;
      }, {} as Record<string, typeof finalRecs>);
      
      // Show all crop types in this category
      Object.entries(cropGroups).forEach(([cropName, varieties]) => {
        response += `<span style="color: #16a34a; font-weight: bold;">${cropName}</span>\n`;
        varieties.forEach(rec => {
          response += `  • ${rec.crop.Variety}\n`;
        });
        response += `\n`;
      });
      
      // Success tips
      response += `💡 <span style="color: #16a34a; font-weight: bold;">${cropType} Success Tips for ${location.ward}:</span>\n`;
      const bestCrop = finalRecs[0];
      response += `• <span style="color: #16a34a; font-weight: bold;">Top choice:</span> ${bestCrop.crop.Crop} - ${bestCrop.crop.Variety}\n`;
      
      if (cropType === 'Cereal') {
        response += `• <span style="color: #16a34a; font-weight: bold;">Strategy:</span> Focus on staple food production\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Market:</span> Good local demand for cereals\n`;
      } else if (cropType === 'Vegetable') {
        response += `• <span style="color: #16a34a; font-weight: bold;">Strategy:</span> High-value crops for quick returns\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Market:</span> Target urban markets for better prices\n`;
      } else if (cropType === 'Fruit') {
        response += `• <span style="color: #16a34a; font-weight: bold;">Strategy:</span> Long-term investment with high returns\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Market:</span> Consider value addition (processing)\n`;
      } else if (cropType === 'Legume') {
        response += `• <span style="color: #16a34a; font-weight: bold;">Strategy:</span> Improve soil fertility naturally\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Market:</span> Good protein source, high demand\n`;
      }
      
      response += `• Visit local agro-dealer for quality seeds\n`;
      response += `• Contact extension officer for guidance\n`;
      
    } else {
      response += `❌ <span style="color: #16a34a; font-weight: bold;">No ${cropType} crops available in our database</span>\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">Suggestions:</span>\n`;
      response += `• Try other crop types better suited to your area\n`;
      response += `• Improve soil conditions with organic matter\n`;
      response += `• Contact KALRO ${location.county} office for alternatives\n`;
    }

    return {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date()
    };
  };

  // Generate specific livestock type recommendations
  const generateSpecificLivestockResponse = (location: ClimateData, livestockType: string): Message => {
    console.log(`🐄 Generating ${livestockType} recommendations for: ${location.ward}, ${location.subcounty}, ${location.county}`);
    
    // Filter livestock by specific type
    const filteredLivestock = livestockData.filter(animal => 
      animal.Livestock.toLowerCase().includes(livestockType.toLowerCase()) ||
      livestockType.toLowerCase().includes(animal.Livestock.toLowerCase())
    );
    
    const recommendations = getLivestockRecommendations(filteredLivestock, location, aezData);
    
    let response = `🐄 <span style="color: #16a34a; font-weight: bold;">${livestockType} for ${location.ward} Ward</span>\n\n`;
    response += `📍 <span style="color: #16a34a; font-weight: bold;">Location:</span> ${location.ward}, ${location.subcounty}, ${location.county}\n`;
    response += `\n`;
    
    if (recommendations.length > 0) {
      response += `🏆 <span style="color: #16a34a; font-weight: bold;">Perfect ${livestockType} for ${location.ward}:</span>\n\n`;
      
      const grouped = recommendations.reduce((acc, rec) => {
        if (!acc[rec.livestock.Livestock]) acc[rec.livestock.Livestock] = [];
        acc[rec.livestock.Livestock].push(rec);
        return acc;
      }, {} as Record<string, typeof recommendations>);
      
      Object.entries(grouped).forEach(([type, animals]) => {
        response += `<span style="color: #16a34a; font-weight: bold;">${type}</span>\n`;
        animals.forEach(rec => {
          response += `  • ${rec.livestock.Breed}\n`;
        });
        response += `\n`;
      });
      
      response += `💡 <span style="color: #16a34a; font-weight: bold;">${livestockType} Care Tips for ${location.ward}:</span>\n`;
      
      if (livestockType.includes('Dairy')) {
        response += `• <span style="color: #16a34a; font-weight: bold;">Focus:</span> High milk production breeds\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Feed:</span> Quality pasture and concentrates essential\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Market:</span> Establish milk collection routes\n`;
      } else if (livestockType.includes('Poultry')) {
        response += `• <span style="color: #16a34a; font-weight: bold;">Housing:</span> Good ventilation and biosecurity\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Feed:</span> Balanced commercial feeds recommended\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Market:</span> Both eggs and meat have good demand\n`;
      } else if (livestockType.includes('goat')) {
        response += `• <span style="color: #16a34a; font-weight: bold;">Advantage:</span> Low maintenance, drought tolerant\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Feed:</span> Browse and crop residues sufficient\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Market:</span> Good demand for meat and milk\n`;
      }
      
      response += `• Contact local veterinary officer\n`;
      response += `• Join ${livestockType.toLowerCase()} farmer groups\n`;
      
    } else {
      response += `❌ <span style="color: #16a34a; font-weight: bold;">No specific ${livestockType} matches for ${location.ward}</span>\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">What to do:</span>\n`;
      response += `• Contact ${location.county} veterinary office\n`;
      response += `• Consider other livestock types suitable for your area\n`;
      response += `• Visit KALRO regional centers for guidance\n`;
    }

    return {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date()
    };
  };

  // Generate specific pasture type recommendations
  const generateSpecificPastureResponse = (location: ClimateData, pastureType: string): Message => {
    console.log(`🌾 Generating ${pastureType} recommendations for: ${location.ward}, ${location.subcounty}, ${location.county}`);
    
    // Filter pasture by specific type
    const filteredPasture = pastureData.filter(pasture => 
      pasture.Type === pastureType || pasture['Pasture/fodder'] === pastureType
    );
    
    const recommendations = getPastureRecommendations(filteredPasture, location, aezData);
    
    let response = `🌾 <span style="color: #16a34a; font-weight: bold;">${pastureType} for ${location.ward} Ward</span>\n\n`;
    response += `📍 <span style="color: #16a34a; font-weight: bold;">Location:</span> ${location.ward}, ${location.subcounty}, ${location.county}\n`;
    response += `\n`;
    
    if (recommendations.length > 0) {
      response += `🏆 <span style="color: #16a34a; font-weight: bold;">Perfect ${pastureType} for ${location.ward}:</span>\n\n`;
      
      const grouped = recommendations.reduce((acc, rec) => {
        if (!acc[rec.pasture['Pasture/fodder']]) acc[rec.pasture['Pasture/fodder']] = [];
        acc[rec.pasture['Pasture/fodder']].push(rec);
        return acc;
      }, {} as Record<string, typeof recommendations>);
      
      Object.entries(grouped).forEach(([type, pastures]) => {
        response += `<span style="color: #16a34a; font-weight: bold;">${type}</span>\n`;
        pastures.forEach(rec => {
          response += `  • ${rec.pasture.Variety}\n`;
        });
        response += `\n`;
      });
      
      response += `🌱 <span style="color: #16a34a; font-weight: bold;">${pastureType} Growing Tips for ${location.ward}:</span>\n`;
      
      if (pastureType === 'Pasture') {
        response += `• <span style="color: #16a34a; font-weight: bold;">Establishment:</span> Prepare land well before planting\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Management:</span> Rotational grazing recommended\n`;
      } else if (pastureType === 'Legume') {
        response += `• <span style="color: #16a34a; font-weight: bold;">Benefit:</span> Fixes nitrogen, improves soil fertility\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Management:</span> Can be mixed with grasses\n`;
      } else if (pastureType === 'Fodder') {
        response += `• <span style="color: #16a34a; font-weight: bold;">System:</span> Cut-and-carry feeding system\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Yield:</span> High biomass production per unit area\n`;
      } else if (pastureType === 'Tree\\shrub') {
        response += `• <span style="color: #16a34a; font-weight: bold;">Benefit:</span> Provides shade and soil conservation\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Management:</span> Prune regularly for optimal production\n`;
      }
      
      response += `• Get quality seeds from certified dealers\n`;
      response += `• Contact extension officer for guidance\n`;
      
    } else {
      response += `❌ <span style="color: #16a34a; font-weight: bold;">No specific ${pastureType} matches for ${location.ward}</span>\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">Try these options:</span>\n`;
      response += `• Contact ${location.county} agricultural office\n`;
      response += `• Consider other pasture types suitable for your area\n`;
      response += `• Visit KALRO research stations\n`;
    }

    return {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date()
    };
  };

  // Generate crop recommendations response with better structure
  const generateCropResponse = (location: ClimateData): Message => {
    console.log(`🌱 Generating crop recommendations for: ${location.ward}, ${location.subcounty}, ${location.county}`);
    
    const recommendations = getTopCropRecommendations(cropsData, location, 25);
    // Lower the threshold to find more crops
    let finalRecs = recommendations.filter(rec => rec.suitabilityScore >= 40);
    if (finalRecs.length === 0) {
      finalRecs = recommendations.filter(rec => rec.suitabilityScore >= 20);
    }
    if (finalRecs.length === 0) {
      finalRecs = recommendations.slice(0, 10); // Show top 10 even if low scores
    }
    
    let response = `🌱 <span style="color: #16a34a; font-weight: bold;">Best Crops for ${location.ward} Ward</span>\n\n`;
    
    // Location info
    response += `📍 <span style="color: #16a34a; font-weight: bold;">Location:</span> ${location.ward}, ${location.subcounty}, ${location.county}\n\n`;
    
    if (finalRecs.length > 0) {
      response += `🏆 <span style="color: #16a34a; font-weight: bold;">Top Recommended Crops:</span>\n\n`;
      
      // Group by crop name for better structure
      const cropGroups = finalRecs.reduce((acc, rec) => {
        const cropName = rec.crop.Crop;
        if (!acc[cropName]) acc[cropName] = [];
        acc[cropName].push(rec);
        return acc;
      }, {} as Record<string, typeof finalRecs>);
      
      // Show top 5 crop types
      Object.entries(cropGroups).slice(0, 5).forEach(([cropName, varieties]) => {
        response += `<span style="color: #16a34a; font-weight: bold;">${cropName}</span>\n`;
        varieties.slice(0, 3).forEach(rec => {
          response += `  • ${rec.crop.Variety}\n`;
        });
        response += `\n`;
      });
      
      // Success tips
      response += `💡 <span style="color: #16a34a; font-weight: bold;">Success Tips for ${location.ward}:</span>\n`;
      const bestCrop = finalRecs[0];
      response += `• <span style="color: #16a34a; font-weight: bold;">Top choice:</span> ${bestCrop.crop.Crop} - ${bestCrop.crop.Variety}\n`;
      
      response += `• Visit local agro-dealer for quality seeds\n`;
      response += `• Contact extension officer for guidance\n`;
      
    } else {
      response += `❌ <span style="color: #16a34a; font-weight: bold;">No crops available in our database for ${location.ward}</span>\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">Suggestions:</span>\n`;
      response += `• Try drought-resistant crops (sorghum, millet)\n`;
      response += `• Improve soil with organic matter\n`;
      response += `• Contact KALRO ${location.county} office\n`;
    }

    // Create cards for more specific requests
    const cards = [
      {
        title: "Cereal Crops",
        subtitle: `Maize, wheat, rice options for ${location.ward}`,
        icon: "🌾",
        action: `cereal crops for ${location.ward} ward`,
        color: "bg-yellow-50 border-yellow-200 text-yellow-800"
      },
      {
        title: "Legume Crops", 
        subtitle: `Beans, peas, groundnuts for ${location.ward}`,
        icon: "🫘",
        action: `legume crops for ${location.ward} ward`,
        color: "bg-green-50 border-green-200 text-green-800"
      },
      {
        title: "Vegetable Crops",
        subtitle: `Tomatoes, cabbage, kale for ${location.ward}`,
        icon: "🥬",
        action: `vegetable crops for ${location.ward} ward`,
        color: "bg-emerald-50 border-emerald-200 text-emerald-800"
      },
      {
        title: "Fruit Crops",
        subtitle: `Bananas, mangoes, avocados for ${location.ward}`,
        icon: "🍌",
        action: `fruit crops for ${location.ward} ward`,
        color: "bg-orange-50 border-orange-200 text-orange-800"
      }
    ];
    
    return {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date(),
      hasCards: true,
      cards
    };
  };

  // Generate livestock response with better structure
  const generateLivestockResponse = (location: ClimateData): Message => {
    console.log(`🐄 Generating livestock recommendations for: ${location.ward}, ${location.subcounty}, ${location.county}`);
    
    const recommendations = getLivestockRecommendations(livestockData, location, aezData);
    const aez = determineAEZ(location, aezData);
    
    let response = `🐄 <span style="color: #16a34a; font-weight: bold;">Best Livestock for ${location.ward} Ward</span>\n\n`;
    response += `📍 <span style="color: #16a34a; font-weight: bold;">Location:</span> ${location.ward}, ${location.subcounty}, ${location.county}\n`;
    response += `🏔️ <span style="color: #16a34a; font-weight: bold;">Zone:</span> ${aez.toUpperCase()}\n\n`;
    
    if (recommendations.length > 0) {
      const grouped = recommendations.reduce((acc, rec) => {
        if (!acc[rec.livestock.Livestock]) acc[rec.livestock.Livestock] = [];
        acc[rec.livestock.Livestock].push(rec);
        return acc;
      }, {} as Record<string, typeof recommendations>);
      
      response += `🏆 <span style="color: #16a34a; font-weight: bold;">Perfect Animals for ${location.ward}:</span>\n\n`;
      Object.entries(grouped).forEach(([type, animals]) => {
        response += `<span style="color: #16a34a; font-weight: bold;">${type}</span>\n`;
        animals.slice(0, 3).forEach(rec => {
          response += `  • ${rec.livestock.Breed}\n`;
        });
        response += `\n`;
      });
      
      response += `💡 <span style="color: #16a34a; font-weight: bold;">Care Tips for ${location.ward}:</span>\n`;
      if (location.annual_Rain > 1200) {
        response += `• <span style="color: #16a34a; font-weight: bold;">High rainfall</span> - ensure good drainage in shelters\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Watch for parasites</span> during wet season\n`;
      } else if (location.annual_Rain < 600) {
        response += `• <span style="color: #16a34a; font-weight: bold;">Dry area</span> - ensure reliable water supply\n`;
        response += `• <span style="color: #16a34a; font-weight: bold;">Choose drought-resistant breeds</span>\n`;
      }
      
      response += `• Contact local veterinary officer\n`;
      response += `• Join livestock farmer groups\n`;
      
    } else {
      response += `❌ <span style="color: #16a34a; font-weight: bold;">No specific matches for ${location.ward}</span>\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">What to do:</span>\n`;
      response += `• Contact ${location.county} veterinary office\n`;
      response += `• Visit KALRO regional centers\n`;
    }

    // Create cards for specific livestock types
    const cards = [
      {
        title: "Dairy Cattle",
        subtitle: `Milk production options for ${location.ward}`,
        icon: "🐄",
        action: `dairy cattle for ${location.ward} ward`,
        color: "bg-blue-50 border-blue-200 text-blue-800"
      },
      {
        title: "Goats",
        subtitle: `Meat and milk goats for ${location.ward}`,
        icon: "🐐",
        action: `goats for ${location.ward} ward`,
        color: "bg-purple-50 border-purple-200 text-purple-800"
      },
      {
        title: "Poultry",
        subtitle: `Chickens and layers for ${location.ward}`,
        icon: "🐔",
        action: `poultry for ${location.ward} ward`,
        color: "bg-amber-50 border-amber-200 text-amber-800"
      },
      {
        title: "Sheep",
        subtitle: `Wool and meat sheep for ${location.ward}`,
        icon: "🐑",
        action: `sheep for ${location.ward} ward`,
        color: "bg-gray-50 border-gray-200 text-gray-800"
      }
    ];
    
    return {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date(),
      hasCards: true,
      cards
    };
  };

  // Generate pasture response with better structure
  const generatePastureResponse = (location: ClimateData): Message => {
    console.log(`🌾 Generating pasture recommendations for: ${location.ward}, ${location.subcounty}, ${location.county}`);
    
    const recommendations = getPastureRecommendations(pastureData, location, aezData);
    const aez = determineAEZ(location, aezData);
    
    let response = `🌾 <span style="color: #16a34a; font-weight: bold;">Best Pasture for ${location.ward} Ward</span>\n\n`;
    response += `📍 <span style="color: #16a34a; font-weight: bold;">Location:</span> ${location.ward}, ${location.subcounty}, ${location.county}\n`;
    response += `🏔️ <span style="color: #16a34a; font-weight: bold;">Zone:</span> ${aez.toUpperCase()}\n\n`;
    
    if (recommendations.length > 0) {
      const grouped = recommendations.reduce((acc, rec) => {
        if (!acc[rec.pasture['Pasture/fodder']]) acc[rec.pasture['Pasture/fodder']] = [];
        acc[rec.pasture['Pasture/fodder']].push(rec);
        return acc;
      }, {} as Record<string, typeof recommendations>);
      
      response += `🏆 <span style="color: #16a34a; font-weight: bold;">Perfect Pasture for ${location.ward}:</span>\n\n`;
      Object.entries(grouped).forEach(([type, pastures]) => {
        response += `<span style="color: #16a34a; font-weight: bold;">${type}</span>\n`;
        pastures.slice(0, 3).forEach(rec => {
          response += `  • ${rec.pasture.Variety}\n`;
        });
        response += `\n`;
      });
      
      response += `🌱 <span style="color: #16a34a; font-weight: bold;">Growing Tips for ${location.ward}:</span>\n`;
      if (location.annual_Rain > 1000) {
        response += `• <span style="color: #16a34a; font-weight: bold;">High rainfall</span> - excellent for legumes and Napier grass\n`;
      } else {
        response += `• <span style="color: #16a34a; font-weight: bold;">Choose drought-tolerant varieties</span>\n`;
      }
      
      response += `• Get quality seeds from certified dealers\n`;
      response += `• Contact extension officer for guidance\n`;
      
    } else {
      response += `❌ <span style="color: #16a34a; font-weight: bold;">No specific matches for ${location.ward}</span>\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">Try these options:</span>\n`;
      response += `• Contact ${location.county} agricultural office\n`;
      response += `• Consider other pasture types suitable for your area\n`;
      response += `• Visit KALRO research stations\n`;
    }

    // Create cards for specific pasture types
    const cards = [
      {
        title: "Grass Pastures",
        subtitle: `Rhodes, Kikuyu grass for ${location.ward}`,
        icon: "🌱",
        action: `grass pastures for ${location.ward} ward`,
        color: "bg-green-50 border-green-200 text-green-800"
      },
      {
        title: "Legume Pastures",
        subtitle: `Lucerne, desmodium for ${location.ward}`,
        icon: "🍀",
        action: `legume pastures for ${location.ward} ward`,
        color: "bg-emerald-50 border-emerald-200 text-emerald-800"
      },
      {
        title: "Fodder Crops",
        subtitle: `Napier grass, sorghum for ${location.ward}`,
        icon: "🌾",
        action: `fodder crops for ${location.ward} ward`,
        color: "bg-yellow-50 border-yellow-200 text-yellow-800"
      },
      {
        title: "Tree Fodder",
        subtitle: `Calliandra, leucaena for ${location.ward}`,
        icon: "🌳",
        action: `tree fodder for ${location.ward} ward`,
        color: "bg-amber-50 border-amber-200 text-amber-800"
      }
    ];
    
    return {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date(),
      hasCards: true,
      cards
    };
  };

  // Generate climate response
  const generateClimateResponse = (location: ClimateData): string => {
    const aez = determineAEZ(location, aezData);
    
    let response = `🌡️ <span style="color: #16a34a; font-weight: bold;">Climate Info for ${location.ward} Ward</span>\n\n`;
    
    response += `📍 <span style="color: #16a34a; font-weight: bold;">Location:</span> ${location.ward}, ${location.subcounty}, ${location.county}\n\n`;
    
    response += `📊 <span style="color: #16a34a; font-weight: bold;">Weather Summary:</span>\n`;
    response += `• <span style="color: #16a34a; font-weight: bold;">Temperature:</span> ${location.annual_Temp}°C average\n`;
    response += `• <span style="color: #16a34a; font-weight: bold;">Rainfall:</span> ${location.annual_Rain}mm per year\n`;
    response += `• <span style="color: #16a34a; font-weight: bold;">Altitude:</span> ${location.altitude}m above sea level\n`;
    response += `• <span style="color: #16a34a; font-weight: bold;">Soil pH:</span> ${location.ke_ph}\n`;
    response += `• <span style="color: #16a34a; font-weight: bold;">AEZ:</span> ${aez.toUpperCase()}\n\n`;
    
    response += `🌿 <span style="color: #16a34a; font-weight: bold;">What This Means for ${location.ward}:</span>\n\n`;
    
    if (location.annual_Temp > 25) {
      response += `🔥 <span style="color: #16a34a; font-weight: bold;">Hot Climate:</span>\n• Perfect for: Cassava, mango, cotton, sorghum\n• Strategy: Early morning/evening planting\n\n`;
    } else if (location.annual_Temp > 20) {
      response += `🌤️ <span style="color: #16a34a; font-weight: bold;">Warm Climate:</span>\n• Perfect for: Maize, beans, vegetables, bananas\n• Strategy: Most crops do well\n\n`;
    } else if (location.annual_Temp > 15) {
      response += `🌥️ <span style="color: #16a34a; font-weight: bold;">Cool Climate:</span>\n• Perfect for: Wheat, potatoes, cabbage, tea\n• Strategy: Cool season crops\n\n`;
    } else {
      response += `❄️ <span style="color: #16a34a; font-weight: bold;">Cool Highland:</span>\n• Perfect for: Tea, coffee, pyrethrum\n• Strategy: High-value crops\n\n`;
    }
    
    if (location.annual_Rain > 1200) {
      response += `🌧️ <span style="color: #16a34a; font-weight: bold;">High Rainfall:</span>\n• Excellent for: Rice, bananas, tea, coffee\n• Watch for: Fungal diseases\n• Strategy: Good drainage essential\n`;
    } else if (location.annual_Rain > 800) {
      response += `🌦️ <span style="color: #16a34a; font-weight: bold;">Good Rainfall:</span>\n• Suitable for: Most crops with minimal irrigation\n• Strategy: Water storage for dry season\n`;
    } else {
      response += `☀️ <span style="color: #16a34a; font-weight: bold;">Low Rainfall:</span>\n• Focus on: Drought-resistant crops\n• Essential: Water harvesting and drip irrigation\n`;
    }
    
    return response;
  };

  // Main response generator
  const generateResponse = (userMessage: string): Message => {
    console.log(`🤖 Processing: "${userMessage}"`);
    
    // Try to find location in the message
    const location = extractLocation(userMessage);
    
    if (!location) {
      // Show available locations for guidance
      const counties = [...new Set(climateData.map(d => d.county))].sort();
      const sampleWards = climateData.slice(0, 8);
      
      let response = `❓ <span style="color: #16a34a; font-weight: bold;">I need your specific location to help you!</span>\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">Available Counties:</span> ${counties.slice(0, 6).join(', ')}\n\n`;
      response += `<span style="color: #16a34a; font-weight: bold;">Example Wards:</span>\n`;
      sampleWards.forEach(ward => {
        response += `• <span style="color: #16a34a; font-weight: bold;">${ward.ward}</span> (${ward.subcounty}, ${ward.county})\n`;
      });
      response += `\n<span style="color: #16a34a; font-weight: bold;">Try asking:</span>\n`;
      response += `• "What crops for ${sampleWards[0].ward} ward?"\n`;
      response += `• "Climate in ${sampleWards[1].ward} ward"\n`;
      response += `• "Livestock for ${sampleWards[2].ward} ward"\n`;
      response += `\n💡 **Tip:** Use exact ward names for best results!`;
      
      return {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "🌾 <span style=\"color: #16a34a; font-weight: bold;\">Hello! I'm your KALRO Agricultural AI Assistant</span> 🤖\n\nWhat do you want to know about?\n\n🌱 <span style=\"color: #16a34a; font-weight: bold;\">Crops</span> - What to plant in your area\n🐄 <span style=\"color: #16a34a; font-weight: bold;\">Livestock</span> - Best animals for your farm\n🌾 <span style=\"color: #16a34a; font-weight: bold;\">Pasture</span> - Fodder and grass recommendations",
        timestamp: new Date()
      };
    }
    
    // Determine what the user wants to know
    const intent = getIntent(userMessage);
    
    console.log(`✅ Found location: ${location.ward}, ${location.subcounty}, ${location.county}`);
    console.log(`🎯 Intent:`, intent);
    
    // Generate appropriate response using the actual recommendation systems
    switch (intent.category) {
      case 'crops':
        if (intent.cropType) {
          return generateSpecificCropResponse(location, intent.cropType);
        }
        return generateCropResponse(location);
      case 'livestock':
        if (intent.livestockType) {
          return generateSpecificLivestockResponse(location, intent.livestockType);
        }
        return generateLivestockResponse(location);
      case 'pasture':
        if (intent.pastureType) {
          return generateSpecificPastureResponse(location, intent.pastureType);
        }
        return generatePastureResponse(location);
      case 'climate':
        return {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: generateClimateResponse(location),
          timestamp: new Date()
        };
      default:
        return generateCropResponse(location);
    }
  };

  const handleCardClick = (action: string) => {
    setInputMessage(action);
    // Automatically send the message
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const botResponse = generateResponse(currentMessage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
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
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 z-50 animate-pulse p-3"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          <div className="text-sm font-semibold">
            <div>KALRO Selector</div>
            <div className="text-xs text-green-100">Chatbot</div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-green-100 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              KALRO Selector Chatbot
              <Zap className="w-4 h-4 text-yellow-300" />
            </h3>
            <p className="text-xs text-green-100">Smart Agricultural Assistant • {climateData.length} locations</p>
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
          <div className="flex-1 p-4 overflow-y-auto h-[480px] space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    }`}>
                      {message.type === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div 
                        className="text-sm whitespace-pre-line" 
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Clickable Cards */}
                {message.hasCards && message.cards && (
                  <div className="mt-3 ml-10 space-y-2">
                    <p className="text-xs text-gray-500 mb-2">💡 Click for more specific information:</p>
                    {message.cards.map((card, index) => (
                      <button
                        key={index}
                        onClick={() => handleCardClick(card.action)}
                        className={`w-full p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] text-left ${card.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{card.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{card.title}</div>
                              <div className="text-xs opacity-75">{card.subtitle}</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">Analyzing {climateData.length} locations...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask: 'crops in kandara ward' or 'livestock in nakuru'"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setInputMessage("crops in kandara ward")}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
              >
                🌱 Kandara Crops
              </button>
              <button
                onClick={() => setInputMessage("climate in machakos")}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
              >
                🌡️ Machakos Climate
              </button>
              <button
                onClick={() => setInputMessage("livestock in nakuru")}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors"
              >
                🐄 Nakuru Livestock
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};