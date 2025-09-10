import React, { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { usePostBidPWA } from '@/contexts/PostBidPWAContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, CheckCircle } from 'lucide-react';

export const PostBidPWAPrompt: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWA();
  const { showPostBidPWA, dismissPostBidPWA } = usePostBidPWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await install();
      if (installed) {
        console.log('🎉 Post-Bid PWA: App installed successfully after bid submission!');
        dismissPostBidPWA();
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    dismissPostBidPWA();
  };

  // Only show if PWA prompt is triggered, app is installable, not already installed
  const shouldShow = showPostBidPWA && isInstallable && !isInstalled;

  if (!shouldShow) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-green-900 text-sm">
                Thanks for your bid request!
              </h3>
              <p className="text-green-700 text-xs mt-1 leading-relaxed">
                Install our app to track your project status, communicate with contractors, and get faster updates.
              </p>
              
              <div className="flex items-center gap-4 mt-3">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-install-post-bid-pwa"
                >
                  {isInstalling ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      Installing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Download className="h-3 w-3" />
                      Install App
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-800"
                  data-testid="button-dismiss-post-bid-pwa"
                >
                  Maybe later
                </Button>
              </div>
              
              <div className="flex items-center gap-1 mt-2">
                <Smartphone className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  Track your project progress
                </span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0 text-green-400 hover:text-green-600"
            data-testid="button-close-post-bid-pwa"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};