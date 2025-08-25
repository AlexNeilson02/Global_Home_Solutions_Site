import React from 'react'
import { Home, Search, User, Settings } from 'lucide-react'
import { useLocation } from 'wouter'

const MobileBottomNav: React.FC = () => {
  const [location, setLocation] = useLocation()

  const tabs = [
    { id: '/', label: 'Home', icon: Home },
    { id: '/services', label: 'Services', icon: Search },
    { id: '/profile', label: 'Profile', icon: User },
    { id: '/settings', label: 'Settings', icon: Settings }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setLocation(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-0 flex-1 transition-all duration-200 ${
                isActive 
                  ? 'text-primary bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium truncate">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav