import React from 'react';
import { usePlatform, Platform } from '@/contexts/PlatformContext';

interface PlatformSpecificProps {
  children: React.ReactNode;
  platform?: Platform | Platform[];
  fallback?: React.ReactNode;
}

// Show content only on specific platform(s)
export const ShowOn: React.FC<PlatformSpecificProps> = ({ 
  children, 
  platform, 
  fallback = null 
}) => {
  const { platform: currentPlatform } = usePlatform();
  
  if (!platform) return <>{children}</>;
  
  const platforms = Array.isArray(platform) ? platform : [platform];
  const shouldShow = platforms.includes(currentPlatform);
  
  return <>{shouldShow ? children : fallback}</>;
};

// Hide content on specific platform(s) 
export const HideOn: React.FC<PlatformSpecificProps> = ({ 
  children, 
  platform, 
  fallback = null 
}) => {
  const { platform: currentPlatform } = usePlatform();
  
  if (!platform) return <>{children}</>;
  
  const platforms = Array.isArray(platform) ? platform : [platform];
  const shouldHide = platforms.includes(currentPlatform);
  
  return <>{shouldHide ? fallback : children}</>;
};

// Convenient component aliases for your specific use case
export const DesktopOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <ShowOn platform="desktop" fallback={fallback}>{children}</ShowOn>
);

export const MobileWebOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <ShowOn platform="mobile-web" fallback={fallback}>{children}</ShowOn>
);

export const MobileAppOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <ShowOn platform="mobile-app" fallback={fallback}>{children}</ShowOn>
);

// Show on both mobile platforms but not desktop
export const MobileOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <ShowOn platform={['mobile-web', 'mobile-app']} fallback={fallback}>{children}</ShowOn>
);

// Platform-aware conditional rendering hook
export const usePlatformFeatures = () => {
  const { platform, isDesktop, isMobileWeb, isMobileApp } = usePlatform();
  
  return {
    platform,
    isDesktop,
    isMobileWeb,
    isMobileApp,
    // Helper functions for common feature checks
    showFeature: (platforms: Platform | Platform[]) => {
      const supportedPlatforms = Array.isArray(platforms) ? platforms : [platforms];
      return supportedPlatforms.includes(platform);
    },
    hideFeature: (platforms: Platform | Platform[]) => {
      const hiddenPlatforms = Array.isArray(platforms) ? platforms : [platforms];
      return !hiddenPlatforms.includes(platform);
    }
  };
};