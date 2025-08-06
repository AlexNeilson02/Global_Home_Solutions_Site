import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import BidRequestForm from "@/components/BidRequestForm";
import logoPath from "@/assets/global-home-solutions-logo.png";
import heroBackgroundImage from "@/assets/ghs-office-front.png";
import "../styles/HomePage.css";

export default function HomePage() {
  const [, navigate] = useLocation();
  const [trackedSalesperson, setTrackedSalesperson] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingComplete, setTrackingComplete] = useState(false);

  // Track QR code visits for sales rep attribution with comprehensive debugging
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    console.log('=== QR Tracking Debug ===');
    console.log('Current URL:', window.location.href); 
    console.log('URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Ref param:', refParam);
    console.log('Current trackedSalesperson:', trackedSalesperson);
    console.log('Tracking loading:', trackingLoading);
    console.log('========================');
    
    // CRITICAL: Only restore from sessionStorage if there's a QR parameter
    // This prevents attribution when users visit directly without QR codes
    if (refParam) {
      // Check sessionStorage for existing tracking ONLY if there's a QR parameter
      const stored = sessionStorage.getItem('trackedSalesperson');
      if (stored && !trackedSalesperson) {
        try {
          const parsedSalesperson = JSON.parse(stored);
          // Verify that stored data has proper verification fields
          if (parsedSalesperson && parsedSalesperson.id && parsedSalesperson.sessionTrackingId && parsedSalesperson.isVerified) {
            setTrackedSalesperson(parsedSalesperson);
            setTrackingComplete(true);
            console.log('✓ Restored verified tracked salesperson from session:', parsedSalesperson);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse stored salesperson data:', error);
          sessionStorage.removeItem('trackedSalesperson');
        }
      }
    } else {
      // CRITICAL: Clear any existing tracking when visiting without QR parameter
      console.log('🧹 Clearing previous sales attribution - direct visit without QR code');
      sessionStorage.removeItem('trackedSalesperson');
      setTrackedSalesperson(null);
    }
    
    if (refParam && !trackedSalesperson && !trackingLoading) {
      setTrackingLoading(true);
      console.log('🔄 Starting salesperson tracking for ref:', refParam);
      
      // Track the visit for commission attribution with enhanced debugging
      const trackVisit = async (retryCount = 0) => {
        try {
          console.log(`📞 Making API call to track visit (attempt ${retryCount + 1}):`, {
            url: '/api/track-visit',
            method: 'POST',
            body: { salespersonProfileUrl: refParam }
          });
          
          const response = await fetch('/api/track-visit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ salespersonProfileUrl: refParam })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const responseData = await response.json();
          
          if (responseData.success && responseData.salesperson) {
            console.log('✅ Visit tracked successfully:', responseData);
            
            // Store both salesperson and session tracking ID for commission verification
            const trackingData = {
              ...responseData.salesperson,
              sessionTrackingId: responseData.sessionTrackingId,
              isVerified: responseData.isVerified
            };
            
            // Set state with full verification data
            setTrackedSalesperson(trackingData);
            setTrackingComplete(true);
            
            try {
              sessionStorage.setItem('trackedSalesperson', JSON.stringify(trackingData));
              console.log('💾 Stored verified tracking data:', trackingData);
            } catch (storageError) {
              console.warn('Failed to store in sessionStorage:', storageError);
            }
          } else {
            console.warn('⚠️ API returned unsuccessful response:', responseData);
          }
        } catch (error: unknown) {
          console.error(`❌ Error tracking visit (attempt ${retryCount + 1}):`, error);
          
          // Retry up to 3 times for network errors
          if (retryCount < 2) {
            const delay = (retryCount + 1) * 1000; // 1s, 2s, 3s delays
            console.log(`🔄 Retrying in ${delay}ms...`);
            setTimeout(() => trackVisit(retryCount + 1), delay);
            return;
          }
          
          console.error('💥 Max retries exceeded. Visit tracking failed.');
        } finally {
          if (retryCount >= 2) {
            setTrackingLoading(false);
          }
        }
      };
      
      trackVisit();
    } else if (!refParam && !trackedSalesperson) {
      console.log('ℹ️ No ref parameter found - marking tracking complete');
      setTrackingComplete(true);
    }
  }, []);  // Run only on mount to avoid infinite loops

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