import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PostBidPWAContextType {
  showPostBidPWA: boolean;
  triggerPostBidPWA: () => void;
  dismissPostBidPWA: () => void;
}

const PostBidPWAContext = createContext<PostBidPWAContextType | undefined>(undefined);

export const usePostBidPWA = () => {
  const context = useContext(PostBidPWAContext);
  if (context === undefined) {
    throw new Error('usePostBidPWA must be used within a PostBidPWAProvider');
  }
  return context;
};

interface PostBidPWAProviderProps {
  children: ReactNode;
}

export const PostBidPWAProvider: React.FC<PostBidPWAProviderProps> = ({ children }) => {
  const [showPostBidPWA, setShowPostBidPWA] = useState(false);

  const triggerPostBidPWA = () => {
    // Only show PWA prompt on web (not if already in PWA mode)
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    
    if (!isPWAMode) {
      console.log('🎯 Post-Bid PWA: Triggering PWA install prompt after successful bid submission');
      setShowPostBidPWA(true);
    } else {
      console.log('ℹ️ Post-Bid PWA: Already in PWA mode, no prompt needed');
    }
  };

  const dismissPostBidPWA = () => {
    console.log('🚫 Post-Bid PWA: User dismissed PWA prompt');
    setShowPostBidPWA(false);
  };

  return (
    <PostBidPWAContext.Provider value={{
      showPostBidPWA,
      triggerPostBidPWA,
      dismissPostBidPWA
    }}>
      {children}
    </PostBidPWAContext.Provider>
  );
};