import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePlatform } from "@/contexts/PlatformContext";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import HomeownerBottomNav from "@/components/mobile/HomeownerBottomNav";
import { 
  ArrowLeft, 
  Home, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  Phone,
  Mail,
  User,
  CheckCircle,
  X,
  Plus
} from "lucide-react";

const bidRequestSchema = z.object({
  servicesRequested: z.array(z.string()).min(1, "Please select at least one service"),
  description: z.string().min(10, "Please provide at least 10 characters describing your project"),
  timeline: z.string().min(1, "Please specify your preferred timeline"),
  budget: z.string().optional(),
  address: z.string().min(5, "Please provide your complete address"),
  preferredContactMethod: z.enum(["phone", "email"], {
    required_error: "Please select your preferred contact method"
  }),
  additionalInformation: z.string().optional(),
});

type BidRequestForm = z.infer<typeof bidRequestSchema>;

interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
}

interface Contractor {
  id: number;
  companyName: string;
  specialties: string[];
  serviceCategoryIds: number[];
  logoUrl?: string;
}

export default function MobileHomeownerBidRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobileApp } = usePlatform();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedContractors, setSelectedContractors] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("requests");
  
  const form = useForm<BidRequestForm>({
    resolver: zodResolver(bidRequestSchema),
    defaultValues: {
      servicesRequested: [],
      description: "",
      timeline: "",
      budget: "",
      address: "",
      preferredContactMethod: "phone",
      additionalInformation: "",
    },
  });

  // Check for pre-selected service from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
      setSelectedServices([serviceParam]);
      form.setValue('servicesRequested', [serviceParam]);
      // Auto-advance to step 2 if service is pre-selected
      setStep(2);
    }
  }, [form]);

  // Fetch service categories
  const { data: serviceCategories } = useQuery<{ services: ServiceCategory[] }>({
    queryKey: ['/api/service-categories'],
  });

  // Fetch contractors
  const { data: contractors } = useQuery<{ contractors: Contractor[] }>({
    queryKey: ['/api/contractors'],
  });

  // Submit bid request mutation
  const submitBidRequest = useMutation({
    mutationFn: async (data: BidRequestForm & { contractorId: number }) => {
      return apiRequest('POST', '/api/bid-requests', {
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        ...data
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted!",
        description: "Your service request has been sent to contractors. You'll hear back soon!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/homeowner/bid-requests'] });
      setLocation('/homeowner-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleServiceToggle = (serviceName: string) => {
    const updated = selectedServices.includes(serviceName)
      ? selectedServices.filter(s => s !== serviceName)
      : [...selectedServices, serviceName];
    
    setSelectedServices(updated);
    form.setValue('servicesRequested', updated);
  };

  const getFilteredContractors = () => {
    if (!contractors?.contractors || selectedServices.length === 0) return [];
    
    // Get the IDs of selected services
    const selectedServiceIds = serviceCategories?.services
      ?.filter(service => selectedServices.includes(service.name))
      ?.map(service => service.id) || [];
    
    return contractors.contractors.filter(contractor => {
      // Primary matching: Check if contractor has serviceCategoryIds that match selected services
      if (contractor.serviceCategoryIds && Array.isArray(contractor.serviceCategoryIds) && selectedServiceIds.length > 0) {
        const hasMatchingServiceId = contractor.serviceCategoryIds.some(id => selectedServiceIds.includes(id));
        if (hasMatchingServiceId) {
          return true;
        }
      }
      
      // Fallback matching: Check specialties text (for contractors who only have text-based specialties)
      if (contractor.specialties && Array.isArray(contractor.specialties)) {
        return contractor.specialties.some(specialty => 
          selectedServices.some(service => {
            const normalizedSpecialty = specialty.toLowerCase().trim();
            const normalizedService = service.toLowerCase().trim();
            return normalizedSpecialty.includes(normalizedService) ||
                   normalizedService.includes(normalizedSpecialty);
          })
        );
      }
      
      return false;
    });
  };

  const onSubmit = async (data: BidRequestForm) => {
    if (selectedContractors.length === 0) {
      toast({
        title: "Please Select a Contractor",
        description: "Choose at least one contractor to send your request to.",
        variant: "destructive",
      });
      return;
    }

    // Submit to each selected contractor
    for (const contractorId of selectedContractors) {
      await submitBidRequest.mutateAsync({
        ...data,
        contractorId,
      });
    }
  };

  const nextStep = () => {
    if (step === 1 && selectedServices.length === 0) {
      toast({
        title: "Select Services",
        description: "Please select at least one service you need.",
        variant: "destructive",
      });
      return;
    }
    if (step === 2 && selectedContractors.length === 0) {
      toast({
        title: "Select Contractors",
        description: "Please select at least one contractor to contact.",
        variant: "destructive",
      });
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const goBack = () => {
    setLocation('/homeowner-dashboard');
  };

  const filteredContractors = getFilteredContractors();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Request Service</h1>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1">
          <div 
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                Select Services
              </CardTitle>
              <CardDescription>
                Choose the services you need for your home project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {serviceCategories?.services.map((service) => (
                  <div
                    key={service.id}
                    className={`
                      p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedServices.includes(service.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => handleServiceToggle(service.name)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{service.name}</span>
                      {selectedServices.includes(service.name) && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {selectedServices.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map((service) => (
                      <Badge 
                        key={service} 
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {service}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServiceToggle(service);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={nextStep} 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                disabled={selectedServices.length === 0}
              >
                Continue to Contractors
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contractor Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Select Contractors
              </CardTitle>
              <CardDescription>
                Choose contractors who can help with: {selectedServices.join(", ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredContractors.length > 0 ? (
                  filteredContractors.map((contractor) => (
                    <div
                      key={contractor.id}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${selectedContractors.includes(contractor.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => {
                        const updated = selectedContractors.includes(contractor.id)
                          ? selectedContractors.filter(id => id !== contractor.id)
                          : [...selectedContractors, contractor.id];
                        setSelectedContractors(updated);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {contractor.logoUrl && (
                            <img 
                              src={contractor.logoUrl} 
                              alt={contractor.companyName}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{contractor.companyName}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contractor.specialties.slice(0, 3).map((specialty, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        {selectedContractors.includes(contractor.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No contractors found for selected services.</p>
                    <Button variant="outline" onClick={prevStep} className="mt-4">
                      Go Back to Services
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={selectedContractors.length === 0}
                >
                  Continue to Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Project Details */}
        {step === 3 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Project Details
                  </CardTitle>
                  <CardDescription>
                    Provide details about your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you need done..."
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Project Address *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your complete address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Timeline *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="When do you need this done? (e.g., ASAP, Within 1 week, Flexible)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Budget (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="What's your budget? (e.g., $5,000, Under $1,000, Flexible)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredContactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Contact Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Text
                              </div>
                            </SelectItem>
                            <SelectItem value="phone">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Phone
                              </div>
                            </SelectItem>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInformation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional details, preferences, or requirements..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm text-gray-700">Services:</p>
                      <p className="text-sm text-gray-600">{selectedServices.join(", ")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-700">Contractors ({selectedContractors.length}):</p>
                      <p className="text-sm text-gray-600">
                        {filteredContractors
                          .filter(c => selectedContractors.includes(c.id))
                          .map(c => c.companyName)
                          .join(", ")
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={submitBidRequest.isPending}
                >
                  {submitBidRequest.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>

      {/* Bottom Navigation */}
      <HomeownerBottomNav 
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'contractors') {
            setLocation('/homeowner/contractors');
          } else if (tab === 'services') {
            setLocation('/homeowner/services');
          } else if (tab === 'requests') {
            setLocation('/homeowner-dashboard');
          } else if (tab === 'profile') {
            setLocation('/homeowner-dashboard?tab=profile');
          }
        }}
      />
    </div>
  );
}