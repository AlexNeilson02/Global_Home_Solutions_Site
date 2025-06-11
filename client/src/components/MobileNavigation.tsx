import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Home, 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  User,
  FileText,
  Target,
  Calendar,
  Bell,
  LogOut
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface MobileNavigationProps {
  userRole: 'admin' | 'contractor' | 'salesperson';
  userName: string;
  userId: number;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  userRole, 
  userName, 
  userId, 
  onLogout,
  activeTab,
  onTabChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();

  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'contractors', label: 'Contractors', icon: Building2 },
          { id: 'salespersons', label: 'Sales Reps', icon: Target },
          { id: 'bids', label: 'Bid Requests', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      
      case 'contractor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'profile', label: 'Company Profile', icon: Building2 },
          { id: 'projects', label: 'Projects', icon: Calendar },
          { id: 'bids', label: 'Bid Requests', icon: FileText },
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'tracking', label: 'Project Tracking', icon: Target },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      
      case 'salesperson':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'qr', label: 'QR Code', icon: Target },
          { id: 'leads', label: 'My Leads', icon: Users },
          { id: 'analytics', label: 'Performance', icon: BarChart3 }
        ];
      
      default:
        return [];
    }
  };

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          
          <div>
            <h1 className="font-semibold text-lg">Global Home Solutions</h1>
            <p className="text-xs text-gray-500 capitalize">{userRole} Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter userId={userId} userRole={userRole} />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="p-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Slide-out Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 />
                </div>
                <div>
                  <p className="font-medium">{userName}</p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {userRole}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 ${
                        isActive 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'hover:bg-gray-100
                      }`}
                      onClick={() => handleTabClick(item.id)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Navigation Bar (Alternative Design) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`h-full rounded-none flex flex-col gap-1 ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50 
                    : 'text-gray-600
                }`}
                onClick={() => handleTabClick(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content Padding for Mobile Bottom Nav */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default MobileNavigation;