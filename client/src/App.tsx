import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/HomePage";
import ContractorProfile from "@/pages/ContractorProfile";
import ContractorPortal from "@/pages/ContractorPortal";
import SalesPortal from "@/pages/SalesPortal";
import AdminPortal from "@/pages/AdminPortal";

function App() {
  return (
    <Router>
      <TooltipProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contractor/:id" element={<ContractorProfile />} />
          <Route path="/portal/contractor" element={<ContractorPortal />} />
          <Route path="/portal/sales" element={<SalesPortal />} />
          <Route path="/portal/admin" element={<AdminPortal />} />
        </Routes>
      </TooltipProvider>
    </Router>
  );
}

export default App;
