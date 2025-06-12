import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Settings } from "lucide-react";

const Portals: React.FC = () => {
  const [, navigate] = useLocation();

  const handlePortalAccess = (portalType: string) => {
    switch (portalType) {
      case "admin":
        navigate("/admin-portal");
        break;
      case "contractor":
        navigate("/contractor-portal");
        break;
      case "salesperson":
        navigate("/sales-portal");
        break;
      default:
        navigate("/");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Portal Access
            </h1>
            <p className="text-xl text-slate-300">
              Select your portal to access your dedicated workspace
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Admin Portal */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Admin Portal</CardTitle>
                <CardDescription className="text-slate-300">
                  Manage users, contractors, and system analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={() => handlePortalAccess("admin")}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Access Admin Portal
                </Button>
              </CardContent>
            </Card>

            {/* Contractor Portal */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Contractor Portal</CardTitle>
                <CardDescription className="text-slate-300">
                  Manage projects, bids, and customer requests
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={() => handlePortalAccess("contractor")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Access Contractor Portal
                </Button>
              </CardContent>
            </Card>

            {/* Sales Portal */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Sales Portal</CardTitle>
                <CardDescription className="text-slate-300">
                  Track leads, performance, and generate QR codes
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={() => handlePortalAccess("salesperson")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Access Sales Portal
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-slate-200"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portals;