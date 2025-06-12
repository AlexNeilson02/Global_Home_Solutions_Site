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
  Shield,
  BarChart3
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
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'projects', label: 'Projects', icon: Building },
          { id: 'leads', label: 'Leads', icon: Bell, hasNotification: notificationCount > 0 },
          { id: 'profile', label: 'Profile', icon: User }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'contractors', label: 'Contractors', icon: Building },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'sales':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'leads', label: 'Leads', icon: FileText },
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
      {/* Mobile Bottom Navigation - Force visible on mobile with CSS override */}
      <div className="mobile-nav-show fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 hidden sm:hidden">
        <div className="flex items-center justify-around py-3 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center px-2 py-1 min-w-0 relative flex-1 transition-colors ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-1" />
                  {tab.hasNotification && notificationCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 text-xs flex items-center justify-center animate-pulse p-0 min-w-4"
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-full">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;