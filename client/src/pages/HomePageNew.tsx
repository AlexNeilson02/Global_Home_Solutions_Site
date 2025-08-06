import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSalesperson } from "@/contexts/SalespersonContext";
import BidRequestForm from "@/components/BidRequestForm";
import logoPath from "@/assets/global-home-solutions-logo.png";
import heroBackgroundImage from "@/assets/ghs-office-front.png";
import "../styles/HomePage.css";

export default function HomePage() {
  const [, navigate] = useLocation();
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
          onClick={() => navigate('/services')}
          style={{
            backgroundColor: '#00aeef',
            color: 'white',
            padding: '25px 60px',
            fontSize: '28px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '15px',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,174,239,0.3)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#0088cc';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#00aeef';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Find a Contractor
        </button>
      </div>
    </div>
  );
}