import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePlatform } from '@/contexts/PlatformContext';
import { useAuth } from '@/lib/auth';

interface MobileAppAuthWrapperProps {
  children: React.ReactNode;
}

export const MobileAppAuthWrapper: React.FC<MobileAppAuthWrapperProps> = ({ children }) => {
  const { isMobileApp, isLoading: platformLoading } = usePlatform();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Wait for both platform and auth to finish loading
    if (platformLoading || authLoading) {
      return;
    }

    // Only enforce authentication for mobile app users
    if (isMobileApp && !user) {
      console.log('📱 Mobile app user not authenticated - redirecting to login');
      navigate('/login');
      return;
    }
  }, [isMobileApp, user, platformLoading, authLoading, navigate]);

  // Show loading while determining platform and auth status
  if (platformLoading || (isMobileApp && authLoading)) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If mobile app user is not authenticated, don't render children
  // (they will be redirected to login in the useEffect above)
  if (isMobileApp && !user) {
    return null;
  }

  // For mobile-web and desktop users, or authenticated mobile-app users, show content
  return <>{children}</>;
};