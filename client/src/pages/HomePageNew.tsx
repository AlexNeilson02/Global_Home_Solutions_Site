import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import BidRequestForm from "@/components/BidRequestForm";
import { WatermelonLogo } from "../components/WatermelonLogo";
import logoPath from "@/assets/global-home-solutions-logo.png";
import watermelonWWLogo from "@/assets/watermelon-ww-logo.png";
import vaultLogo from "@/assets/vault-logo.png";
import continentalLogo from "@/assets/continental-concrete-logo.jpeg";
import heroBackgroundImage from "@/assets/ghs-office-front.png";
import "../styles/HomePage.css";

export default function HomePage() {
  const [, navigate] = useLocation();
  const [trade, setTrade] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [trackedSalesperson, setTrackedSalesperson] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingComplete, setTrackingComplete] = useState(false);

  // Fetch contractors from database
  const { data: contractors, isLoading } = useQuery({
    queryKey: ['/api/contractors'],
    enabled: true
  });

  // Fetch available services from the database
  const { data: servicesData } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  // Sort services alphabetically for the dropdown
  const trades = (servicesData as any)?.services
    ?.map((service: any) => service.name)
    ?.sort((a: string, b: string) => a.localeCompare(b)) || [];

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
    
    // Check sessionStorage first for existing tracking
    const stored = sessionStorage.getItem('trackedSalesperson');
    if (stored && !trackedSalesperson) {
      try {
        const parsedSalesperson = JSON.parse(stored);
        if (parsedSalesperson && parsedSalesperson.id) {
          setTrackedSalesperson(parsedSalesperson);
          setTrackingComplete(true);
          console.log('✓ Restored tracked salesperson from session:', parsedSalesperson);
          return;
        }
      } catch (error) {
        console.warn('Failed to parse stored salesperson data:', error);
        sessionStorage.removeItem('trackedSalesperson');
      }
    }
    
    if (refParam && !trackedSalesperson && !trackingLoading) {
      setTrackingLoading(true);
      console.log('🔄 Starting salesperson tracking for ref:', refParam);
      
      // Track the visit for commission attribution with enhanced debugging
      const trackVisit = async (retryCount = 0) => {
        try {
          console.log(`📡 Attempt ${retryCount + 1}: Making track-visit API call...`);
          
          const response = await apiRequest('POST', '/api/track-visit', {
            salespersonProfileUrl: refParam,
            userAgent: navigator.userAgent,
            referrer: document.referrer
          });
          
          console.log('📡 Raw response status:', response.status);
          console.log('📡 Raw response headers:', Object.fromEntries(response.headers.entries()));
          
          const data = await response.json();
          console.log('📡 Visit tracking response data:', data);
          
          if (data.success && data.salesperson && data.salesperson.id) {
            setTrackedSalesperson(data.salesperson);
            sessionStorage.setItem('trackedSalesperson', JSON.stringify(data.salesperson));
            console.log('✅ Successfully tracked salesperson:', data.salesperson);
            setTrackingComplete(true);
          } else {
            throw new Error('Invalid tracking response: ' + JSON.stringify(data));
          }
        } catch (error) {
          console.error(`❌ Visit tracking failed (attempt ${retryCount + 1}):`, error);
          console.error('❌ Error details:', error.message);
          console.error('❌ Error stack:', error.stack);
          
          // Retry up to 2 times with exponential backoff
          if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`🔄 Retrying in ${delay}ms...`);
            setTimeout(() => trackVisit(retryCount + 1), delay);
          } else {
            console.error('❌ All tracking attempts failed for ref:', refParam);
            setTrackingComplete(true); // Allow form to work without tracking
          }
        } finally {
          if (retryCount === 0) {
            setTrackingLoading(false);
          }
        }
      };
      
      trackVisit();
    } else if (!refParam) {
      // No QR code reference, mark tracking as complete
      console.log('ℹ️ No ref parameter found - marking tracking complete');
      setTrackingComplete(true);
    } else {
      console.log('🚫 Skipping tracking: refParam exists but conditions not met');
      console.log('🚫 Current state:', { refParam, trackedSalesperson: !!trackedSalesperson, trackingLoading });
    }
  }, [trackedSalesperson, trackingLoading]);

  useEffect(() => {
    if (!trade) {
      setSearchTriggered(false);
    }
  }, [trade, searchTriggered]);

  const handleCategoryClick = (category: string) => {
    setTrade(category);
    setSearchTriggered(true);
  };

  const handleFindContractor = () => {
    if (trade.trim()) {
      setSearchTriggered(true);
    }
  };

  const handleRequestBid = (contractor: any) => {
    setSelectedContractor(contractor);
    setShowBidForm(true);
  };

  const handleCloseBidForm = () => {
    setShowBidForm(false);
    setSelectedContractor(null);
  };

  const clearSearch = () => {
    setTrade("");
    setSearchTriggered(false);
  };

  const getFilteredContractors = () => {
    if (!searchTriggered || !trade || !contractors?.contractors) {
      return [];
    }
    
    const contractorsList = Array.isArray(contractors.contractors) ? contractors.contractors : [];
    
    return contractorsList
      .filter((contractor: any) => 
        contractor.specialties && 
        Array.isArray(contractor.specialties) &&
        contractor.specialties.some((specialty: string) => 
          specialty.toLowerCase().includes(trade.toLowerCase())
        )
      )
      .slice(0, 5);
  };

  const filteredContractors = getFilteredContractors();

  return (
    <div className="homepage-container">

      <header className="hero-header">
        <div className="hero-image-container">
          <img 
            src={heroBackgroundImage} 
            alt="Home Construction Background" 
            className="hero-background-image"
          />
        </div>
        
      </header>
      <section className="search-section">
        <div className="search-input-container">
          <select
            className="service-dropdown"
            value={trade}
            onChange={e => setTrade(e.target.value)}
          >
            <option value="">Select a service...</option>
            {trades.map(tr => (
              <option key={tr} value={tr}>{tr}</option>
            ))}
          </select>
          {trade && (
            <button className="clear-search-btn" onClick={clearSearch}>
              ✕
            </button>
          )}
        </div>
        <button className="find-contractor-btn" onClick={handleFindContractor}>Find a Contractor</button>
      </section>
      {/* Featured Contractors Section - Only show when no search has been triggered */}
      {!searchTriggered && (
        <section className="category-section">
          <h2>Find the right contractor for your project</h2>
          <div className="category-grid">
            <div className="category-card" onClick={() => handleCategoryClick("Electrical")}>
              <div className="category-image electrician-bg" style={{
                backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAChYAAAoWCAIAAAANCfymAAD2IklEQVR4nOzZMQHAMAzAsKz8OWePObSHhMC/v90dAAAAAAAAAJg5twMAAAAAAAAAeIWFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACAWMgAAAAAAAAAxEIGAAAAAAAAIBYyAAAAAAAAALGQAQAAAAAAAIiFDAAAAAAAAEAsZAAAAAAAAABiIQMAAAAAAAAQCxkAAAAAAACA)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '150px'
              }}>
                <img 
                  src="/attached_assets/image_1751041918876.png" 
                  alt="Professional Electrician at Work"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
              </div>
              <div className="category-content">
                <h3>Electrical</h3>
                <button className="category-btn">Find Electricians</button>
              </div>
            </div>

            <div className="category-card" onClick={() => navigate('/contractor/19')}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src={continentalLogo} 
                  alt="Continental Concrete" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div className="category-content">
                <h3>Continental Concrete</h3>
                <button className="category-btn">View Profile</button>
              </div>
            </div>

            <div className="category-card" onClick={() => navigate('/contractor/20')}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src={vaultLogo} 
                  alt="Vault Pest Control" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div className="category-content">
                <h3>Vault Pest Control</h3>
                <button className="category-btn">View Profile</button>
              </div>
            </div>

            <div className="category-card" onClick={() => navigate('/contractor/18')}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src={watermelonWWLogo} 
                  alt="Watermelon Window Washing" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div className="category-content">
                <h3>Watermelon Window Washing</h3>
                <button className="category-btn">View Profile</button>
              </div>
            </div>
          </div>
        </section>
      )}
      {searchTriggered && trade && (
        <section className="contractors-section">
          <h2>{trade} Contractors</h2>
          <div className="contractor-list">
            {filteredContractors.length > 0 ? filteredContractors.map((contractor: any) => (
              <div key={contractor.id} className="contractor-card">
                <img 
                  src={contractor.logoUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'} 
                  alt={contractor.companyName} 
                />
                <div className="contractor-info">
                  <h3>{contractor.companyName}</h3>
                  <p className="trade">{contractor.specialties?.join(', ')}</p>
                  <button 
                    className="profile-btn blue-link"
                    onClick={() => navigate(`/contractor/${contractor.id}`)}
                  >
                    View Profile
                  </button>
                  <div className="contractor-actions">
                    <button 
                      className="request-bid-btn big-button"
                      onClick={() => handleRequestBid(contractor)}
                    >
                      Request Bid
                    </button>
                  </div>
                </div>
              </div>
            )) : <p>No contractors found for this trade.</p>}
          </div>
        </section>
      )}
      {/* Bid Request Form Modal */}
      {selectedContractor && (
        <BidRequestForm
          isOpen={showBidForm}
          onClose={handleCloseBidForm}
          contractor={selectedContractor}
          trackedSalesperson={trackedSalesperson}
          trackingLoading={trackingLoading}
          trackingComplete={trackingComplete}
        />
      )}
    </div>
  );
}