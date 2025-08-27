import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import { useSalesperson } from "@/contexts/SalespersonContext";
import { ChevronLeft } from "lucide-react";
import HomeownerBottomNav from "@/components/mobile/HomeownerBottomNav";
import { TouchOptimizedButton } from "@/components/mobile/TouchOptimizations";
import globalLogoPath from "@assets/GLOBAL HOME SOLUTIONS LOGO-01.png";
import "../styles/HomePage.css";


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
    logoUrl?: string;
  }>;
}

const ServiceSelection = () => {
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const { salespersonId } = useSalesperson();
  const [trade, setTrade] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Check for pre-selected service from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
      setTrade(serviceParam);
      setSearchTriggered(true);
    }
  }, []);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: serviceCategories } = useQuery<ServiceCategoriesResponse>({
    queryKey: ["/api/service-categories"],
  });

  const { data: contractors } = useQuery<ContractorsResponse>({
    queryKey: ["/api/contractors"],
  });

  // Get specific contractors for featured cards
  const continentalContractor = contractors?.contractors.find(c => c.id === 19);
  const watermelonContractor = contractors?.contractors.find(c => c.id === 18);
  const vaultContractor = contractors?.contractors.find(c => c.id === 20);
  const c16Contractor = contractors?.contractors.find(c => c.id === 22);

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
      {/* Header with Logo and Company Name as Back Button */}
      <button
        onClick={() => navigateWithSalesperson('/')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease',
          zIndex: 1000
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#e5e7eb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
      >
        {isMobile ? (
          /* Mobile: Show only arrow */
          <ChevronLeft size={24} color="#111827" />
        ) : (
          /* Desktop: Show logo and company name */
          <>
            <img 
              src={globalLogoPath} 
              alt="Global Home Solutions" 
              style={{
                height: '40px',
                width: 'auto',
                marginRight: '12px'
              }}
            />
            <span style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Global Home Solutions
            </span>
          </>
        )}
      </button>
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
          <div className={`category-grid ${isMobile ? 'mobile-grid-2-cols' : ''}`} style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: isMobile ? '15px' : '20px',
            justifyContent: 'center'
          }}>
            {vaultContractor && (
              <div className="category-card" onClick={() => navigateWithSalesperson('/contractor/20')} style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div className="category-image" style={{
                  height: isMobile ? '120px' : '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  flexShrink: 0
                }}>
                  {vaultContractor.logoUrl ? (
                    <img 
                      src={vaultContractor.logoUrl} 
                      alt={vaultContractor.companyName} 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        minWidth: '80%', // Ensure rectangular logos are large enough
                        minHeight: '40px' // Minimum height for visibility
                      }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        // If it's a wide/rectangular logo (aspect ratio > 1.5), make it bigger
                        if (aspectRatio > 1.5) {
                          img.style.minWidth = '95%';
                          img.style.minHeight = '60px';
                        }
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
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: '#6b7280'
                    }}>
                      {vaultContractor.companyName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="category-content" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  padding: isMobile ? '15px' : '20px'
                }}>
                  <h3 style={{ 
                    color: '#333',
                    fontSize: isMobile ? '1.1rem' : '1.3rem',
                    margin: '0 0 15px 0',
                    fontWeight: '600',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%'
                  }}>{vaultContractor.companyName}</h3>
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
            )}

            {continentalContractor && (
              <div className="category-card" onClick={() => navigateWithSalesperson('/contractor/19')} style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div className="category-image" style={{
                  height: isMobile ? '120px' : '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  flexShrink: 0
                }}>
                  {continentalContractor.logoUrl ? (
                    <img 
                      src={continentalContractor.logoUrl} 
                      alt={continentalContractor.companyName} 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        minWidth: '80%', // Ensure rectangular logos are large enough
                        minHeight: '40px' // Minimum height for visibility
                      }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        // If it's a wide/rectangular logo (aspect ratio > 1.5), make it bigger
                        if (aspectRatio > 1.5) {
                          img.style.minWidth = '95%';
                          img.style.minHeight = '60px';
                        }
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
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: '#6b7280'
                    }}>
                      {continentalContractor.companyName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="category-content" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  padding: isMobile ? '15px' : '20px'
                }}>
                  <h3 style={{ 
                    color: '#333',
                    fontSize: isMobile ? '1.1rem' : '1.3rem',
                    margin: '0 0 15px 0',
                    fontWeight: '600',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%'
                  }}>{continentalContractor.companyName}</h3>
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
            )}

            {watermelonContractor && (
              <div className="category-card" onClick={() => navigateWithSalesperson('/contractor/18')} style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
                <div className="category-image" style={{
                  height: isMobile ? '120px' : '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  flexShrink: 0
                }}>
                  {watermelonContractor.logoUrl ? (
                    <img 
                      src={watermelonContractor.logoUrl} 
                      alt={watermelonContractor.companyName} 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        minWidth: '80%', // Ensure rectangular logos are large enough
                        minHeight: '40px' // Minimum height for visibility
                      }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        // If it's a wide/rectangular logo (aspect ratio > 1.5), make it bigger
                        if (aspectRatio > 1.5) {
                          img.style.minWidth = '95%';
                          img.style.minHeight = '60px';
                        }
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
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: '#6b7280'
                    }}>
                      {watermelonContractor.companyName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="category-content" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  padding: isMobile ? '15px' : '20px'
                }}>
                  <h3 style={{ 
                    color: '#333',
                    fontSize: isMobile ? '1.1rem' : '1.3rem',
                    margin: '0 0 15px 0',
                    fontWeight: '600',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%'
                  }}>{watermelonContractor.companyName}</h3>
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
            )}

            {c16Contractor && (
              <div className="category-card" onClick={() => navigateWithSalesperson('/contractor/22')} style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div className="category-image" style={{
                  height: isMobile ? '120px' : '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  flexShrink: 0
                }}>
                  {c16Contractor.logoUrl ? (
                    <img 
                      src={c16Contractor.logoUrl} 
                      alt={c16Contractor.companyName} 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        minWidth: '80%', // Ensure rectangular logos are large enough
                        minHeight: '40px' // Minimum height for visibility
                      }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        // If it's a wide/rectangular logo (aspect ratio > 1.5), make it bigger
                        if (aspectRatio > 1.5) {
                          img.style.minWidth = '95%';
                          img.style.minHeight = '60px';
                        }
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
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: '#6b7280'
                    }}>
                      {c16Contractor.companyName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="category-content" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  padding: isMobile ? '15px' : '20px'
                }}>
                  <h3 style={{ 
                    color: '#333',
                    fontSize: isMobile ? '1.1rem' : '1.3rem',
                    margin: '0 0 15px 0',
                    fontWeight: '600',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%'
                  }}>{c16Contractor.companyName}</h3>
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
            )}
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
                  className={`contractor-card ${isMobile ? 'touch-target' : ''}`}
                  style={{ 
                    margin: '0 auto',
                    background: 'white',
                    borderRadius: '16px',
                    padding: isMobile ? '16px' : '24px',
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
                          objectFit: 'contain',
                          minWidth: '80%', // Ensure rectangular logos are large enough
                          minHeight: '40px' // Minimum height for visibility
                        }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          const aspectRatio = img.naturalWidth / img.naturalHeight;
                          // If it's a wide/rectangular logo (aspect ratio > 1.5), make it bigger
                          if (aspectRatio > 1.5) {
                            img.style.minWidth = '95%';
                            img.style.minHeight = '60px';
                          }
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
                    lineHeight: '1.4',
                    textAlign: 'center',
                    width: '100%'
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <HomeownerBottomNav 
          activeTab={'contractors'}
          onTabChange={(tab) => {
            if (tab === 'contractors') {
              // Stay on current page (/services)
            } else if (tab === 'services') {
              navigateWithSalesperson('/mobile-services');
            } else if (tab === 'profile') {
              navigateWithSalesperson('/login');
            }
          }}
        />
      )}
    </div>
  );
};

export default ServiceSelection;