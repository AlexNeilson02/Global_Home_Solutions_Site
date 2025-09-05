import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Star, ExternalLink, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ContractorsResponse {
  contractors: Array<{
    id: number;
    userId: number;
    companyName: string;
    specialties: string[];
    profileImage?: string;
    bannerImage?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    websiteUrl?: string;
    logoUrl?: string;
  }>;
}

const MobileContractors = () => {
  const [, setLocation] = useLocation();

  const { data: contractors } = useQuery<ContractorsResponse>({
    queryKey: ["/api/contractors"],
  });

  const goBack = () => {
    setLocation('/homeowner-dashboard');
  };

  const viewContractor = (contractorId: number) => {
    setLocation(`/contractor/${contractorId}?from=homeowner-contractors`);
  };

  const contractorsList = contractors?.contractors || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Our Contractors</h1>
            <p className="text-sm text-gray-500">Trusted professionals in your area</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-24">
        {contractorsList.length > 0 ? (
          contractorsList.map((contractor) => (
            <Card key={contractor.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Banner Image */}
                {contractor.bannerImage && (
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                    <img
                      src={contractor.bannerImage}
                      alt={`${contractor.companyName} banner`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  {/* Company Info */}
                  <div className="flex items-start gap-3 mb-3">
                    {contractor.logoUrl ? (
                      <img
                        src={contractor.logoUrl}
                        alt={contractor.companyName}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <span className="text-blue-600 font-bold text-lg">
                          {contractor.companyName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {contractor.companyName}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  {contractor.specialties && contractor.specialties.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {contractor.specialties.slice(0, 4).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {contractor.specialties.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{contractor.specialties.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {contractor.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {contractor.description}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    {contractor.contactPhone && (
                      <a 
                        href={`tel:${contractor.contactPhone}`}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{contractor.contactPhone}</span>
                      </a>
                    )}
                    {contractor.contactEmail && (
                      <a 
                        href={`mailto:${contractor.contactEmail}`}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => viewContractor(contractor.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      View Profile
                    </Button>
                    {contractor.websiteUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(contractor.websiteUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChevronLeft className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No contractors available
            </h3>
            <p className="text-gray-500">
              Please check back later for contractor listings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileContractors;