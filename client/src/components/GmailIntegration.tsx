import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Trash2,
  Plus,
  User,
  Calendar,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GmailIntegrationProps {
  contractorId?: number;
}

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  body: string;
  htmlBody?: string;
  sentAt: string;
  attachments?: { name: string; url: string; size: number }[];
  labels?: string[];
}

interface EmailForm {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  bidRequestId?: number;
}

const GmailIntegration: React.FC<GmailIntegrationProps> = ({ contractorId }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailForm>({
    to: '',
    subject: '',
    body: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Gmail connection status
  const { data: contractor, isLoading: contractorLoading } = useQuery({
    queryKey: ['/api/contractors', contractorId],
    enabled: !!contractorId
  });

  // Fetch recent emails
  const { data: recentEmails, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: ['/api/gmail/emails', contractorId],
    enabled: !!contractorId && (contractor as any)?.gmailConnected,
  });

  // Fetch pending bid requests for quick email composition
  const { data: bidRequests } = useQuery({
    queryKey: ['/api/bid-requests', contractorId],
    enabled: !!contractorId,
  });

  // Connect Gmail mutation
  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/gmail/auth/${contractorId}`, {
        method: 'GET'
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=600');
        // Poll for connection status
        pollConnectionStatus();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Gmail",
        variant: "destructive",
      });
    }
  });

  // Disconnect Gmail mutation
  const disconnectGmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/gmail/disconnect/${contractorId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors', contractorId] });
      toast({
        title: "Gmail Disconnected",
        description: "Your Gmail account has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect Gmail",
        variant: "destructive",
      });
    }
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: EmailForm) => {
      return await apiRequest(`/api/gmail/send/${contractorId}`, {
        method: 'POST',
        body: JSON.stringify(emailData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully.",
      });
      setShowCompose(false);
      setEmailForm({ to: '', subject: '', body: '' });
      refetchEmails();
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    }
  });

  // Poll connection status after authorization
  const pollConnectionStatus = () => {
    setIsConnecting(true);
    const pollInterval = setInterval(async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['/api/contractors', contractorId] });
        const updatedContractor = queryClient.getQueryData(['/api/contractors', contractorId]) as any;
        if (updatedContractor && updatedContractor.gmailConnected) {
          clearInterval(pollInterval);
          setIsConnecting(false);
          toast({
            title: "Gmail Connected!",
            description: "Your Gmail account has been connected successfully.",
          });
          refetchEmails();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    // Stop polling after 30 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsConnecting(false);
    }, 30000);
  };

  // Email templates
  const emailTemplates = {
    initial_contact: {
      subject: "Professional Services Proposal - [Service Type]",
      body: `Dear [Client Name],

Thank you for your interest in our services. I'm excited to discuss your [project type] project with you.

Based on the information provided, I believe we can deliver excellent results for your project. Here's what sets us apart:

• [Years] years of experience in [specialty]
• Licensed and insured
• Competitive pricing with quality guarantee
• Local expertise and references available

I'd love to schedule a brief consultation to discuss your specific needs and provide you with a detailed proposal.

Would you be available for a quick call this week?

Best regards,
[Your Name]
[Company Name]
[Phone Number]`
    },
    follow_up: {
      subject: "Following up on your [Service Type] project",
      body: `Hi [Client Name],

I wanted to follow up on the [service type] project we discussed. I understand you may be considering multiple contractors, and I'd like to reiterate why we're the right choice for your project:

• Detailed proposal with transparent pricing
• Flexible scheduling to meet your timeline
• Local references and portfolio available
• Full licensing and insurance coverage

If you have any questions or would like to move forward, I'm just a phone call away.

Looking forward to hearing from you soon.

Best regards,
[Your Name]
[Company Name]
[Phone Number]`
    },
    proposal_sent: {
      subject: "Your Detailed Proposal - [Service Type]",
      body: `Dear [Client Name],

Thank you for taking the time to discuss your [project type] project with me. As promised, I've prepared a detailed proposal for your review.

The proposal includes:
• Comprehensive scope of work
• Detailed timeline
• Transparent pricing breakdown
• Material specifications
• Warranty information

Please review the attached proposal at your convenience. I'm confident that our approach and competitive pricing will meet your needs.

I'm available to discuss any questions you might have or to schedule a follow-up meeting.

Best regards,
[Your Name]
[Company Name]
[Phone Number]`
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = emailTemplates[templateKey as keyof typeof emailTemplates];
    if (template) {
      setEmailForm(prev => ({
        ...prev,
        subject: template.subject,
        body: template.body
      }));
      setSelectedTemplate(templateKey);
    }
  };

  const handleQuickCompose = (bidRequest: any) => {
    setEmailForm({
      to: bidRequest.email,
      subject: `Professional ${bidRequest.serviceType} Services - Proposal`,
      body: `Dear ${bidRequest.customerName},

Thank you for your interest in our ${bidRequest.serviceType} services. I've reviewed your project requirements and I'm excited to discuss how we can help you.

Project Details:
• Service: ${bidRequest.serviceType}
• Budget Range: $${bidRequest.budget}
• Timeline: As discussed

I'd love to schedule a consultation to provide you with a detailed proposal tailored to your specific needs.

Are you available for a brief call this week?

Best regards,
${(contractor as any)?.companyName}`
    });
    setShowCompose(true);
  };

  if (contractorLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Connection Status
            </div>
            {(contractor as any)?.gmailConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {(contractor as any)?.gmailConnected 
              ? "Your Gmail account is connected and ready to use" 
              : "Connect your Gmail account to send emails to clients"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(contractor as any)?.gmailConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setShowCompose(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Compose Email
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => refetchEmails()}
                  disabled={emailsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${emailsLoading ? 'animate-spin' : ''}`} />
                  Refresh Emails
                </Button>
              </div>
              <Button 
                variant="destructive"
                onClick={() => disconnectGmailMutation.mutate()}
                disabled={disconnectGmailMutation.isPending}
              >
                {disconnectGmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => connectGmailMutation.mutate()}
              disabled={connectGmailMutation.isPending || isConnecting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {(connectGmailMutation.isPending || isConnecting) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect Gmail'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Bid Requests */}
      {(contractor as any)?.gmailConnected && (bidRequests as any)?.bidRequests?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Email Actions</CardTitle>
            <CardDescription>
              Send emails to clients from your pending bid requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {(bidRequests as any).bidRequests
                .filter((bid: any) => bid.status === 'pending')
                .slice(0, 3)
                .map((bid: any) => (
                <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{bid.customerName}</div>
                    <div className="text-sm text-gray-600">{bid.serviceType} • ${bid.budget}</div>
                    <div className="text-sm text-gray-500">{bid.email}</div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleQuickCompose(bid)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compose Email Modal/Form */}
      {showCompose && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Email
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCompose(false)}
              >
                ✕
              </Button>
            </CardTitle>
            <CardDescription>
              Send a professional email to your clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Template</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial_contact">Initial Contact</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <Input
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  placeholder="Enter email subject"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
                  placeholder="Enter your message"
                  rows={12}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => sendEmailMutation.mutate(emailForm)}
                  disabled={sendEmailMutation.isPending || !emailForm.to || !emailForm.subject || !emailForm.body}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Email
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCompose(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Emails */}
      {(contractor as any)?.gmailConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Sent Emails
            </CardTitle>
            <CardDescription>
              View your recent email communications with clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (recentEmails as any)?.emails?.length > 0 ? (
              <div className="space-y-4">
                {(recentEmails as any).emails.slice(0, 10).map((email: GmailMessage) => (
                  <div key={email.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">{email.subject}</div>
                        <div className="text-sm text-gray-600">To: {email.to}</div>
                        <div className="text-sm text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(email.sentAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 mt-2">
                      {email.body.length > 200 
                        ? `${email.body.substring(0, 200)}...`
                        : email.body
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No sent emails found</p>
                <p className="text-sm">Your sent emails will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GmailIntegration;