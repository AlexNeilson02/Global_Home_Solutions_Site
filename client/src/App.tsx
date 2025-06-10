import React from "react";
import { Router, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePageNew";
import ContractorProfile from "@/pages/ContractorProfileDB";
import ContractorPortalEnhanced from "@/pages/ContractorPortalEnhanced";
import SalesPortalEnhanced from "@/pages/SalesPortalEnhanced";
import AdminPortalEnhanced from "@/pages/AdminPortalEnhanced";
import PortalAccess from "@/pages/PortalAccess";
import ContractorRegistration from "@/pages/ContractorRegistration";
import Login from "@/pages/Login";

function App() {
  return (
    <Router>
      <TooltipProvider>
        <div className="min-h-screen">
          <Toaster />
          <Route path="/" component={HomePage} />
          <Route path="/portals" component={PortalAccess} />
          <Route path="/contractor/:id" component={ContractorProfile} />
          <Route path="/contractor-registration" component={ContractorRegistration} />
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
        </div>
      </TooltipProvider>
    </Router>
  );
}

export default App;
