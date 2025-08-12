import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Wallet
} from 'lucide-react';

interface StripeConnectStatus {
  hasStripeAccount: boolean;
  stripeAccountId?: string;
  accountStatus: string;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
}

export function StripeConnectSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current Stripe Connect status
  const { data: status, isLoading } = useQuery<StripeConnectStatus>({
    queryKey: ['/api/stripe-connect/accounts/status'],
    refetchInterval: 5000, // Check every 5 seconds for status updates
  });

  // Create Stripe Connect account
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe-connect/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create Stripe account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created",
        description: "Your Stripe Connect account has been created. Complete onboarding to receive payments.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stripe-connect/accounts/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get onboarding link
  const onboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe-connect/accounts/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create onboarding link');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe onboarding in new tab
      window.open(data.url, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get dashboard link
  const dashboardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe-connect/accounts/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create dashboard link');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe dashboard in new tab
      window.open(data.url, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Force update account status
  const forceUpdateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe-connect/accounts/force-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update account status');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stripe-connect/accounts/status'] });
      toast({
        title: "Status Updated",
        description: "Account status has been refreshed from Stripe.",
      });
    },
    onError: (error: Error) => {
      console.error('Force update error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (accountStatus: string, onboardingComplete: boolean) => {
    if (onboardingComplete && accountStatus === 'complete') return 'default';
    if (accountStatus === 'pending') return 'secondary';
    if (accountStatus === 'restricted' || accountStatus === 'rejected') return 'destructive';
    return 'outline';
  };

  const getStatusText = (accountStatus: string, onboardingComplete: boolean) => {
    if (onboardingComplete && accountStatus === 'complete') return 'Active';
    if (accountStatus === 'pending') return 'Pending Setup';
    if (accountStatus === 'restricted') return 'Restricted';
    if (accountStatus === 'rejected') return 'Rejected';
    return 'Not Started';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading payment setup...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Commission Payment Setup
          </CardTitle>
          <CardDescription>
            Set up automatic commission payments with Stripe Connect. Get paid directly when contractors are charged referral fees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {status?.onboardingComplete && status.accountStatus === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : status?.hasStripeAccount ? (
                <Clock className="h-5 w-5 text-yellow-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <div className="font-medium">Payment Account Status</div>
                <div className="text-sm text-muted-foreground">
                  {status?.hasStripeAccount ? 'Stripe Connect account created' : 'No payment account'}
                </div>
              </div>
            </div>
            <Badge className="bg-[#00ff00c7] text-black font-medium px-3 py-1 rounded-full border-0">
              {getStatusText(status?.accountStatus || 'pending', status?.onboardingComplete || false)}
            </Badge>
          </div>

          {/* Setup Steps */}
          {!status?.hasStripeAccount && (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertTitle>Payment Account Required</AlertTitle>
              <AlertDescription>
                Create a Stripe Connect account to receive commission payments automatically when contractors pay referral fees.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!status?.hasStripeAccount ? (
              <Button 
                onClick={() => createAccountMutation.mutate()}
                disabled={createAccountMutation.isPending}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {createAccountMutation.isPending ? 'Creating Account...' : 'Create Payment Account'}
              </Button>
            ) : !status.onboardingComplete ? (
              <Button 
                onClick={() => onboardingMutation.mutate()}
                disabled={onboardingMutation.isPending}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {onboardingMutation.isPending ? 'Opening Setup...' : 'Complete Account Setup'}
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => dashboardMutation.mutate()}
                disabled={dashboardMutation.isPending}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {dashboardMutation.isPending ? 'Opening Dashboard...' : 'View Stripe Dashboard'}
              </Button>
            )}


          </div>

          {/* Capabilities Status */}
          {status?.hasStripeAccount && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 border rounded">
                  <div className={`w-2 h-2 rounded-full ${status.payoutsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className="text-sm">
                    <div className="font-medium">Payouts</div>
                    <div className="text-muted-foreground">{status.payoutsEnabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded">
                  <div className={`w-2 h-2 rounded-full ${status.chargesEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className="text-sm">
                    <div className="font-medium">Receive Payments</div>
                    <div className="text-muted-foreground">{status.chargesEnabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
  );
}