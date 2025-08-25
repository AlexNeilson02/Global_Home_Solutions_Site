import React from 'react'
import { ArrowLeft, Menu } from 'lucide-react'
import { useLocation } from 'wouter'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  onMenuClick?: () => void
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  showBack = false, 
  onMenuClick 
}) => {
  const [location, setLocation] = useLocation()

  const handleBack = () => {
    window.history.back()
  }

  return (
    <header className="bg-white border-b border-gray-200 safe-top sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {showBack ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>
      </div>
    </header>
  )
}

export default MobileHeader