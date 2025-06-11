import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export default function DashboardLogin() {
  const [, navigate] = useLocation();
  const [selectedDashboard, setSelectedDashboard] = useState("sales-dashboard");

  const goToDashboard = () => {
    navigate(`/${selectedDashboard}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md dialog-white-bg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Dashboard Direct Access
          </CardTitle>
          <CardDescription className="text-center">
            Select a dashboard to view directly (testing purposes)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Dashboard</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedDashboard}
              onChange={(e) => setSelectedDashboard(e.target.value)}
            >
              <option value="sales-dashboard">Sales Dashboard</option>
              <option value="contractor-dashboard">Contractor Dashboard</option>
              <option value="admin-dashboard">Admin Dashboard</option>
            </select>
          </div>
          
          <Button 
            onClick={goToDashboard}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">This is a test page for direct dashboard access</p>
        </CardFooter>
      </Card>
    </div>
  );
}