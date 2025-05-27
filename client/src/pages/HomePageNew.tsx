import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import logoPath from "@/assets/global-home-solutions-logo.png";
import "../styles/HomePage.css";

const trades = [
  "Plumbing", "Electrical", "Flooring", "Concrete", "Roofing", "HVAC"
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trade, setTrade] = useState(searchParams.get("trade") || "");
  const [searchTriggered, setSearchTriggered] = useState(!!searchParams.get("trade"));
  const navigate = useNavigate();

  // Fetch contractors from database
  const { data: contractors, isLoading } = useQuery({
    queryKey: ['/api/contractors'],
    enabled: true
  });

  useEffect(() => {
    if (trade && searchTriggered) {
      setSearchParams({ trade });
    } else if (!trade) {
      setSearchParams({});
      setSearchTriggered(false);
    }
  }, [trade, searchTriggered, setSearchParams]);

  const handleCategoryClick = (category) => {
    setTrade(category);
    setSearchTriggered(true);
  };

  const handleFindContractor = () => {
    if (trade.trim()) {
      setSearchTriggered(true);
    }
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
      <header>
        <img src={logoPath} alt="Global Home Solutions Logo" className="logo" />
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

      {/* Category Cards Section - Only show when no search has been triggered */}
      {!searchTriggered && (
        <section className="category-section">
          <h2>Find the right contractor for your project</h2>
          <div className="category-grid">
            <div className="category-card" onClick={() => handleCategoryClick("Plumbing")}>
              <div className="category-image plumber-bg"></div>
              <div className="category-content">
                <h3>Plumber</h3>
                <button className="category-btn">Find Plumbers</button>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryClick("Electrical")}>
              <div className="category-image electrician-bg"></div>
              <div className="category-content">
                <h3>Electrician</h3>
                <button className="category-btn">Find Electricians</button>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryClick("Flooring")}>
              <div className="category-image flooring-bg"></div>
              <div className="category-content">
                <h3>Flooring</h3>
                <button className="category-btn">Find Flooring Experts</button>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryClick("Concrete")}>
              <div className="category-image concrete-bg"></div>
              <div className="category-content">
                <h3>Concrete</h3>
                <button className="category-btn">Find Concrete Specialists</button>
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
                  className="contractor-photo" 
                />
                <h3>{contractor.companyName}</h3>
                <p>{contractor.specialties?.join(', ')}</p>
                <button onClick={() => navigate(`/contractor/${contractor.id}`)}>View Profile</button>
                <button className="request-bid-btn">
                  Request Bid
                </button>
                <div className="video-gallery">
                  {contractor.mediaFiles?.filter((file: any) => file.type === 'video').slice(0,2).map((video: any, idx: number) => (
                    <button key={idx} className="video-btn">▶ {video.name}</button>
                  ))}
                </div>
              </div>
            )) : <p>No contractors found for this trade.</p>}
          </div>
        </section>
      )}
      <section className="info-section">
        <button className="info-btn">Understanding Construction & the Bidding Process</button>
        <div className="promise-section">
          <h3>Why Homeowners Trust Global Home Solutions</h3>
          <ul>
            <li>Qualified contractors only</li>
            <li>Guaranteed 24-hour response</li>
            <li>Bids in less than 5 days</li>
            <li>Person-to-person service</li>
          </ul>
        </div>
      </section>
    </div>
  );
}