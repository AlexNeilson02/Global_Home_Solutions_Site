import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  User, 
  Building2, 
  FileText,
  Eye,
  Loader2 
} from 'lucide-react';

interface RefundRequest {
  id: number;
  contractorId: number;
  amount: number;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';
  requestedAt: string;
  requestedBy: number;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
  processedAt?: string;
  stripePaymentIntentId?: string;
  stripeRefundId?: string;
  contractor?: {
    id: number;
    companyName: string;
    userId: number;
  };
  requestedByUser?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export function RefundManagement() {
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    reviewNotes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending refund requests
  const { data: pendingRequests, isLoading: loadingPending } = useQuery({
    queryKey: ['refund-requests', 'pending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/refunds/pending');
      return response.json();
    },
  });

  // Fetch all refund requests
  const { data: allRequests, isLoading: loadingAll } = useQuery({
    queryKey: ['refund-requests', 'all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/refunds');
      return response.json();
    },
  });

  // Review refund request mutation
  const reviewRefundMutation = useMutation({
    mutationFn: (data: { id: number; status: string; reviewNotes: string }) => 
      apiRequest('PATCH', `/api/refunds/${data.id}/review`, {
        status: data.status,
        reviewNotes: data.reviewNotes
      }),
    onSuccess: () => {
      toast({
        title: "Refund Request Reviewed",
        description: "The refund request has been successfully reviewed.",
      });
      setReviewModalOpen(false);
      setSelectedRequest(null);
      setReviewData({ status: 'approved', reviewNotes: '' });
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to review refund request.",
        variant: "destructive",
      });
    },
  });

  // Process refund mutation (actually execute the Stripe refund)
  const processRefundMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/refunds/${id}/process`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Refund processed successfully through Stripe. Refund ID: ${data.stripeRefund?.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    }
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    reviewRefundMutation.mutate({
      id: selectedRequest.id,
      status: reviewData.status,
      reviewNotes: reviewData.reviewNotes
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
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
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
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const pendingRequestsList = pendingRequests?.refundRequests || [];
  const allRequestsList = allRequests?.refundRequests || [];

  if (loadingPending || loadingAll) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading refund requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingRequestsList.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Approved</p>
              <p className="text-2xl font-bold text-green-900">
                {allRequestsList.filter((r: RefundRequest) => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Rejected</p>
              <p className="text-2xl font-bold text-red-900">
                {allRequestsList.filter((r: RefundRequest) => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Total Amount</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(allRequestsList.reduce((sum: number, r: RefundRequest) => sum + r.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequestsList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Pending Review ({pendingRequestsList.length})</h3>
          </div>
          
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequestsList.map((request: RefundRequest) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{request.contractor?.companyName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{request.requestedByUser?.fullName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-lg">{formatCurrency(request.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {request.reason}
                        </span>
                        {request.description && (
                          <p className="text-sm text-gray-600 mt-1 truncate max-w-xs">
                            {request.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(request.requestedAt).toLocaleDateString()}</p>
                        <p className="text-gray-500">{new Date(request.requestedAt).toLocaleTimeString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* All Requests Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">All Refund Requests</h3>
        
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contractor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Reviewed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRequestsList.map((request: RefundRequest) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{request.contractor?.companyName || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{request.requestedByUser?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(request.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {request.reason}
                      </span>
                      {request.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate max-w-xs">
                          {request.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      {getStatusBadge(request.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(request.requestedAt).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.reviewedAt ? (
                        <p>{new Date(request.reviewedAt).toLocaleDateString()}</p>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {request.status === 'approved' && !request.processedAt && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => processRefundMutation.mutate(request.id)}
                          disabled={processRefundMutation.isPending}
                        >
                          {processRefundMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-1" />
                          )}
                          Process Refund
                        </Button>
                      )}
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Review button clicked for request:', request.id);
                            setSelectedRequest(request);
                            setReviewModalOpen(true);
                            console.log('Modal should be open now');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Modal */}
      {console.log('ReviewModal render - reviewModalOpen:', reviewModalOpen, 'selectedRequest:', selectedRequest?.id)}
      <Dialog 
        open={reviewModalOpen} 
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange called with:', open);
          if (!open) {
            setReviewModalOpen(false);
            setSelectedRequest(null);
            setReviewData({ status: 'approved', reviewNotes: '' });
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[600px]"
          onInteractOutside={(e) => {
            // Always prevent closing on outside clicks
            e.preventDefault();
            e.stopPropagation();
          }}
          onEscapeKeyDown={(e) => {
            // Always prevent escape key from closing
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Review Refund Request</DialogTitle>
            <DialogDescription>
              Approve or reject the refund request from {selectedRequest?.contractor?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Request Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company</Label>
                    <p className="text-sm">{selectedRequest.contractor?.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Amount</Label>
                    <p className="text-lg font-bold">{formatCurrency(selectedRequest.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Reason</Label>
                    <p className="text-sm">{selectedRequest.reason}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Requested Date</Label>
                    <p className="text-sm">{new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {selectedRequest.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-sm text-gray-600">{selectedRequest.description}</p>
                  </div>
                )}
              </div>

              {/* Review Decision */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Decision</Label>
                  <div className="flex gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, status: 'approved' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded border ${
                        reviewData.status === 'approved'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, status: 'rejected' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded border ${
                        reviewData.status === 'rejected'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reviewNotes">Admin Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder="Add notes about your decision..."
                    value={reviewData.reviewNotes}
                    onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={reviewRefundMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={reviewRefundMutation.isPending}
                  className={reviewData.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {reviewRefundMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {reviewData.status === 'approved' ? 'Approve' : 'Reject'} Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}