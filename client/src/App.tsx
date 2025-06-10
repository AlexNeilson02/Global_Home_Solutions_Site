import React from "react";
import { Router, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePageNew";
import ContractorProfile from "@/pages/ContractorProfileDB";
import ContractorPortal from "@/pages/ContractorPortal";
import SalesPortal from "@/pages/SalesPortal";
import AdminPortal from "@/pages/AdminPortal";
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
              <ContractorPortal />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-portal">
            <ProtectedRoute requiredRole="salesperson">
              <SalesPortal />
            </ProtectedRoute>
          </Route>
          <Route path="/admin-portal">
            <ProtectedRoute requiredRole="admin">
              <AdminPortal />
            </ProtectedRoute>
          </Route>
        </div>
      </TooltipProvider>
    </Router>
  );
}

export default App;
