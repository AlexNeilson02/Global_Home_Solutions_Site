import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceCategoriesResponse {
  services: Array<{
    id: number;
    name: string;
  }>;
}

const MobileAppServices = () => {
  const [, setLocation] = useLocation();

  const { data: serviceCategories } = useQuery<ServiceCategoriesResponse>({
    queryKey: ["/api/service-categories"],
  });

  const services = serviceCategories?.services || [];

  // Group services into categories (same logic as web version)
  const categorizeServices = (services: Array<{id: number; name: string}>) => {
    const categories: {[key: string]: Array<{id: number; name: string}>} = {
      'Interior & Remodeling': [],
      'Exterior & Roofing': [],
      'Systems & Utilities': [],
      'Maintenance & Cleaning': [],
      'Outdoor & Landscaping': [],
      'Specialty Services': []
    };

    services.forEach(service => {
      const name = service.name.toLowerCase();
      
      if (name.includes('kitchen') || name.includes('bathroom') || name.includes('flooring') || 
          name.includes('interior') || name.includes('paint') || name.includes('tile') || 
          name.includes('carpet') || name.includes('hardwood') || name.includes('countertop') || 
          name.includes('cabinet') || name.includes('drywall') || name.includes('sheet rock') || 
          name.includes('trim') || name.includes('fireplace') || name.includes('reglazing')) {
        categories['Interior & Remodeling'].push(service);
      } else if (name.includes('roof') || name.includes('siding') || name.includes('exterior') || 
                name.includes('window') || name.includes('door') || name.includes('gutter') || 
                name.includes('fence') || name.includes('deck') || name.includes('porch') || 
                name.includes('patio') || name.includes('concrete') || name.includes('foundation') || 
                name.includes('masonry') || name.includes('stone')) {
        categories['Exterior & Roofing'].push(service);
      } else if (name.includes('plumb') || name.includes('electric') || name.includes('hvac') || 
                name.includes('heating') || name.includes('cooling') || name.includes('insulation') || 
                name.includes('solar') || name.includes('generator') || name.includes('low voltage') || 
                name.includes('smart home') || name.includes('security') || name.includes('garage door') || 
                name.includes('water')) {
        categories['Systems & Utilities'].push(service);
      } else if (name.includes('clean') || name.includes('pest') || name.includes('maintenance') || 
                name.includes('restoration') || name.includes('garbage') || name.includes('haul') || 
                name.includes('window wash') || name.includes('inspection')) {
        categories['Maintenance & Cleaning'].push(service);
      } else if (name.includes('landscap') || name.includes('tree') || name.includes('turf') || 
                name.includes('pool') || name.includes('outdoor') || name.includes('patio cover') || 
                name.includes('excavat')) {
        categories['Outdoor & Landscaping'].push(service);
      } else {
        categories['Specialty Services'].push(service);
      }
    });

    return categories;
  };

  const categorizedServices = categorizeServices(services);

  const goBack = () => {
    setLocation('/'); // HOMEOWNER PORTAL REMOVED
  };

  const handleServiceSelect = (serviceName: string) => {
    // Navigate to bid request form with pre-selected service
    setLocation('/'); // HOMEOWNER ROUTES REMOVED
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Our Services</h1>
            <p className="text-sm text-gray-500">Professional home improvement services</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-24">
        {Object.entries(categorizedServices).map(([categoryName, categoryServices]) => {
          if (categoryServices.length === 0) return null;
          
          return (
            <div key={categoryName}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">
                {categoryName}
              </h2>
              <div className="space-y-3">
                {categoryServices.map((service) => (
                  <Card key={service.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Button
                        variant="ghost"
                        onClick={() => handleServiceSelect(service.name)}
                        className="w-full h-auto p-4 justify-start text-left hover:bg-blue-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {service.name}
                            </h3>
                          </div>
                          <ChevronLeft className="w-5 h-5 text-gray-400 transform rotate-180" />
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {services.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading Services...
            </h3>
            <p className="text-gray-500">
              Please wait while we load our available services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAppServices;