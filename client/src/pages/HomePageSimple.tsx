import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePageSimple() {
  const [, navigate] = useLocation();
  const [trackedSalesperson, setTrackedSalesperson] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Track QR code visits for sales rep attribution
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    console.log('=== QR Tracking Debug ===');
    console.log('Current URL:', window.location.href); 
    console.log('URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Ref param:', refParam);
    console.log('Current trackedSalesperson:', trackedSalesperson);
    console.log('========================');
    
    if (refParam) {
      // Check sessionStorage for existing tracking
      const stored = sessionStorage.getItem('trackedSalesperson');
      if (stored && !trackedSalesperson) {
        try {
          const parsedSalesperson = JSON.parse(stored);
          if (parsedSalesperson && parsedSalesperson.id && parsedSalesperson.sessionTrackingId && parsedSalesperson.isVerified) {
            setTrackedSalesperson(parsedSalesperson);
            console.log('✓ Restored verified tracked salesperson from session:', parsedSalesperson);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse stored salesperson data:', error);
          sessionStorage.removeItem('trackedSalesperson');
        }
      }

      // Make API call to track visit
      if (!trackedSalesperson && !trackingLoading) {
        setTrackingLoading(true);
        
        const trackVisit = async () => {
          try {
            console.log('🔄 Starting salesperson tracking for ref:', refParam);
            console.log('📞 Making API call to track visit:', {
              url: '/api/track-visit',
              method: 'POST',
              body: { salespersonProfileUrl: refParam }
            });

            const response = await fetch('/api/track-visit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ salespersonProfileUrl: refParam })
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseData = await response.json();
            
            if (responseData.success && responseData.salesperson) {
              console.log('✅ Visit tracked successfully:', responseData);
              
              const trackingData = {
                ...responseData.salesperson,
                sessionTrackingId: responseData.sessionTrackingId,
                isVerified: responseData.isVerified
              };
              
              setTrackedSalesperson(trackingData);
              
              try {
                sessionStorage.setItem('trackedSalesperson', JSON.stringify(trackingData));
                console.log('💾 Stored verified tracking data:', trackingData);
              } catch (storageError) {
                console.warn('Failed to store in sessionStorage:', storageError);
              }
            } else {
              console.warn('⚠️ API returned unsuccessful response:', responseData);
            }
          } catch (error) {
            console.error('❌ Error tracking visit:', error);
          } finally {
            setTrackingLoading(false);
          }
        };
        
        trackVisit();
      }
    } else {
      // Clear any existing tracking when visiting without QR parameter
      console.log('🧹 Clearing previous sales attribution - direct visit without QR code');
      sessionStorage.removeItem('trackedSalesperson');
      setTrackedSalesperson(null);
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          color: '#333',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          Global Home Solutions
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          marginBottom: '30px',
          color: '#666',
          lineHeight: '1.6'
        }}>
          Find trusted contractors for your home improvement projects
        </p>

        {/* QR Tracking Status */}
        {trackedSalesperson && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '2px solid #4caf50',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#2e7d32', fontWeight: 'bold', margin: 0 }}>
              ✅ QR Code Scanned Successfully!
            </p>
            <p style={{ color: '#2e7d32', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
              Sales Rep: {trackedSalesperson.profileUrl} | Session: {trackedSalesperson.sessionTrackingId}
            </p>
          </div>
        )}

        <button 
          onClick={() => navigate('/services')}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '15px 30px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Find Contractors
        </button>

        <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#888' }}>
          <p>Testing QR Commission Tracking System</p>
          <p>Visit with ?ref=sales123 to test QR functionality</p>
        </div>
      </div>
    </div>
  );
}