import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import HomeownerBottomNav from "@/components/mobile/HomeownerBottomNav";
import { TouchOptimizedButton } from "@/components/mobile/TouchOptimizations";

interface ServiceCategoriesResponse {
  services: Array<{
    id: number;
    name: string;
  }>;
}

const BrowseServices = () => {
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('services');

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: serviceCategories } = useQuery<ServiceCategoriesResponse>({
    queryKey: ["/api/service-categories"],
  });

  const services = serviceCategories?.services || [];
  
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleServiceClick = (serviceName: string) => {
    // Navigate to contractor directory with pre-selected service
    navigateWithSalesperson(`/services?category=${encodeURIComponent(serviceName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: isMobile ? '80px' : '0' }}>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Services</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'touch-target' : ''}`}
              style={{ fontSize: isMobile ? '18px' : '16px' }}
            />
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {searchTerm && (
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {filteredServices.length > 0 ? 'Search Results' : 'No services found'}
            </h2>
          )}
          
          {!searchTerm && (
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Services</h2>
          )}

          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service.name)}
              className={`bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md hover:border-gray-300 ${isMobile ? 'touch-target' : ''}`}
              style={{ minHeight: isMobile ? '60px' : '56px' }}
            >
              <span className="text-gray-900 font-medium text-lg capitalize">
                {service.name.toLowerCase()}
              </span>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          ))}

          {filteredServices.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No services found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <HomeownerBottomNav 
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'contractors') {
              navigateWithSalesperson('/services');
            } else if (tab === 'services') {
              // Stay on current page
            } else if (tab === 'profile') {
              navigateWithSalesperson('/login');
            } else if (tab === 'bids') {
              navigateWithSalesperson('/login'); // Redirect to login for now
            }
          }}
        />
      )}
    </div>
  );
};

export default BrowseServices;