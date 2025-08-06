import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSalesperson } from "@/contexts/SalespersonContext";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import BidRequestForm from "@/components/BidRequestForm";
import logoPath from "@/assets/global-home-solutions-logo.png";
import heroBackgroundImage from "@/assets/ghs-office-front.png";
import "../styles/HomePage.css";

export default function HomePage() {
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const { salespersonId } = useSalesperson();

  return (
    <div className="homepage-container" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <header className="hero-header">
        <div className="hero-image-container">
          <img 
            src={heroBackgroundImage} 
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