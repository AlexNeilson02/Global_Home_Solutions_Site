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
    <div className="homepage-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <section className="search-section" style={{ 
        maxWidth: '1000px', 
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '40px',
          gap: '10px'
        }}>
          <div className="search-input-container" style={{ position: 'relative', width: '100%', minWidth: '600px' }}>
            <select
              className="service-dropdown"
              value={trade}
              onChange={e => setTrade(e.target.value)}
              style={{ 
                width: '100%',
                fontSize: '20px',
                padding: '18px 60px 18px 25px',
                borderRadius: '12px',
                border: '2px solid #ddd',
                backgroundColor: 'white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                fontWeight: '500',
                appearance: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Select a service...</option>
              {trades.map(tr => (
                <option key={tr} value={tr}>{tr}</option>
              ))}
            </select>
            {trade && (
              <button 
                className="clear-search-btn" 
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                  zIndex: 1
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button 
            className="find-contractor-btn" 
            onClick={handleFindContractor}
            style={{ 
              fontSize: '18px',
              padding: '15px 70px',
              backgroundColor: '#00aeef',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 6px 16px rgba(0,174,239,0.3)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              marginTop: '10px',
              minWidth: '300px',
              maxWidth: '450px'
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
      </section>

      {/* Featured Contractors Section - Only show when no search has been triggered */}
      {!searchTriggered && (
        <section className="category-section" style={{ 
          maxWidth: '800px', 
          width: '100%',
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <h2>Find the right contractor for your project</h2>
          <div className="category-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            justifyContent: 'center'
          }}>
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
                <h3>Continental Concrete</h3>
                <button className="category-btn">Find Continental Concrete</button>
              </div>
            </div>

            <div className="category-card" onClick={() => setLocation('/contractor/18')}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src="/attached_assets/Watermelon_WW_Logo_Square_1750971640089.png" 
                  alt="Watermelon Window Washing" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '20px'
                  }}
                />
              </div>
              <div className="category-content">
                <h3>Watermelon Window Washing</h3>
                <button className="category-btn">Find Watermelon Window Washing</button>
              </div>
            </div>

            <div className="category-card" onClick={() => setLocation('/contractor/20')}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src="/attached_assets/Vault_Logo_Square_1751036708596.png" 
                  alt="Vault Pest Control" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '20px'
                  }}
                />
              </div>
              <div className="category-content">
                <h3>Vault Pest Control</h3>
                <button className="category-btn">Find Vault Pest Control</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search Results Section */}
      {searchTriggered && (
        <section className="search-results" style={{ 
          maxWidth: '800px', 
          width: '100%',
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <div className="results-header" style={{ marginBottom: '30px' }}>
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
            <div className="contractor-list" style={{ 
              display: 'grid', 
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              justifyContent: 'center'
            }}>
              {filteredContractors.map((contractor: any) => (
                <div 
                  key={contractor.id} 
                  className="contractor-card"
                  onClick={() => setLocation(`/contractor/${contractor.id}`)}
                  style={{ margin: '0 auto' }}
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