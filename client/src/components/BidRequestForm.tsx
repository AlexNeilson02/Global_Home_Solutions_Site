import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image, Video, File } from "lucide-react";

const bidRequestSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().min(10, "Please enter a valid phone number"),
  serviceRequested: z.string().min(1, "Please select a service"),
  projectDescription: z.string().min(10, "Please describe your project in detail"),
  projectAddress: z.string().min(5, "Please enter your project address"),
  preferredTimeframe: z.string().min(1, "Please select a timeframe"),
  budget: z.string().optional(),
});

type BidRequestForm = z.infer<typeof bidRequestSchema>;

interface BidRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: {
    id: number;
    companyName: string;
    specialties: string[];
  };
  trackedSalesperson?: {
    id: number;
    fullName: string;
    profileUrl: string;
  };
}

export default function BidRequestForm({ isOpen, onClose, contractor, trackedSalesperson }: BidRequestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

  // Fetch available services from the database
  const { data: servicesData } = useQuery({
    queryKey: ["/api/service-categories"],
    enabled: isOpen, // Only fetch when modal is open
  });

  const form = useForm<BidRequestForm>({
    resolver: zodResolver(bidRequestSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      serviceRequested: "",
      projectDescription: "",
      projectAddress: "",
      preferredTimeframe: "",
      budget: "",
    },
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload only images or videos",
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 50MB",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      
      // Create preview URLs for images
      validFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setFilePreviewUrls(prev => [...prev, url]);
        }
      });

      toast({
        title: "Files uploaded",
        description: `${validFiles.length} file(s) added successfully`,
      });
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    if (fileToRemove && fileToRemove.type.startsWith('image/')) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const submitBidRequest = useMutation({
    mutationFn: async (data: BidRequestForm & { contractorId: number }) => {
      // If there are files, use FormData; otherwise use JSON
      if (uploadedFiles.length > 0) {
        // Create FormData for file uploads
        const formData = new FormData();
        
        console.log('Submitting with files. Form data:', data);
        
        // Add form fields with correct backend field names
        formData.append('customerName', data.customerName);
        formData.append('customerEmail', data.customerEmail);
        formData.append('customerPhone', data.customerPhone);
        formData.append('projectDescription', data.projectDescription);
        formData.append('projectAddress', data.projectAddress);
        formData.append('preferredTimeframe', data.preferredTimeframe);
        formData.append('budget', data.budget || '');
        formData.append('contractorId', data.contractorId.toString());
        
        // Add salesperson attribution for commission tracking
        if (trackedSalesperson) {
          formData.append('salespersonId', trackedSalesperson.id.toString());
        }
        
        // Add files
        uploadedFiles.forEach((file, index) => {
          formData.append('media', file);
        });

        // Debug: log FormData contents
        for (let [key, value] of formData.entries()) {
          console.log(`FormData ${key}:`, value);
        }

        const response = await fetch("/api/bid-requests", {
          method: "POST",
          body: formData, // Use FormData for file uploads
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to submit bid request: ${errorData}`);
        }
        return response.json();
      } else {
        // Use regular JSON for requests without files
        const submissionData = {
          ...data,
          // Add salesperson attribution for commission tracking
          ...(trackedSalesperson && { salespersonId: trackedSalesperson.id })
        };
        
        const response = await fetch("/api/bid-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to submit bid request: ${errorData}`);
        }
        return response.json();
      }
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to submit bid request: ${errorData}`);
      }
      
      // Check if response has content before parsing JSON
      const responseText = await response.text();
      if (!responseText) {
        return { success: true };
      }
      
      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.warn("Response is not valid JSON:", responseText);
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "Bid Request Sent!",
        description: `Your request has been sent to ${contractor.companyName}. They will contact you within 24 hours.`,
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      console.error("Bid request submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send bid request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BidRequestForm) => {
    // Map frontend form fields to backend expected fields
    const backendData = {
      customerName: data.customerName,
      customerEmail: data.customerEmail, 
      customerPhone: data.customerPhone,
      serviceRequested: data.serviceRequested,
      projectDescription: data.projectDescription,
      projectAddress: data.projectAddress,
      preferredTimeframe: data.preferredTimeframe,
      budget: data.budget,
      contractorId: contractor.id,
    };
    
    submitBidRequest.mutate(backendData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Bid from {contractor.companyName}</DialogTitle>
          <DialogDescription>
            Fill out the form below to request a bid for your project. 
            {contractor.companyName} specializes in: {contractor.specialties?.join(", ")}
          </DialogDescription>
          {trackedSalesperson && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-2">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Your request will help sales representative <strong>{trackedSalesperson.fullName}</strong> earn commission
                </span>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serviceRequested"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Requested</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servicesData?.services?.map((service: any) => (
                        <SelectItem key={service.id} value={service.name}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe your project in detail..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="preferredTimeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Timeframe</FormLabel>
                  <FormControl>
                    <Input placeholder="ASAP, Within 2 weeks, Next month, etc." {...field} />
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
                  <FormLabel>Budget Range (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="$5,000 - $10,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Media Upload Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Photos & Videos (Optional)</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload photos or short videos to help contractors understand your project better
                </p>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    id="media-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Click to upload photos or videos</span>
                    <span className="text-xs text-muted-foreground">
                      Supports: JPG, PNG, MP4, MOV (max 50MB each)
                    </span>
                  </label>
                </div>
              </div>

              {/* Display uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative group border rounded-lg overflow-hidden">
                        {file.type.startsWith('image/') ? (
                          <div className="relative">
                            <img
                              src={filePreviewUrls[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Image className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 bg-muted flex items-center justify-center">
                            <Video className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitBidRequest.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {submitBidRequest.isPending ? "Sending..." : "Send Bid Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}