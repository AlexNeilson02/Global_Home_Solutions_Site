import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Building, 
  FileText, 
  Users, 
  Settings, 
  TrendingUp, 
  Bell,
  User,
  BarChart3,
  Target,
  DollarSign
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  portalType: 'contractor' | 'admin' | 'sales';
  notificationCount?: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  portalType,
  notificationCount = 0
}) => {
  const getTabConfig = () => {
    switch (portalType) {
      case 'contractor':
        return [
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'projects', label: 'Projects', icon: Building },
          { id: 'leads', label: 'Leads', icon: Bell, hasNotification: notificationCount > 0 },
          { id: 'profile', label: 'Profile', icon: User }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'sales':
        return [
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'leads', label: 'Leads', icon: FileText },
          { id: 'commissions', label: 'Commissions', icon: DollarSign },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'profile', label: 'Profile', icon: User }
        ];
      default:
        return [];
    }
  };

  const tabs = getTabConfig();

  return (
    <>
      {/* Bottom Navigation - Only visible on screens 640px and below */}
      <div className="block sm:hidden fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <div className="flex items-center justify-around px-2 py-3">
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
                    {tab.hasNotification && notificationCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 w-4 text-xs flex items-center justify-center animate-pulse p-0 min-w-4"
                      >
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </Badge>
                    )}
                  </div>
                  <span className={`text-xs font-medium truncate max-w-full ${
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
      <div className="block sm:hidden h-24" />
    </>
  );
};

export default MobileBottomNav;