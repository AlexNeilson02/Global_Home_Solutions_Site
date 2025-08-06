import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import "../styles/HomePage.css";
// Using attached asset path directly

interface ServiceCategoriesResponse {
  services: Array<{
    id: number;
    name: string;
  }>;
}

interface ContractorsResponse {
  contractors: Array<{
    id: number;
    userId: number;
    companyName: string;
    specialties: string[];
    profileImage?: string;
    bannerImage?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    websiteUrl?: string;
  }>;
}

const ServiceSelection = () => {
  const [, setLocation] = useLocation();
  const [trade, setTrade] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);

  const { data: serviceCategories } = useQuery<ServiceCategoriesResponse>({
    queryKey: ["/api/service-categories"],
  });

  const { data: contractors } = useQuery<ContractorsResponse>({
    queryKey: ["/api/contractors"],
  });

  const trades = serviceCategories?.services.map(service => service.name).sort() || [];

  const handleFindContractor = () => {
    if (!trade) return;
    setSearchTriggered(true);
    setSelectedContractor(null);
  };

  const handleCategoryClick = (category: string) => {
    setTrade(category);
    setSearchTriggered(true);
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

            <div className="category-card" onClick={() => setLocation('/contractor/19')}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src="/attached_assets/Continental Concrete Logo — 6.24.2025 Proof Alpha_1751036821066.jpeg" 
                  alt="Continental Concrete" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '20px'
                  }}
                />
              </div>
              <div className="category-content">
                <h3>Concrete</h3>
                <button className="category-btn">Find Concrete Specialists</button>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryClick("Plumbing")}>
              <div className="category-image plumber-bg" style={{
                height: '150px'
              }}>
              </div>
              <div className="category-content">
                <h3>Plumbing</h3>
                <button className="category-btn">Find Plumbers</button>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryClick("Flooring & Hardwood")}>
              <div className="category-image flooring-bg" style={{
                height: '150px'
              }}>
              </div>
              <div className="category-content">
                <h3>Flooring</h3>
                <button className="category-btn">Find Flooring Experts</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search Results Section */}
      {searchTriggered && (
        <section className="search-results">
          <div className="results-header">
            <h2>Contractors for "{trade}"</h2>
            <button className="back-to-categories" onClick={clearSearch}>
              ← Back to Categories
            </button>
          </div>
          
          {filteredContractors.length === 0 ? (
            <div className="no-results">
              <p>No contractors found for "{trade}". Try a different service category.</p>
            </div>
          ) : (
            <div className="contractor-list">
              {filteredContractors.map((contractor: any) => (
                <div 
                  key={contractor.id} 
                  className="contractor-card"
                  onClick={() => setLocation(`/contractor/${contractor.id}`)}
                >
                  <div className="contractor-image">
                    {contractor.profileImage ? (
                      <img src={contractor.profileImage} alt={contractor.companyName} />
                    ) : (
                      <div className="contractor-placeholder">
                        {contractor.companyName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="contractor-details">
                    <h3>{contractor.companyName}</h3>
                    {contractor.description && <p>{contractor.description.substring(0, 100)}...</p>}
                    <div className="contractor-specialties">
                      {contractor.specialties?.slice(0, 3).map((specialty: string, index: number) => (
                        <span key={index} className="specialty-tag">{specialty}</span>
                      ))}
                    </div>
                  </div>
                  <button className="view-profile-btn">View Profile</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ServiceSelection;