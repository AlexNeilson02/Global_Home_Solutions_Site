import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const contractorRegistrationSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  
  // Company Information
  companyName: z.string().min(2, "Company name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  insuranceProvider: z.string().min(1, "Insurance provider is required"),
  
  // Business Details
  businessAddress: z.string().min(5, "Business address is required"),
  yearsInBusiness: z.string().min(1, "Years in business is required"),
  employeeCount: z.string().min(1, "Employee count is required"),
  
  // Services
  specialties: z.array(z.string()).min(1, "Please select at least one specialty"),
  serviceAreas: z.string().min(5, "Service areas description is required"),
  
  // Portfolio
  portfolioDescription: z.string().min(10, "Please describe your work portfolio"),
  websiteUrl: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  
  // Additional Info
  certifications: z.string().optional(),
  additionalNotes: z.string().optional(),
  
  // Terms
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
});

type ContractorRegistrationForm = z.infer<typeof contractorRegistrationSchema>;

const specialtyOptions = [
  "Roofing", "Siding", "Windows", "Doors", "HVAC", "Plumbing", 
  "Electrical", "Flooring", "Kitchen Remodeling", "Bathroom Remodeling",
  "Painting", "Landscaping", "Concrete", "Fencing", "Solar Installation"
];

export default function ContractorRegistration() {
  const { toast } = useToast();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const form = useForm<ContractorRegistrationForm>({
    resolver: zodResolver(contractorRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      companyName: "",
      licenseNumber: "",
      insuranceProvider: "",
      businessAddress: "",
      yearsInBusiness: "",
      employeeCount: "",
      specialties: [],
      serviceAreas: "",
      portfolioDescription: "",
      websiteUrl: "",
      certifications: "",
      additionalNotes: "",
      agreeToTerms: false,
    },
  });

  const registerContractor = useMutation({
    mutationFn: async (data: ContractorRegistrationForm) => {
      const response = await fetch("/api/contractors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Registration failed: ${errorData}`);
      }
      
      const responseText = await response.text();
      if (!responseText) {
        return { success: true, contractor: { companyName: data.companyName } };
      }
      
      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.warn("Response is not valid JSON:", responseText);
        return { success: true, contractor: { companyName: data.companyName } };
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: `Welcome ${data.contractor?.companyName || "to our network"}! Your account has been created and you'll receive login credentials via email.`,
      });
      form.reset();
      setSelectedSpecialties([]);
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractorRegistrationForm) => {
    registerContractor.mutate({
      ...data,
      specialties: selectedSpecialties,
    });
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties(prev => {
      const newSpecialties = prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty];
      
      form.setValue("specialties", newSpecialties);
      return newSpecialties;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-900">
              Join Our Contractor Network
            </CardTitle>
            <CardDescription className="text-lg">
              Register your business and start receiving qualified leads from homeowners in your area
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Construction" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="LIC123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="insuranceProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Provider *</FormLabel>
                          <FormControl>
                            <Input placeholder="State Farm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="businessAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St, City, State 12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="yearsInBusiness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years in Business *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select years" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-2">1-2 years</SelectItem>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="6-10">6-10 years</SelectItem>
                                <SelectItem value="11-20">11-20 years</SelectItem>
                                <SelectItem value="20+">20+ years</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="employeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Employees *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-5">1-5 employees</SelectItem>
                                <SelectItem value="6-15">6-15 employees</SelectItem>
                                <SelectItem value="16-50">16-50 employees</SelectItem>
                                <SelectItem value="50+">50+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Services & Specialties</h3>
                  
                  <FormField
                    control={form.control}
                    name="specialties"
                    render={() => (
                      <FormItem>
                        <FormLabel>Specialties * (Select all that apply)</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {specialtyOptions.map((specialty) => (
                            <div key={specialty} className="flex items-center space-x-2">
                              <Checkbox
                                id={specialty}
                                checked={selectedSpecialties.includes(specialty)}
                                onCheckedChange={() => handleSpecialtyToggle(specialty)}
                              />
                              <label htmlFor={specialty} className="text-sm font-medium">
                                {specialty}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="serviceAreas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Areas *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the geographic areas you serve (cities, counties, radius from your location)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Portfolio */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Portfolio & Experience</h3>
                  
                  <FormField
                    control={form.control}
                    name="portfolioDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your best work, notable projects, and what sets your company apart"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.yourcompany.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any relevant certifications, training, or industry memberships"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Additional Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information you'd like to share about your business"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Terms */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the terms and conditions of the contractor network program *
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={registerContractor.isPending}
                >
                  {registerContractor.isPending ? "Creating Account..." : "Register My Business"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}