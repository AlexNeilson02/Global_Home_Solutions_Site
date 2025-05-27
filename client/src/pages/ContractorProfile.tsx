import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const ContractorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: contractorData, isLoading } = useQuery({
    queryKey: ['/api/contractors', id],
    enabled: !!id
  });

  const contractor = contractorData as any;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading contractor profile...</div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Contractor not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
            
            <div className="relative px-6 pb-6">
              <div className="flex items-center mb-6">
                <div className="w-24 h-24 bg-gray-300 rounded-full -mt-12 border-4 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {contractor.company?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="ml-6 pt-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {contractor.company || 'Contractor Profile'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {contractor.specialties || 'General Contractor'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    About
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {contractor.bio || 'Professional contractor dedicated to quality work and customer satisfaction.'}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Contact Information
                  </h2>
                  <div className="space-y-2">
                    {contractor.phone && (
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Phone:</span>
                        <span className="text-gray-900 dark:text-white">{contractor.phone}</span>
                      </div>
                    )}
                    {contractor.email && (
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Email:</span>
                        <span className="text-gray-900 dark:text-white">{contractor.email}</span>
                      </div>
                    )}
                    {contractor.location && (
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Location:</span>
                        <span className="text-gray-900 dark:text-white">{contractor.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {contractor.services && contractor.services.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Services
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {contractor.services.map((service: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorProfile;