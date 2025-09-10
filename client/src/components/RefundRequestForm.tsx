import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle, Clock, Loader2, DollarSign } from 'lucide-react';

interface RefundRequestFormProps {
  contractorId?: number;
}

export function RefundRequestForm({ contractorId }: RefundRequestFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    description: '',
    bidRequestId: '',
    refundDate: ''
  });
  const [showForm, setShowForm] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing refund requests for this contractor
  const { data: refundRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['refund-requests', contractorId],
    queryFn: () => apiRequest('GET', `/api/refunds/contractor/${contractorId}`),
    enabled: !!contractorId,
  });

  // Fetch bid requests for this contractor to populate dropdown
  const { data: bidRequestsData, isLoading: loadingBidRequests } = useQuery({
    queryKey: ['contractor-bid-requests', contractorId],
    queryFn: () => apiRequest('GET', `/api/refunds/bid-requests/contractor/${contractorId}`),
    enabled: !!contractorId,
  });

  // Create refund request mutation
  const createRefundMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/refunds', data),
    onSuccess: () => {
      toast({
        title: "Refund Request Submitted",
        description: "Your refund request has been submitted for review.",
      });
      setFormData({ amount: '', reason: '', description: '', bidRequestId: '', refundDate: '' });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Request",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractorId) {
      toast({
        title: "Error",
        description: "Contractor information not found.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid refund amount.",
        variant: "destructive",
      });
      return;
    }

    createRefundMutation.mutate({
      contractorId,
      amount,
      reason: formData.reason,
      description: formData.description,
      bidRequestId: formData.bidRequestId || null,
      refundDate: formData.refundDate ? new Date(formData.refundDate) : null,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Rejected</Badge>;
      case 'processed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Processed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingRequests) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading refund requests...</span>
      </div>
    );
  }

  const existingRequests = (refundRequests as any)?.refundRequests || [];

  return (
    <div className="space-y-6">
      {/* Existing Refund Requests */}
      {existingRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Your Refund Requests</h4>
          <div className="space-y-3">
            {existingRequests.map((request: any) => (
              <div key={request.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(request.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          ${request.amount.toFixed(2)}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{request.reason}</p>
                      {request.description && (
                        <p className="text-xs text-gray-500">{request.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Requested on {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                      {request.reviewNotes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-blue-800">
                            <strong>Admin Notes:</strong> {request.reviewNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create New Refund Request */}
      <div className="space-y-4">
        {!showForm ? (
          <div className="text-center p-6 border border-gray-200 rounded-lg bg-gray-50">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Request a Refund</h4>
            <p className="text-sm text-gray-600 mb-4">
              Submit a formal refund request for commission charges or subscription fees
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              Submit Refund Request
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Submit Refund Request</h4>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ amount: '', reason: '', description: '', bidRequestId: '', refundDate: '' });
                }}
              >
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Refund Amount ($)*</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Refund*</Label>
                <select
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Billing Error">Billing Error</option>
                  <option value="Service Not Delivered">Service Not Delivered</option>
                  <option value="Duplicate Charge">Duplicate Charge</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Cancellation">Cancellation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bidRequest">Related Project</Label>
                <select
                  id="bidRequest"
                  value={formData.bidRequestId}
                  onChange={(e) => setFormData({ ...formData, bidRequestId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a project (optional)</option>
                  {loadingBidRequests ? (
                    <option value="">Loading projects...</option>
                  ) : (
                    <>
                      {((bidRequestsData as any)?.bidRequests || []).map((bidRequest: any) => (
                        <option key={bidRequest.id} value={bidRequest.id}>
                          {bidRequest.servicesRequested?.[0] || 'Service Request'} - {bidRequest.fullName} - {new Date(bidRequest.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                      <option value="not_listed">Project not listed here</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundDate">Date Charged</Label>
                <Input
                  id="refundDate"
                  type="date"
                  value={formData.refundDate}
                  onChange={(e) => setFormData({ ...formData, refundDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Details</Label>
              <Textarea
                id="description"
                placeholder="Please provide additional details about your refund request..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-yellow-800">Important Information</h5>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Refund requests are reviewed by our admin team</li>
                    <li>• Processing may take 3-5 business days</li>
                    <li>• You will be notified of the decision via email</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createRefundMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createRefundMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Refund Request'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}