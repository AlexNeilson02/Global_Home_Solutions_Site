import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useSalesperson } from "@/contexts/SalespersonContext";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import BidRequestForm from "@/components/BidRequestForm";
import logoPath from "@/assets/global-home-solutions-logo.png";
import heroBackgroundImage from "@/assets/ghs-office-front.png";
import mobileHeroImage from "@assets/global home mobile 1_1754514857525.png";
import "../styles/HomePage.css";

export default function HomePage() {
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const { salespersonId } = useSalesperson();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentHeroImage = isMobile ? mobileHeroImage : heroBackgroundImage;

  return (
    <div className="homepage-container" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Subtle About Us Link */}
      <Link 
        href="/about"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 20,
          padding: '8px 16px',
          borderRadius: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        className="hover:bg-white/30 hover:scale-105"
      >
        About Us
      </Link>
      
      <header className="hero-header">
        <div className="hero-image-container">
          <img 
            src={currentHeroImage} 
            alt="Home Construction Background" 
            className="hero-background-image"
          />
        </div>
      </header>
      <div style={{ 
        position: 'absolute', 
        bottom: '15%', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 10 
      }}>
        <button 
          onClick={() => navigateWithSalesperson('/services')}
          className="find-contractor-btn"
        >
          Find a Contractor
        </button>
        {salespersonId && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(34, 197, 94, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
            zIndex: 1000
          }}>
            Commission Tracking Active (ID: {salespersonId})
          </div>
        )}
      </div>
    </div>
  );
}