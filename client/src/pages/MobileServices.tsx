import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import { ChevronLeft } from "lucide-react";
import HomeownerBottomNav from "@/components/mobile/HomeownerBottomNav";
import { TouchOptimizedButton } from "@/components/mobile/TouchOptimizations";
import globalLogoPath from "@assets/GLOBAL HOME SOLUTIONS LOGO-01.png";

interface ServiceCategoriesResponse {
  services: Array<{
    id: number;
    name: string;
  }>;
}

const MobileServices = () => {
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect to home if not mobile
  useEffect(() => {
    if (!isMobile && window.innerWidth > 768) {
      navigateWithSalesperson('/');
    }
  }, [isMobile, navigateWithSalesperson]);

  const { data: serviceCategories } = useQuery<ServiceCategoriesResponse>({
    queryKey: ["/api/service-categories"],
  });

  const services = serviceCategories?.services || [];

  // Group services into categories
  const categorizeServices = (services: Array<{id: number; name: string}>) => {
    const categories: {[key: string]: Array<{id: number; name: string}>} = {
      'Interior & Remodeling': [],
      'Exterior & Roofing': [],
      'Systems & Utilities': [],
      'Maintenance & Cleaning': [],
      'Outdoor & Landscaping': [],
      'Specialty Services': []
    };

    services.forEach(service => {
      const name = service.name.toLowerCase();
      
      if (name.includes('kitchen') || name.includes('bathroom') || name.includes('flooring') || 
          name.includes('interior') || name.includes('paint') || name.includes('tile') || 
          name.includes('carpet') || name.includes('hardwood') || name.includes('countertop') || 
          name.includes('cabinet') || name.includes('drywall') || name.includes('sheet rock') || 
          name.includes('trim') || name.includes('fireplace') || name.includes('reglazing')) {
        categories['Interior & Remodeling'].push(service);
      } else if (name.includes('roof') || name.includes('siding') || name.includes('exterior') || 
                name.includes('window') || name.includes('door') || name.includes('gutter') || 
                name.includes('fence') || name.includes('deck') || name.includes('porch') || 
                name.includes('patio') || name.includes('concrete') || name.includes('foundation') || 
                name.includes('masonry') || name.includes('stone')) {
        categories['Exterior & Roofing'].push(service);
      } else if (name.includes('plumb') || name.includes('electric') || name.includes('hvac') || 
                name.includes('heating') || name.includes('cooling') || name.includes('insulation') || 
                name.includes('solar') || name.includes('generator') || name.includes('low voltage') || 
                name.includes('smart home') || name.includes('security') || name.includes('garage door') || 
                name.includes('water')) {
        categories['Systems & Utilities'].push(service);
      } else if (name.includes('clean') || name.includes('pest') || name.includes('maintenance') || 
                name.includes('restoration') || name.includes('garbage') || name.includes('haul') || 
                name.includes('window wash') || name.includes('inspection')) {
        categories['Maintenance & Cleaning'].push(service);
      } else if (name.includes('landscap') || name.includes('tree') || name.includes('turf') || 
                name.includes('pool') || name.includes('outdoor') || name.includes('patio cover') || 
                name.includes('excavat')) {
        categories['Outdoor & Landscaping'].push(service);
      } else {
        categories['Specialty Services'].push(service);
      }
    });

    return categories;
  };

  const categorizedServices = categorizeServices(services);

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <div className="homepage-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      padding: '20px',
      paddingTop: '80px',
      backgroundColor: '#f8fafc'
    }}>
      {/* Header with Back Button */}
      <button
        onClick={() => navigateWithSalesperson('/')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease',
          zIndex: 1000
        }}
      >
        <ChevronLeft size={24} color="#111827" />
      </button>

      {/* Title */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        paddingTop: '20px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          Our Services
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0'
        }}>
          Professional home improvement services
        </p>
      </div>

      {/* Services by Category */}
      <div style={{ paddingBottom: '100px' }}>
        {Object.entries(categorizedServices).map(([categoryName, categoryServices]) => {
          if (categoryServices.length === 0) return null;
          
          return (
            <div key={categoryName} style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '16px',
                paddingLeft: '4px'
              }}>
                {categoryName}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px'
              }}>
                {categoryServices.map((service) => (
                  <TouchOptimizedButton
                    key={service.id}
                    onClick={() => {
                      navigateWithSalesperson(`/services?service=${encodeURIComponent(service.name)}`);
                    }}
                    className="touch-target"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'left',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {service.name}
                    </div>
                  </TouchOptimizedButton>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Bottom Navigation */}
      <HomeownerBottomNav 
        activeTab={'services'}
        onTabChange={(tab) => {
          if (tab === 'contractors') {
            navigateWithSalesperson('/services');
          } else if (tab === 'services') {
            // Stay on current page
          } else if (tab === 'profile') {
            navigateWithSalesperson('/login');
          }
        }}
      />
    </div>
  );
};

export default MobileServices;