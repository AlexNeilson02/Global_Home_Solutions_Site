import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useSalesperson } from '@/contexts/SalespersonContext';
import { apiRequest } from '@/lib/queryClient';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const { user } = useAuth();
  const { salespersonId } = useSalesperson();
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Memoize the attribution upgrade function to prevent unnecessary re-renders
  const upgradeAttributionAfterInstall = useCallback(async () => {
    try {
      // Check if we have the necessary data for attribution upgrade
      if (!user?.email || !salespersonId) {
        console.log('⚠️ PWA Attribution: Missing required data for upgrade', {
          hasUser: !!user,
          hasEmail: !!user?.email,
          hasSalespersonId: !!salespersonId
        });
        return;
      }

      console.log('🔄 PWA Attribution: Upgrading to permanent attribution', {
        customerEmail: user.email,
        salespersonId
      });

      // Call the secure attribution upgrade endpoint - apiRequest returns parsed JSON directly
      const result = await apiRequest('POST', '/api/customer-attribution/upgrade', {
        customerEmail: user.email,
        salespersonId
      });
      console.log('✅ PWA Attribution: Successfully upgraded to permanent attribution', result);
    } catch (error) {
      console.error('❌ PWA Attribution: Error during upgrade', error);
    }
  }, [user?.email, salespersonId]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = async () => {
      console.log('🎉 PWA installed successfully!');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);

      // Trigger attribution upgrade if user is authenticated and we have a salesperson
      await upgradeAttributionAfterInstall();
    };


    // Check if app is already installed
    const checkIfInstalled = async () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        console.log('🔍 PWA: App already installed, checking for attribution upgrade needed');
        setIsInstalled(true);
        setIsInstallable(false);
        
        // If app is already installed and we have user + salesperson data, upgrade attribution
        if (user?.email && salespersonId) {
          console.log('🚀 PWA: App already installed, triggering attribution upgrade');
          await upgradeAttributionAfterInstall();
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [upgradeAttributionAfterInstall]);

  const install = async () => {
    if (!installPrompt) return false;

    try {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
    
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    install
  };
}