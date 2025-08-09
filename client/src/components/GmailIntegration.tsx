import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
  Eye,
  X,
  Reply,
  ArrowLeft,
  Inbox,
  Edit3,
  Zap,
  Phone,
  MessageSquare,
  ChevronDown,
  Users,
  FileText,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GmailIntegrationProps {
  contractorId?: number;
  pendingContactEmail?: any;
  onEmailSent?: () => void;
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

const GmailIntegration: React.FC<GmailIntegrationProps> = ({ contractorId, pendingContactEmail, onEmailSent }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showInbox, setShowInbox] = useState(true);
  const [currentView, setCurrentView] = useState<'inbox' | 'sent'>('inbox');

  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [emailForm, setEmailForm] = useState<EmailForm>({
    to: '',
    subject: '',
    body: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Gmail connection status
  const { data: userData } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: true
  });

  const contractor = (userData as any)?.roleData;

  // Fetch recent emails (inbox)
  const { data: recentEmails, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: [`/api/gmail/emails/${contractor?.id}`],
    enabled: Boolean(contractor?.gmailConnected && contractor?.id && currentView === 'inbox'),
  });

  // Fetch sent emails
  const { data: sentEmails, isLoading: sentEmailsLoading, refetch: refetchSentEmails } = useQuery({
    queryKey: [`/api/gmail/sent/${contractor?.id}`],
    enabled: Boolean(contractor?.gmailConnected && contractor?.id && currentView === 'sent'),
  });

  // Debug logging
  useEffect(() => {
    if (recentEmails) {
      console.log('Frontend received emails:', {
        data: recentEmails,
        emailsArray: (recentEmails as any)?.emails,
        count: (recentEmails as any)?.emails?.length || 0
      });
    }
  }, [recentEmails]);

  // Handle pending contact email from contractor dashboard
  useEffect(() => {
    if (pendingContactEmail) {
      handleContactLead(pendingContactEmail);
      if (onEmailSent) {
        // Clear the pending email after handling
        onEmailSent();
      }
    }
  }, [pendingContactEmail]);

  // Function to handle opening an email
  const handleOpenEmail = (email: GmailMessage) => {
    setSelectedEmail(email);
    setShowInbox(false);
    setShowCompose(false);
  };

  // Function to go back to inbox
  const handleBackToInbox = () => {
    setSelectedEmail(null);
    setShowInbox(true);
    setShowCompose(false);
  };

  // Function to switch views
  const handleViewSwitch = (view: 'inbox' | 'sent') => {
    setCurrentView(view);
    setSelectedEmail(null);
    setShowInbox(true);
    setShowCompose(false);
  };

  // Fetch pending bid requests for quick email composition
  const { data: bidRequests } = useQuery({
    queryKey: [`/api/contractors/${contractor?.id}/bid-requests`],
    enabled: !!contractor?.id,
  });

  // Connect Gmail mutation
  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/gmail/auth/${contractor?.id}`, {
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
      const response = await fetch(`/api/gmail/disconnect/${contractor?.id}`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
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
      const response = await fetch(`/api/gmail/send/${contractor?.id}`, {
        method: 'POST',
        body: JSON.stringify(emailData),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: async (data, variables) => {
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully.",
      });
      
      // If this email was sent to a bid request, mark it as contacted
      if (variables.bidRequestId) {
        try {
          await apiRequest('POST', `/api/contractors/${contractor?.id}/bid-requests/${variables.bidRequestId}/contact`, {});
          // Refresh bid requests to update the UI
          queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractor?.id}/bid-requests`] });
        } catch (error) {
          console.error('Failed to mark bid as contacted:', error);
        }
      }
      
      setShowCompose(false);
      setEmailForm({ to: '', subject: '', body: '' });
      refetchEmails();
      refetchSentEmails();
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    }
  });

  // Mark bid request as contacted mutation
  const markBidContactedMutation = useMutation({
    mutationFn: async (bidRequestId: number) => {
      return apiRequest('POST', `/api/contractors/${contractor?.id}/bid-requests/${bidRequestId}/contact`, {});
    },
    onSuccess: () => {
      // Refresh bid requests to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractor?.id}/bid-requests`] });
      toast({
        title: "Lead Contacted",
        description: "Bid request marked as contacted and removed from uncontacted leads.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to mark bid as contacted",
        variant: "destructive",
      });
    }
  });

  // Poll connection status after authorization
  const pollConnectionStatus = () => {
    setIsConnecting(true);
    const pollInterval = setInterval(async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
        const updatedContractor = queryClient.getQueryData(['/api/users/me']) as any;
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





  const clearEmailForm = () => {
    setEmailForm({
      to: '',
      subject: '',
      body: ''
    });
  };

  const handleNewCompose = () => {
    clearEmailForm();
    setShowCompose(true);
    setShowInbox(false);
    setSelectedEmail(null);
  };

  const handleQuickCompose = (bidRequest: any) => {
    console.log('handleQuickCompose called:', bidRequest);
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

  // Function to handle contacting a lead
  const handleContactLead = (bid: any) => {
    console.log('handleContactLead called:', bid);
    
    // Mark bid as contacted immediately when CONTACT button is pressed
    markBidContactedMutation.mutate(bid.id);
    
    const serviceType = bid.servicesRequested?.[0] || bid.serviceType || 'your service request';
    const customerName = bid.fullName || bid.customerName || 'there';
    
    const subject = `Professional ${serviceType} Services - ${(contractor as any)?.companyName || 'Our Company'}`;
    const body = `Dear ${customerName},

Thank you for your interest in ${serviceType.toLowerCase()} services. I received your request and I'm excited to help you with your project.

About us:
• Licensed and insured contractor
• Extensive experience in ${serviceType.toLowerCase()}
• Quality workmanship with warranty
• Competitive pricing and flexible scheduling

${bid.description ? `Regarding your project: "${bid.description}"` : 'I\'d love to learn more about your specific needs.'}

${bid.budget ? `Budget Range: $${bid.budget.toLocaleString()}` : ''}

I'd be happy to schedule a free consultation to discuss your project in detail and provide you with a personalized quote.

Are you available for a brief call this week to get started?

Best regards,
${(contractor as any)?.companyName || '[Your Company]'}
${(contractor as any)?.phone ? `Phone: ${(contractor as any).phone}` : ''}`;
    
    // Store the bid ID to mark as contacted after email is sent
    setEmailForm({
      to: bid.email,
      subject,
      body,
      bidRequestId: bid.id // Add bidRequestId to track which lead this email is for
    });
    setShowCompose(true);
    setShowInbox(false);
    setSelectedEmail(null);
  };

  if (!contractor) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Style object to remove yellow coloring - applying anti-yellow fix
  const antiYellowStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  } as const;

  if (!(contractor as any)?.gmailConnected) {
    return (
      <Card style={antiYellowStyles}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Gmail Integration
          </CardTitle>
          <CardDescription>
            Connect your Gmail account to send emails to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => connectGmailMutation.mutate()}
            disabled={connectGmailMutation.isPending || isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
            style={antiYellowStyles}
          >
            {(connectGmailMutation.isPending || isConnecting) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            {isConnecting ? 'Connecting...' : 'Connect Gmail'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Uncontacted Leads - Quick Contact */}
      {(bidRequests as any)?.bidRequests?.length > 0 && (
        <Card style={antiYellowStyles}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Uncontacted Leads
            </CardTitle>
            <CardDescription>
              Contact new clients who haven't been reached yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {(bidRequests as any).bidRequests
                .filter((bid: any) => bid.status === 'pending' && !bid.emailSent)
                .slice(0, 5)
                .map((bid: any) => (
                <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-gray-900">{bid.fullName || bid.customerName}</div>
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                        Uncontacted
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">{bid.servicesRequested?.[0] || bid.serviceType}</span>
                      {bid.budget && (
                        <>
                          {' • '}
                          <span className="text-green-600 font-medium">${bid.budget?.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {bid.email}
                    </div>
                    {bid.phone && (
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3" />
                        {bid.phone}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Button 
                      size="sm"
                      onClick={() => handleContactLead(bid)}
                      className="bg-blue-600 hover:bg-blue-700"
                      style={antiYellowStyles}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      CONTACT
                    </Button>
                  </div>
                </div>
              ))}
              
              {(bidRequests as any).bidRequests.filter((bid: any) => bid.status === 'pending' && !bid.emailSent).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
                  <h3 className="font-medium text-gray-900 mb-1">All leads contacted</h3>
                  <p className="text-sm">Great job! You've reached out to all pending leads</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Client Interface */}
      <div className="min-h-[700px] max-h-[700px] bg-white rounded-lg border overflow-hidden flex">
        {/* Email Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-white">
            {/* Gmail Profile Section */}
            <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {(contractor as any)?.email?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {(contractor as any)?.email || 'Gmail Connected'}
                </div>
                <div className="text-xs text-gray-500">Connected Account</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm('Change Gmail account? This will disconnect your current account and require re-authentication.')) {
                    disconnectGmailMutation.mutate();
                  }
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Gmail</h2>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => refetchEmails()}
                  disabled={emailsLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${emailsLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => disconnectGmailMutation.mutate()}
                  disabled={disconnectGmailMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleNewCompose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>

          {/* Navigation */}
          <div className="px-4 py-2">
            <div className="space-y-1">
              <button 
                onClick={() => handleViewSwitch('inbox')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  currentView === 'inbox' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Mail className="h-4 w-4" />
                Inbox
              </button>
              <button 
                onClick={() => handleViewSwitch('sent')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg ${
                  currentView === 'sent' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Send className="h-4 w-4" />
                Sent
              </button>
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {(emailsLoading || sentEmailsLoading) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (() => {
              const currentEmails = currentView === 'inbox' ? recentEmails : sentEmails;
              const emails = (currentEmails as any)?.emails || [];
              
              return emails.length > 0 ? (
                <div className="space-y-px">
                  {emails.slice(0, 10).map((email: GmailMessage) => (
                    <div key={email.id} className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-l-2 border-transparent hover:border-blue-500" onClick={() => handleOpenEmail(email)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {currentView === 'sent' 
                                ? `To: ${email.to.split('<')[0].trim() || email.to}`
                                : (email.from.split('<')[0].trim() || email.from)
                              }
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(email.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-700 truncate mb-1">
                            {email.subject}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {email.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  {currentView === 'sent' ? <Send className="h-8 w-8 mx-auto mb-2 text-gray-300" /> : <Mail className="h-8 w-8 mx-auto mb-2 text-gray-300" />}
                  <p className="text-sm">No {currentView === 'sent' ? 'sent emails' : 'emails'} found</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Main Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Your Email Center</h3>
                <p className="text-gray-600 mt-1">Manage professional communications with clients</p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedEmail ? (
              /* Email View */
              <div className="max-w-4xl mx-auto">
                {/* Email Header with Back Button */}
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackToInbox}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Inbox
                  </Button>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedEmail.subject}</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEmailForm({
                        to: selectedEmail.from.includes('<') 
                          ? selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from
                          : selectedEmail.from,
                        subject: selectedEmail.subject.startsWith('Re: ') 
                          ? selectedEmail.subject 
                          : `Re: ${selectedEmail.subject}`,
                        body: `\n\n---\nOn ${new Date(selectedEmail.sentAt).toLocaleString()}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`
                      });
                      setSelectedEmail(null);
                      setShowCompose(true);
                      setShowInbox(false);
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>

                {/* Email Header Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">From:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {selectedEmail.from.includes('<') 
                            ? selectedEmail.from.split('<')[0].trim() + ' ' + selectedEmail.from.match(/<(.+)>/)?.[0]
                            : selectedEmail.from}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(selectedEmail.sentAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">To:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedEmail.to}</span>
                    </div>
                    {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">CC:</span>
                        <span className="text-sm text-gray-900 ml-2">{selectedEmail.cc.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Body */}
                <div className="bg-white border rounded-lg p-6">
                  <div 
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {selectedEmail.htmlBody ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {selectedEmail.body.replace(/\r\n/g, '\n').replace(/\r/g, '\n')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-900">{attachment.name}</span>
                          <span className="text-xs text-gray-500">({(attachment.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : showInbox ? (
              /* Email List View */
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-semibold mb-4">
                  {currentView === 'inbox' ? 'Inbox' : 'Sent Mail'}
                </h3>
                {(() => {
                  const isLoading = currentView === 'inbox' ? emailsLoading : sentEmailsLoading;
                  const currentEmails = currentView === 'inbox' ? recentEmails : sentEmails;
                  const emails = (currentEmails as any)?.emails || [];
                  
                  if (isLoading) {
                    return (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading {currentView === 'inbox' ? 'emails' : 'sent emails'}...</span>
                      </div>
                    );
                  }
                  
                  if (emails.length > 0) {
                    return (
                      <div className="space-y-2">
                        {emails.map((email: GmailMessage) => (
                          <div key={email.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenEmail(email)}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {currentView === 'sent' 
                                      ? `To: ${email.to.includes('<') ? email.to.split('<')[0].trim() : email.to}`
                                      : (email.from.includes('<') ? email.from.split('<')[0].trim() : email.from)
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(email.sentAt).toLocaleDateString()} at {new Date(email.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2">{email.subject}</h4>
                                <div className="text-sm text-gray-600 line-clamp-3">
                                  {email.body.replace(/<[^>]*>/g, '').trim() || 'No content'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  return (
                    <div className="text-center py-12">
                      {currentView === 'sent' ? <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" /> : <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {currentView === 'sent' ? 'sent emails' : 'emails'} found</h3>
                      <p className="text-gray-600 mb-6">
                        {currentView === 'sent' 
                          ? 'You haven\'t sent any emails yet.' 
                          : 'Your inbox is empty or emails haven\'t loaded yet.'
                        }
                      </p>
                      <Button 
                        onClick={() => currentView === 'inbox' ? refetchEmails() : refetchSentEmails()}
                        variant="outline"
                        className="mr-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button 
                        onClick={handleNewCompose}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Compose Email
                      </Button>
                    </div>
                  );
                })()}
              </div>
            ) : showCompose ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Compose Email</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        clearEmailForm();
                        setShowCompose(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">To</label>
                      <Input
                        type="email"
                        value={emailForm.to}
                        onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                        placeholder="recipient@email.com"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                        placeholder="Email subject"
                        className="w-full"
                      />
                    </div>
                    

                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        value={emailForm.body}
                        onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
                        placeholder="Write your email message..."
                        rows={8}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          clearEmailForm();
                          setShowCompose(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => sendEmailMutation.mutate(emailForm)}
                        disabled={sendEmailMutation.isPending || !emailForm.to || !emailForm.subject}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {sendEmailMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Email
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>





    </div>
  );
};

export default GmailIntegration;