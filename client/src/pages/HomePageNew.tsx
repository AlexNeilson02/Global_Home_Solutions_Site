import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useSalesperson } from "@/contexts/SalespersonContext";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import BidRequestForm from "@/components/BidRequestForm";
import HomeownerBottomNav from "@/components/mobile/HomeownerBottomNav";
import { TouchOptimizedButton } from "@/components/mobile/TouchOptimizations";
import { useAuth } from "@/lib/auth";
import logoPath from "@/assets/global-home-solutions-logo.png";
import heroBackgroundImage from "@/assets/ghs-office-front.png";
import mobileHeroImage from "@assets/global home mobile 1_1754514857525.png";
import "../styles/HomePage.css";

export default function HomePage() {
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const { salespersonId } = useSalesperson();
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [trackingComplete, setTrackingComplete] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('contractors');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Page visit tracking for ?ref=username
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    // Only track if we have ref parameter and haven't tracked yet
    if (refParam && !trackingComplete && !trackingLoading) {
      setTrackingLoading(true);
      console.log('🔄 Starting page visit tracking for ref:', refParam);
      
      const trackVisit = async (retryCount = 0) => {
        try {
          console.log(`📡 Attempt ${retryCount + 1}: Making track-visit API call...`);
          
          const response = await apiRequest('POST', '/api/track-visit', {
            salespersonProfileUrl: refParam,
            userAgent: navigator.userAgent,
            referrer: document.referrer
          });
          
          if (response.ok) {
            console.log('✅ Page visit tracked successfully for ref:', refParam);
            setTrackingComplete(true);
          } else {
            throw new Error(`Track visit failed with status: ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ Track visit attempt ${retryCount + 1} failed:`, error);
          
          // Retry up to 2 times with exponential backoff
          if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`🔄 Retrying in ${delay}ms...`);
            setTimeout(() => trackVisit(retryCount + 1), delay);
          } else {
            console.error('❌ All tracking attempts failed for ref:', refParam);
            setTrackingComplete(true); // Allow page to work without tracking
            setTrackingLoading(false); // Clear loading state when all attempts fail
          }
        } finally {
          if (retryCount === 0) {
            setTrackingLoading(false);
          }
        }
      };
      
      trackVisit();
    } else if (!refParam) {
      // No ref parameter, mark tracking as complete
      console.log('ℹ️ No ref parameter found - no visit tracking needed');
      setTrackingComplete(true);
    }
  }, [trackingComplete, trackingLoading]);

  const currentHeroImage = isMobile ? mobileHeroImage : heroBackgroundImage;

  return (
    <div className="homepage-container full-height smooth-scroll" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* About Us Link */}
      <Link 
        href="/about"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          textDecoration: 'none',
          fontSize: '16px',
          fontWeight: '600',
          zIndex: 20,
          padding: '12px 20px',
          borderRadius: '25px',
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
        className="hover:bg-blue-600/80 hover:scale-105 hover:shadow-lg"
      >
        About Us
      </Link>

      {/* Mobile Login Button - Top Right */}
      {isMobile && !user && (
        <TouchOptimizedButton
          onClick={() => navigateWithSalesperson('/login')}
          size="sm"
          className="mobile-nav-show fixed top-5 right-5 z-20 bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 touch-target"
        >
          Login
        </TouchOptimizedButton>
      )}

      {/* Mobile User Menu - Top Right */}
      {isMobile && user && (
        <div className="mobile-nav-show fixed top-5 right-5 z-20">
          <TouchOptimizedButton
            onClick={logout}
            size="sm"
            className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 touch-target"
          >
            Logout
          </TouchOptimizedButton>
        </div>
      )}
      
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
        bottom: isMobile ? '25%' : '15%', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 10 
      }}>
        {isMobile ? (
          <TouchOptimizedButton
            onClick={() => navigateWithSalesperson('/services')}
            size="lg"
            className="find-contractor-btn touch-target no-select tap-highlight"
            style={{ backgroundColor: '#00adee', borderColor: '#00adee' }}
          >
            Find a Contractor
          </TouchOptimizedButton>
        ) : (
          <button 
            onClick={() => navigateWithSalesperson('/services')}
            className="find-contractor-btn"
          >
            Find a Contractor
          </button>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <HomeownerBottomNav 
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'services') {
              navigateWithSalesperson('/services');
            } else if (tab === 'contractors') {
              navigateWithSalesperson('/');
            } else if (tab === 'profile') {
              navigateWithSalesperson('/login');
            }
          }}
        />
      )}
    </div>
  );
}