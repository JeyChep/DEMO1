import React from 'react';
import { Leaf, Cog as Cow, Wheat, MapPin } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'crops' | 'livestock' | 'pasture' | 'suitability-map';
  onTabChange: (tab: 'crops' | 'livestock' | 'pasture' | 'suitability-map') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'crops' as const, label: 'Crops', icon: Leaf },
    { id: 'livestock' as const, label: 'Livestock', icon: Cow },
    { id: 'pasture' as const, label: 'Pasture', icon: Wheat },
    { id: 'suitability-map' as const, label: 'Suitability Map', icon: MapPin }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-green-200 mb-8">
      <div className="flex flex-wrap">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 min-w-0 flex items-center justify-center gap-2 py-4 px-3 font-semibold transition-all duration-200
                ${isActive 
                  ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                  : 'text-green-700 hover:text-green-800 hover:bg-green-50 hover:shadow-md'
                }
                ${isFirst ? 'rounded-l-xl' : ''}
                ${isLast ? 'rounded-r-xl' : ''}
                ${!isActive && !isFirst ? 'border-l border-green-100' : ''}
              `}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-lg">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};