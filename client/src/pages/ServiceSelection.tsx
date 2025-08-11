import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import { useSalesperson } from "@/contexts/SalespersonContext";
import "../styles/HomePage.css";
import watermelonLogo from "@assets/Watermelon_WW_Logo_Square_1750971640089.png";
import vaultLogo from "@assets/Vault_Logo_Square_1751036708596.png";
import continentalLogo from "@assets/Continental Concrete Logo — 6.24.2025 Proof Alpha_1751036821066.jpeg";

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
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const { salespersonId } = useSalesperson();
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

  const handleFindContractor = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
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
      padding: '100px 20px 0px 20px'
    }}>
      <section className="search-section" style={{ 
        maxWidth: '1000px', 
        width: '100%',
        textAlign: 'center'
      }}>
        <form 
          onSubmit={handleFindContractor}
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            marginTop: '80px',
            marginBottom: '20px',
            gap: '5px'
          }}
        >
          <div className="search-input-container" style={{ position: 'relative', width: '100%', maxWidth: '600px', minWidth: '280px', margin: '0 auto' }}>
            <select
              className="service-dropdown"
              value={trade}
              onChange={e => setTrade(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFindContractor();
                }
              }}
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
                type="button"
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
            type="submit"
            className="find-contractor-btn" 
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
        </form>
      </section>
      {/* Featured Contractors Section - Only show when no search has been triggered */}
      {!searchTriggered && (
        <section className="category-section" style={{ 
          maxWidth: '800px', 
          width: '100%',
          textAlign: 'center',
          marginTop: '15px'
        }}>
          <h2>Find the right contractor for your project</h2>
          <div className="category-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            justifyContent: 'center'
          }}>
            <div className="category-card" onClick={() => handleCategoryClick("Electrical")} style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <div className="category-image electrician-bg" style={{
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '150px',
                flexShrink: 0
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
              <div className="category-content" style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                padding: '20px'
              }}>
                <h3 style={{ 
                  color: '#333',
                  fontSize: '1.3rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>Electrical</h3>
                <button className="category-btn" style={{
                  background: '#2ca7f8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem',
                  marginTop: 'auto'
                }}>Find Contractors</button>
              </div>
            </div>

            <div className="category-card" onClick={() => navigateWithSalesperson('/contractor/19')} style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                padding: '10px',
                flexShrink: 0
              }}>
                <img 
                  src={continentalLogo} 
                  alt="Continental Concrete" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div className="category-content" style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                padding: '20px'
              }}>
                <h3 style={{ 
                  color: '#333',
                  fontSize: '1.3rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>Continental Concrete</h3>
                <button className="category-btn" style={{
                  background: '#2ca7f8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem',
                  marginTop: 'auto'
                }}>Find Contractors</button>
              </div>
            </div>

            <div className="category-card" onClick={() => navigateWithSalesperson('/contractor/18')} style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                padding: '10px',
                flexShrink: 0
              }}>
                <img 
                  src={watermelonLogo} 
                  alt="Watermelon Window Washing" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div className="category-content" style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                padding: '20px'
              }}>
                <h3 style={{ 
                  color: '#333',
                  fontSize: '1.3rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>Watermelon Window Washing</h3>
                <button className="category-btn" style={{
                  background: '#2ca7f8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem',
                  marginTop: 'auto'
                }}>Find Contractors</button>
              </div>
            </div>

            <div className="category-card" onClick={() => navigateWithSalesperson('/contractor/20')} style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <div className="category-image" style={{
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                padding: '10px',
                flexShrink: 0
              }}>
                <img 
                  src={vaultLogo} 
                  alt="Vault Pest Control" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div className="category-content" style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                padding: '20px'
              }}>
                <h3 style={{ 
                  color: '#333',
                  fontSize: '1.3rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>Vault Pest Control</h3>
                <button className="category-btn" style={{
                  background: '#2ca7f8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem',
                  marginTop: 'auto'
                }}>Find Contractors</button>
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
                  style={{ 
                    margin: '0 auto',
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    minHeight: '320px',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                >
                  {/* Logo at the top */}
                  <div style={{ 
                    width: '140px', 
                    height: '140px', 
                    marginBottom: '16px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {contractor.logoUrl ? (
                      <img 
                        src={contractor.logoUrl} 
                        alt={contractor.companyName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#6b7280'
                      }}>
                        {contractor.companyName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Company Name */}
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '0 0 12px 0',
                    lineHeight: '1.4'
                  }}>
                    {contractor.companyName}
                  </h3>

                  {/* View Profile Link */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateWithSalesperson(`/contractor/${contractor.id}`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginBottom: 'auto',
                      padding: '4px 0'
                    }}
                  >
                    View Profile
                  </button>

                  {/* Request Bid Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateWithSalesperson(`/contractor/${contractor.id}`);
                    }}
                    style={{
                      backgroundColor: '#00aeef',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'all 0.2s ease',
                      marginTop: '16px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#0088cc';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#00aeef';
                    }}
                  >
                    Request Bid
                  </button>
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