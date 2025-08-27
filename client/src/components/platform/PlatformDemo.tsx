import React from 'react';
import { usePlatform } from '@/contexts/PlatformContext';
import { DesktopOnly, MobileWebOnly, MobileAppOnly, ShowOn, HideOn } from './PlatformComponents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Download, Globe, Zap, Settings, Home, Share } from 'lucide-react';

export const PlatformDemo: React.FC = () => {
  const { platform, isDesktop, isMobileWeb, isMobileApp } = usePlatform();

  const getPlatformIcon = () => {
    switch (platform) {
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'mobile-web': return <Globe className="w-5 h-5" />;
      case 'mobile-app': return <Smartphone className="w-5 h-5" />;
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case 'desktop': return 'bg-blue-100 text-blue-800';
      case 'mobile-web': return 'bg-green-100 text-green-800';  
      case 'mobile-app': return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPlatformIcon()}
            Platform Detection Demo
          </CardTitle>
          <CardDescription>
            Current platform detected as: <Badge className={getPlatformColor()}>{platform}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="font-medium">Desktop</p>
              <p className="text-sm text-muted-foreground">{isDesktop ? '✅ Active' : '❌ Inactive'}</p>
            </div>
            <div className="text-center">
              <p className="font-medium">Mobile Web</p>
              <p className="text-sm text-muted-foreground">{isMobileWeb ? '✅ Active' : '❌ Inactive'}</p>
            </div>
            <div className="text-center">
              <p className="font-medium">Mobile App</p>
              <p className="text-sm text-muted-foreground">{isMobileApp ? '✅ Active' : '❌ Inactive'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop-only features */}
      <DesktopOnly>
        <Card className="mb-6 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Desktop Features
            </CardTitle>
            <CardDescription>These features only appear on desktop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Advanced Settings
              </Button>
              <Button variant="outline" className="justify-start">
                <Zap className="mr-2 h-4 w-4" />
                Power User Tools
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Full keyboard shortcuts, detailed analytics, and advanced configuration options.
            </p>
          </CardContent>
        </Card>
      </DesktopOnly>

      {/* Mobile Web only features */}
      <MobileWebOnly>
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Mobile Web Features
            </CardTitle>
            <CardDescription>These features only appear when browsing on mobile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                Install App for Better Experience
              </Button>
              <Button variant="outline" className="w-full">
                <Share className="mr-2 h-4 w-4" />
                Share via Browser
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Install prompts, browser-specific features, and simplified mobile experience.
            </p>
          </CardContent>
        </Card>
      </MobileWebOnly>

      {/* Mobile App only features */}
      <MobileAppOnly>
        <Card className="mb-6 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-700 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Native App Features
            </CardTitle>
            <CardDescription>These features only appear in the installed/native app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Home className="mr-2 h-4 w-4" />
                Add to Home Screen
              </Button>
              <Button variant="outline" className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Offline Mode Available
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Native notifications, offline functionality, and device integration features.
            </p>
          </CardContent>
        </Card>
      </MobileAppOnly>

      {/* Conditional features using ShowOn/HideOn */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conditional Feature Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ShowOn platform={['mobile-web', 'mobile-app']}>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="font-medium text-orange-800">Mobile-Only Feature</p>
              <p className="text-sm text-orange-600">This appears on both mobile web and mobile app</p>
            </div>
          </ShowOn>

          <HideOn platform="desktop">
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <p className="font-medium text-cyan-800">Hidden on Desktop</p>
              <p className="text-sm text-cyan-600">Desktop users won't see this feature</p>
            </div>
          </HideOn>

          <ShowOn platform="desktop" fallback={
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-800">Mobile Fallback</p>
              <p className="text-sm text-red-600">This fallback appears when not on desktop</p>
            </div>
          }>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800">Desktop-Only with Fallback</p>
              <p className="text-sm text-blue-600">Desktop users see this, mobile users see the fallback</p>
            </div>
          </ShowOn>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformDemo;