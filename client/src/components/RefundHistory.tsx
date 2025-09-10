import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle, Clock, DollarSign, Eye, FileText, Loader2, Search } from 'lucide-react';

interface RefundHistoryProps {
  type: 'contractor' | 'admin';
  contractorId?: number;
}

export function RefundHistory({ type, contractorId }: RefundHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch refund requests based on type
  const { data: refundData, isLoading, refetch } = useQuery({
    queryKey: ['refund-history', type, contractorId, statusFilter],
    queryFn: () => {
      if (type === 'contractor' && contractorId) {
        return apiRequest('GET', `/api/refunds/contractor/${contractorId}`);
      } else if (type === 'admin') {
        const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        return apiRequest('GET', `/api/refunds/all${params}`);
      }
      return Promise.resolve({ refundRequests: [] });
    },
    enabled: type === 'admin' || (type === 'contractor' && !!contractorId),
  });

  const refundRequests = (refundData as any)?.refundRequests || [];

  // Filter requests by search query
  const filteredRequests = refundRequests.filter((request: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      request.reason?.toLowerCase().includes(searchLower) ||
      request.description?.toLowerCase().includes(searchLower) ||
      request.contractor?.companyName?.toLowerCase().includes(searchLower) ||
      request.amount?.toString().includes(searchLower)
    );
  });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading refund history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {type === 'contractor' ? 'My Refund Requests' : 'All Refund Requests'}
              </CardTitle>
              <CardDescription>
                {type === 'contractor' 
                  ? 'View the status of your refund requests'
                  : 'Manage all contractor refund requests'
                }
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search refunds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refund Requests Table */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Refund Requests</h3>
              <p className="text-sm text-gray-600">
                {searchQuery 
                  ? 'No refund requests match your search criteria.'
                  : 'No refund requests have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Details</TableHead>
                    {type === 'admin' && <TableHead>Contractor</TableHead>}
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{request.reason}</div>
                          {request.description && (
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {request.description}
                            </div>
                          )}
                          {request.refundDate && (
                            <div className="text-xs text-gray-500">
                              Refund Date: {formatDate(request.refundDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {type === 'admin' && (
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {request.contractor?.companyName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {request.requestedByUser?.fullName || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(request.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.requestedAt)}
                          </div>
                          {request.reviewedAt && (
                            <div className="text-xs text-gray-500">
                              Reviewed: {formatDate(request.reviewedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}