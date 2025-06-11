import React from "react";
import { Router, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePageNew";
import ContractorProfile from "@/pages/ContractorProfileDB";
import ContractorPortalSimple from "@/pages/ContractorPortalSimple";
import SalesPortalSimple from "@/pages/SalesPortalSimple";
import AdminPortalSimple from "@/pages/AdminPortalSimple";
import PortalAccess from "@/pages/PortalAccess";
import ContractorRegistration from "@/pages/ContractorRegistration";
import SalespersonProfile from "@/pages/SalespersonProfile";
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
          <Route path="/sales/:profileUrl" component={SalespersonProfile} />
          <Route path="/login" component={Login} />
          <Route path="/contractor-portal">
            <ProtectedRoute requiredRole="contractor">
              <ContractorPortalSimple />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-portal">
            <ProtectedRoute requiredRole="salesperson">
              <SalesPortalSimple />
            </ProtectedRoute>
          </Route>
          <Route path="/admin-portal">
            <ProtectedRoute requiredRole="admin">
              <AdminPortalSimple />
            </ProtectedRoute>
          </Route>
        </div>
      </TooltipProvider>
    </Router>
  );
}

export default App;
