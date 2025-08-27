import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Platform types - exactly what you requested
export type Platform = 'desktop' | 'mobile-web' | 'mobile-app';

interface PlatformContextType {
  platform: Platform;
  isDesktop: boolean;
  isMobileWeb: boolean;
  isMobileApp: boolean;
  isLoading: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};

interface PlatformProviderProps {
  children: ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const detectPlatform = () => {
      // Check if running as installed app (PWA standalone or native wrapper)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true ||
                           window.location.search.includes('source=pwa') ||
                           document.referrer.includes('android-app://') ||
                           (window as any).ReactNativeWebView !== undefined;

      if (!isMobile) {
        // Desktop - keep unchanged as requested
        setPlatform('desktop');
      } else if (isMobile && isStandalone) {
        // Mobile App - installed/native version
        setPlatform('mobile-app');
        console.log('📱 Platform: Mobile App (Native/Installed)');
      } else {
        // Mobile Web - browser on phone
        setPlatform('mobile-web');
        console.log('🌐 Platform: Mobile Web (Browser)');
      }
      
      setIsLoading(false);
    };

    // Initial detection
    detectPlatform();

    // Listen for display mode changes (when PWA gets installed/uninstalled)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => detectPlatform();
    
    mediaQuery.addListener(handleChange);
    window.addEventListener('resize', detectPlatform);

    return () => {
      mediaQuery.removeListener(handleChange);
      window.removeEventListener('resize', detectPlatform);
    };
  }, [isMobile]);

  // Derived boolean values for easy conditional rendering
  const isDesktop = platform === 'desktop';
  const isMobileWeb = platform === 'mobile-web';
  const isMobileApp = platform === 'mobile-app';

  return (
    <PlatformContext.Provider value={{
      platform,
      isDesktop,
      isMobileWeb, 
      isMobileApp,
      isLoading
    }}>
      {children}
    </PlatformContext.Provider>
  );
};