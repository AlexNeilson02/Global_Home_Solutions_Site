import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Basic bid request schema with validation
const bidRequestSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  address: z.string().min(5, { message: "Please provide your complete address." }),
  description: z.string().min(10, { message: "Please provide more details about your project." }).max(1000, { message: "Description cannot exceed 1000 characters." }),
  timeline: z.string(),
  budget: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone"]),
  additionalInformation: z.string().optional(),
});

export type BidRequestData = z.infer<typeof bidRequestSchema>;

interface BidRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorId: number;
  contractorName: string;
  salespersonId: number | null;
  serviceCategory?: string;
}

export function BidRequestModal({
  open,
  onOpenChange,
  contractorId,
  contractorName,
  salespersonId,
  serviceCategory
}: BidRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate service-specific form fields based on category
  const getServiceSpecificFields = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "plumbing":
        return (
          <>
            <FormField
              control={form.control}
              name="additionalInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plumbing Specifics</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What plumbing services do you need? (e.g., leak repairs, pipe installation, water heater replacement)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the plumbing issue or project in detail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "electrical":
        return (
          <>
            <FormField
              control={form.control}
              name="additionalInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Electrical Specifics</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What electrical services do you need? (e.g., wiring, panel upgrade, lighting installation)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the electrical work needed in detail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "roofing":
        return (
          <>
            <FormField
              control={form.control}
              name="additionalInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roofing Specifics</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What roofing services do you need? (e.g., leak repair, full roof replacement, material preference)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your roofing project in detail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "landscaping":
        return (
          <>
            <FormField
              control={form.control}
              name="additionalInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landscaping Specifics</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What landscaping services do you need? (e.g., lawn maintenance, garden design, irrigation)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your landscaping needs in detail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return (
          <>
            <FormField
              control={form.control}
              name="additionalInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information that might help the contractor with your bid..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any other relevant details about your project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
    }
  };

  const form = useForm<BidRequestData>({
    resolver: zodResolver(bidRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      timeline: "1-3 months",
      budget: "",
      preferredContactMethod: "email",
      additionalInformation: "",
    },
  });

  async function onSubmit(data: BidRequestData) {
    setIsSubmitting(true);
    
    try {
      // Submit the bid request to the API
      await apiRequest("/api/bid-requests", {
        method: "POST",
        data: {
          ...data,
          contractorId,
          salespersonId,
        },
      });
      
      toast({
        title: "Bid Request Submitted",
        description: `Your request has been sent to ${contractorName}. They will contact you shortly.`,
      });
      
      // Close the modal after successful submission
      onOpenChange(false);
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error submitting bid request:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Bid from {contractorName}</DialogTitle>
          <DialogDescription>
            Fill out the form below to request a personalized bid for your home improvement project.
            {serviceCategory && ` This form is customized for ${serviceCategory} services.`}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
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
                name="preferredContactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Contact Method</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the address where the work will be done" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your project in detail..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about the scope of work and any special requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Timeline</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a timeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">As soon as possible</SelectItem>
                        <SelectItem value="< 1 month">Within 1 month</SelectItem>
                        <SelectItem value="1-3 months">1-3 months</SelectItem>
                        <SelectItem value="3-6 months">3-6 months</SelectItem>
                        <SelectItem value="> 6 months">More than 6 months</SelectItem>
                        <SelectItem value="flexible">Flexible/Not sure yet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your approximate budget" {...field} />
                    </FormControl>
                    <FormDescription>
                      Help contractors provide a suitable quote
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Service-specific fields based on category */}
            {getServiceSpecificFields(serviceCategory)}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}