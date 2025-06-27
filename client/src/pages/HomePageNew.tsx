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
      <header>
        <img src={logoPath} alt="Global Home Solutions Logo" className="logo-hero" />
        <h1>Global Home Solutions</h1>
        <p className="culture">
          Browse by trade to view qualified contractors. Watch their videos, review completed projects, and select the professional who best matches your needs.
        </p>
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
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '20px'
                }}>
                  <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    {/* AI-generated electrical circuit design */}
                    <defs>
                      <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#60a5fa', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Circuit board background */}
                    <rect width="100" height="100" fill="rgba(255,255,255,0.1)" rx="8"/>
                    
                    {/* Main lightning bolt */}
                    <path d="M45 10 L30 45 L50 40 L35 90 L70 35 L50 40 Z" 
                          fill="url(#circuitGrad)" 
                          filter="url(#glow)"
                          stroke="#ffffff" 
                          strokeWidth="1"/>
                    
                    {/* Circuit traces */}
                    <g stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.7">
                      <path d="M15 20 L25 20 L30 25"/>
                      <path d="M70 15 L80 15 L85 20"/>
                      <path d="M20 70 L30 70 L35 75"/>
                      <path d="M75 75 L85 75 L90 80"/>
                      <circle cx="25" cy="20" r="2" fill="#ffffff"/>
                      <circle cx="80" cy="15" r="2" fill="#ffffff"/>
                      <circle cx="30" cy="70" r="2" fill="#ffffff"/>
                      <circle cx="85" cy="75" r="2" fill="#ffffff"/>
                    </g>
                    
                    {/* Energy particles */}
                    <g fill="#ffffff" opacity="0.8">
                      <circle cx="20" cy="30" r="1">
                        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="75" cy="25" r="1">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="25" cy="80" r="1">
                        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
                      </circle>
                    </g>
                  </svg>
                </div>
              </div>
              <div className="category-content">
                <h3>Electrical</h3>
                <button className="category-btn">Find Electricians</button>
              </div>
            </div>

            <div className="category-card" onClick={() => navigate('/contractor/12')}>
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

            <div className="category-card" onClick={() => navigate('/contractor/12')}>
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

            <div className="category-card" onClick={() => navigate('/contractor/13')}>
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