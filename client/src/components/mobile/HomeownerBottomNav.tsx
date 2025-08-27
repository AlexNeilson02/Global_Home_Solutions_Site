import React from 'react';
import { Home, Users } from 'lucide-react';

interface HomeownerBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const HomeownerBottomNav: React.FC<HomeownerBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'contractors', label: 'Contractors', icon: Users },
    { id: 'services', label: 'Services', icon: Home }
  ];

  return (
    <>
      {/* Bottom Navigation - Only visible on mobile screens */}
      <div className="block sm:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl border-t border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <div className="flex items-center justify-around px-4 py-3 pb-safe">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl min-w-0 relative flex-1 transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="relative mb-1">
                    <Icon className={`w-6 h-6 ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`} />
                  </div>
                  <span className={`text-xs font-medium truncate ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer for bottom navigation - Only on small screens */}
      <div className="block sm:hidden h-20" />
    </>
  );
};

export default HomeownerBottomNav;