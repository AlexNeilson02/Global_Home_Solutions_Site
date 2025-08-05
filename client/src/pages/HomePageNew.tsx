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
import "../styles/HomePage.css";

export default function HomePage() {
  const [, navigate] = useLocation();
  const [trade, setTrade] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [trackedSalesperson, setTrackedSalesperson] = useState<any>(null);

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
  const trades = servicesData?.services
    ?.map((service: any) => service.name)
    ?.sort((a: string, b: string) => a.localeCompare(b)) || [];

  // Track QR code visits for sales rep attribution
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    if (refParam && !trackedSalesperson) {
      // Track the visit for commission attribution
      apiRequest('POST', '/api/track-visit', {
        salespersonProfileUrl: refParam,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      })
      .then((response) => response.json())
      .then((data) => {
        console.log('Visit tracking response:', data);
        if (data.success) {
          setTrackedSalesperson(data.salesperson);
          // Store in sessionStorage to persist during the session
          sessionStorage.setItem('trackedSalesperson', JSON.stringify(data.salesperson));
          console.log('Tracked salesperson set:', data.salesperson);
        }
      })
      .catch((error) => {
        console.log('Visit tracking failed:', error);
      });
    } else if (!trackedSalesperson) {
      // Check if we have a tracked salesperson from sessionStorage
      const stored = sessionStorage.getItem('trackedSalesperson');
      if (stored) {
        setTrackedSalesperson(JSON.parse(stored));
      }
    }
  }, [trackedSalesperson]);

  useEffect(() => {
    if (!trade) {
      setSearchTriggered(false);
    }
  }, [trade, searchTriggered]);

  const handleCategoryClick = (category) => {
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
      {/* QR Code Tracking Banner */}
      {trackedSalesperson && (
        <div className="bg-blue-600 text-white px-4 py-3 text-center">
          <p className="text-sm">
            👋 Welcome! You were referred by <strong>{trackedSalesperson.fullName}</strong>, your dedicated sales representative.
          </p>
        </div>
      )}
      <header 
        className="hero-header"
        style={{
          backgroundImage: `url('/attached_assets/0F1A4638_1754427544413.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}
      >
        <div className="hero-overlay">
          <img src={logoPath} alt="Global Home Solutions Logo" className="logo-hero" />
          <h1>Global Home Solutions</h1>
          <p className="culture">
            Browse by trade to view qualified contractors. Watch their videos, review completed projects, and select the professional who best matches your needs.
          </p>
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
        />
      )}
    </div>
  );
}