import React from 'react';
import { Home, Users, User, FileText } from 'lucide-react';

interface HomeownerBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const HomeownerBottomNav: React.FC<HomeownerBottomNavProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'contractors', label: 'Contractors', icon: Users },
    { id: 'services', label: 'Services', icon: Home },
    { id: 'bids', label: 'Bids', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-padding-bottom">
      <div className="flex justify-around items-center py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 touch-target ${
              activeTab === id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              fontSize: '12px',
              fontWeight: activeTab === id ? '600' : '400'
            }}
          >
            <Icon size={20} className="mb-1" />
            <span className="text-xs truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeownerBottomNav;