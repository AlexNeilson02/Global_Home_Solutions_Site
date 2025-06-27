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
                  padding: '10px'
                }}>
                  <svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#fbbf24', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#f59e0b', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#1e40af', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#1e3a8a', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="toolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#dc2626', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#b91c1c', stopOpacity: 1}} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Background with electrical panel */}
                    <rect x="10" y="10" width="180" height="180" fill="rgba(0,0,0,0.2)" rx="8"/>
                    <rect x="15" y="15" width="40" height="60" fill="#374151" rx="4" stroke="#6b7280" strokeWidth="1"/>
                    <rect x="20" y="25" width="8" height="12" fill="#ef4444" rx="2"/>
                    <rect x="32" y="25" width="8" height="12" fill="#22c55e" rx="2"/>
                    <rect x="20" y="45" width="8" height="12" fill="#3b82f6" rx="2"/>
                    <rect x="32" y="45" width="8" height="12" fill="#eab308" rx="2"/>
                    
                    {/* Electrician figure */}
                    {/* Head */}
                    <circle cx="100" cy="50" r="18" fill="url(#skinGrad)" stroke="#ffffff" strokeWidth="1"/>
                    
                    {/* Hard hat */}
                    <path d="M82 45 Q100 35 118 45 L115 35 Q100 30 85 35 Z" fill="#eab308" stroke="#ffffff" strokeWidth="1"/>
                    <circle cx="105" cy="38" r="3" fill="#ffffff"/>
                    
                    {/* Body/Shirt */}
                    <rect x="85" y="65" width="30" height="45" fill="url(#shirtGrad)" rx="5" stroke="#ffffff" strokeWidth="1"/>
                    
                    {/* Arms */}
                    <ellipse cx="75" cy="80" rx="8" ry="20" fill="url(#shirtGrad)" stroke="#ffffff" strokeWidth="1"/>
                    <ellipse cx="125" cy="80" rx="8" ry="20" fill="url(#shirtGrad)" stroke="#ffffff" strokeWidth="1"/>
                    
                    {/* Hands */}
                    <circle cx="70" cy="95" r="6" fill="url(#skinGrad)" stroke="#ffffff" strokeWidth="1"/>
                    <circle cx="130" cy="95" r="6" fill="url(#skinGrad)" stroke="#ffffff" strokeWidth="1"/>
                    
                    {/* Tool in hand (wire strippers) */}
                    <rect x="125" y="90" width="15" height="3" fill="url(#toolGrad)" rx="1"/>
                    <rect x="135" y="88" width="3" height="7" fill="#4b5563" rx="1"/>
                    
                    {/* Utility belt */}
                    <rect x="80" y="105" width="40" height="8" fill="#374151" rx="2" stroke="#6b7280" strokeWidth="1"/>
                    <rect x="85" y="107" width="6" height="4" fill="#dc2626" rx="1"/>
                    <rect x="95" y="107" width="6" height="4" fill="#3b82f6" rx="1"/>
                    <rect x="105" y="107" width="6" height="4" fill="#22c55e" rx="1"/>
                    
                    {/* Legs */}
                    <rect x="90" y="115" width="8" height="25" fill="#1f2937" rx="3"/>
                    <rect x="102" y="115" width="8" height="25" fill="#1f2937" rx="3"/>
                    
                    {/* Work boots */}
                    <ellipse cx="94" cy="145" rx="8" ry="5" fill="#374151"/>
                    <ellipse cx="106" cy="145" rx="8" ry="5" fill="#374151"/>
                    
                    {/* Electrical wires being worked on */}
                    <path d="M65 100 Q60 105 55 110" stroke="#ef4444" strokeWidth="3" fill="none"/>
                    <path d="M65 105 Q60 110 55 115" stroke="#3b82f6" strokeWidth="3" fill="none"/>
                    <path d="M65 110 Q60 115 55 120" stroke="#22c55e" strokeWidth="3" fill="none"/>
                    
                    {/* Electrical sparks animation */}
                    <g fill="#fbbf24" opacity="0.8">
                      <circle cx="60" cy="105" r="1">
                        <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="58" cy="110" r="1">
                        <animate attributeName="opacity" values="0;1;0" dur="0.7s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="62" cy="108" r="1">
                        <animate attributeName="opacity" values="0;1;0" dur="0.6s" repeatCount="indefinite"/>
                      </circle>
                    </g>
                    
                    {/* Text label */}
                    <text x="100" y="170" textAnchor="middle" fill="#ffffff" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="bold">
                      LICENSED
                    </text>
                    <text x="100" y="185" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="Arial, sans-serif">
                      ELECTRICIAN
                    </text>
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