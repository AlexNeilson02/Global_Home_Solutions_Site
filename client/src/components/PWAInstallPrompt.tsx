import React, { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Star } from 'lucide-react';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  onDismiss, 
  className = '' 
}) => {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await install();
      if (installed) {
        console.log('App installed successfully!');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if not installable, already installed, or dismissed
  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <Card className={`fixed bottom-4 left-4 right-4 z-50 shadow-lg border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">
                Install Global Home Solutions
              </h3>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                Get faster access and work offline. Install our app for the best experience.
              </p>
              
              <div className="flex items-center gap-4 mt-3">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isInstalling ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      Installing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Download className="h-3 w-3" />
                      Install
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Not now
                </Button>
              </div>
              
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-xs text-gray-500 ml-1">
                  Works great offline
                </span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version for headers/nav bars
export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
    >
      {isInstalling ? (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="h-3 w-3" />
      )}
      {isInstalling ? 'Installing...' : 'Install App'}
    </Button>
  );
};