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

      {/* Services Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        paddingBottom: '100px'
      }}>
        {services.map((service) => (
          <TouchOptimizedButton
            key={service.id}
            onClick={() => {
              // Navigate to contractors page with this service pre-selected
              navigateWithSalesperson(`/services?service=${encodeURIComponent(service.name)}`);
            }}
            className="touch-target"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'left',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              {service.name}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Tap to find contractors →
            </div>
          </TouchOptimizedButton>
        ))}
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