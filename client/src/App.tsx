import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/portals" element={<PortalAccess />} />
            <Route path="/contractor/:id" element={<ContractorProfile />} />
            <Route path="/contractor-registration" element={<ContractorRegistration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contractor-portal" element={<ContractorPortal />} />
            <Route path="/sales-portal" element={<SalesPortal />} />
            <Route path="/admin-portal" element={<AdminPortal />} />
            <Route path="/portal/contractor" element={<ContractorPortal />} />
            <Route path="/portal/sales" element={<SalesPortal />} />
            <Route path="/portal/admin" element={<AdminPortal />} />
          </Routes>
        </div>
      </TooltipProvider>
    </Router>
  );
}

export default App;
