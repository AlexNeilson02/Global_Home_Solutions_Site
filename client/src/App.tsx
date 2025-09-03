import React from "react";
import { Router, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileAppAuthWrapper } from "@/components/MobileAppAuthWrapper";
import { SalespersonProvider } from "@/contexts/SalespersonContext";
import { PlatformProvider } from "@/contexts/PlatformContext";
import { AuthProvider } from "@/lib/auth";
import { MobileViewportFix } from "@/components/mobile/MobileViewportFix";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import HomePage from "@/pages/HomePageNew";
import ContractorProfile from "@/pages/ContractorProfileDB";
import ContractorPortalEnhanced from "@/pages/ContractorPortalEnhanced";
import SalesPortalEnhanced from "@/pages/SalesPortalEnhanced";
import AdminPortalEnhanced from "@/pages/AdminPortalEnhanced";
import HomeownerPortal from "@/pages/HomeownerPortal";

import ContractorRegistration from "@/pages/ContractorRegistration";
import MobileContractors from "@/pages/MobileContractors";
import MobileAppServices from "@/pages/MobileAppServices";
import SalespersonProfile from "@/pages/SalespersonProfile";
import Login from "@/pages/Login";
import Portals from "@/pages/Portals";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import ServiceSelection from "@/pages/ServiceSelection";
import MobileServices from "@/pages/MobileServices";
import AboutUs from "@/pages/AboutUs";

function App() {
  return (
    <Router>
      <PlatformProvider>
        <AuthProvider>
          <SalespersonProvider>
            <TooltipProvider>
              <MobileViewportFix />
              <MobileAppAuthWrapper>
                <div className="min-h-screen full-height smooth-scroll" style={{ marginTop: 0, paddingTop: 0, position: 'relative', top: 0, backgroundColor: 'red' }}>
                  <Toaster />
                  <PWAInstallPrompt />
              <Route path="/" component={HomePage} />
              <Route path="/about" component={AboutUs} />
              <Route path="/services" component={ServiceSelection} />
              <Route path="/mobile-services" component={MobileServices} />
              <Route path="/portals" component={Portals} />
              <Route path="/contractor/:id" component={ContractorProfile} />
              <Route path="/contractor-registration" component={ContractorRegistration} />
              <Route path="/sales/:profileUrl" component={SalespersonProfile} />
              <Route path="/login" component={Login} />
              <Route path="/contractor-portal">
                <ProtectedRoute requiredRole="contractor">
                  <ContractorPortalEnhanced />
                </ProtectedRoute>
              </Route>
              <Route path="/sales-portal">
                <ProtectedRoute requiredRole="salesperson">
                  <SalesPortalEnhanced />
                </ProtectedRoute>
              </Route>
              <Route path="/admin-portal">
                <ProtectedRoute requiredRole="admin">
                  <AdminPortalEnhanced />
                </ProtectedRoute>
              </Route>
              <Route path="/homeowner-portal">
                <ProtectedRoute requiredRole="homeowner">
                  <HomeownerPortal />
                </ProtectedRoute>
              </Route>
              <Route path="/checkout">
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              </Route>
              <Route path="/subscribe">
                <ProtectedRoute>
                  <Subscribe />
                </ProtectedRoute>
              </Route>
                </div>
              </MobileAppAuthWrapper>
            </TooltipProvider>
          </SalespersonProvider>
        </AuthProvider>
      </PlatformProvider>
    </Router>
  );
}

export default App;
