import React from 'react'
import MobileHeader from '../components/MobileHeader'
import MobileBottomNav from '../components/MobileBottomNav'
import { Search, Star, MapPin } from 'lucide-react'

const MobileHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Global Home Solutions" />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-6 rounded-b-3xl">
        <h2 className="text-2xl font-bold mb-2">Find Trusted Contractors</h2>
        <p className="text-blue-100 mb-4">Connect with vetted professionals for all your home improvement needs</p>
        
        {/* Search Bar */}
        <div className="bg-white/90 backdrop-blur rounded-full p-1 flex items-center">
          <div className="flex-1 px-4 py-2">
            <input
              type="text"
              placeholder="Search services..."
              className="w-full bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
            />
          </div>
          <button className="bg-primary text-white p-3 rounded-full">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            'Plumbing', 'Electrical', 'Roofing', 'HVAC',
            'Painting', 'Flooring', 'Kitchen', 'Bathroom'
          ].map((service) => (
            <button
              key={service}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-primary rounded" />
                </div>
                <span className="text-sm font-medium text-gray-800">{service}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Featured Contractors */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Contractors</h3>
        <div className="space-y-4 mb-20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">Contractor Name {i}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">4.8 (125 reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>2.1 miles away</span>
                  </div>
                </div>
                <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}

export default MobileHome