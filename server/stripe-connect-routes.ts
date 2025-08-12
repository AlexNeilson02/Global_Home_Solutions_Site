import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';
import { StripeConnectService } from './stripe-connect-service';
import { isAuthenticated, requireRole } from './auth';
import { z } from 'zod';

const stripeConnectRouter = Router();

// Initialize Stripe
let stripe: Stripe | null = null;
let stripeConnectService: StripeConnectService | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    stripeConnectService = new StripeConnectService(stripe);
  } else {
    console.log("STRIPE_SECRET_KEY not found - Stripe Connect features will not work");
  }
} catch (error) {
  console.error("Failed to initialize Stripe Connect:", error);
}

// Create Stripe Connect account for salesperson
stripeConnectRouter.post('/accounts/create', isAuthenticated, requireRole(['admin', 'salesperson']), async (req: Request, res: Response) => {
  try {
    if (!stripeConnectService) {
      return res.status(500).json({ error: 'Stripe Connect not configured' });
    }

    const user = (req as any).user;
    const salesperson = await storage.getSalespersonByUserId(user.id);
    
    if (!salesperson) {
      return res.status(404).json({ error: 'Salesperson profile not found' });
    }

    if (salesperson.stripeAccountId) {
      return res.status(400).json({ error: 'Stripe account already exists' });
    }

    const accountId = await stripeConnectService.createConnectAccount(salesperson.id, user.email);
    
    res.json({ 
      success: true, 
      accountId,
      message: 'Stripe Connect account created successfully' 
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({ error: 'Failed to create Stripe Connect account' });
  }
});

// Get onboarding link for salesperson
stripeConnectRouter.post('/accounts/onboarding', isAuthenticated, requireRole(['admin', 'salesperson']), async (req: Request, res: Response) => {
  try {
    if (!stripeConnectService) {
      return res.status(500).json({ error: 'Stripe Connect not configured' });
    }

    const user = (req as any).user;
    const salesperson = await storage.getSalespersonByUserId(user.id);
    
    if (!salesperson) {
      return res.status(404).json({ error: 'Salesperson profile not found' });
    }

    if (!salesperson.stripeAccountId) {
      return res.status(400).json({ error: 'No Stripe account found. Create account first.' });
    }

    // Use production domain for redirect links
    const origin = process.env.NODE_ENV === 'production' 
      ? 'https://global-home-solutions.com'
      : (req.headers.origin || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`);
    
    const refreshUrl = `${origin}/sales-portal?stripe_onboarding=refresh`;
    const returnUrl = `${origin}/sales-portal?stripe_onboarding=complete`;

    const onboardingUrl = await stripeConnectService.createOnboardingLink(
      salesperson.id,
      refreshUrl,
      returnUrl
    );
    
    res.json({ 
      success: true, 
      url: onboardingUrl,
      message: 'Onboarding link created successfully' 
    });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    res.status(500).json({ error: 'Failed to create onboarding link' });
  }
});

// Get salesperson account status
stripeConnectRouter.get('/accounts/status', isAuthenticated, requireRole(['admin', 'salesperson']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const salesperson = await storage.getSalespersonByUserId(user.id);
    
    if (!salesperson) {
      return res.status(404).json({ error: 'Salesperson profile not found' });
    }

    res.json({
      hasStripeAccount: !!salesperson.stripeAccountId,
      stripeAccountId: salesperson.stripeAccountId,
      accountStatus: salesperson.stripeAccountStatus,
      onboardingComplete: salesperson.stripeOnboardingComplete,
      payoutsEnabled: salesperson.stripePayoutsEnabled,
      chargesEnabled: salesperson.stripeChargesEnabled,
    });
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({ error: 'Failed to get account status' });
  }
});

// Force update account status (for debugging)
stripeConnectRouter.post('/accounts/force-update', isAuthenticated, requireRole(['admin', 'salesperson']), async (req: Request, res: Response) => {
  try {
    if (!stripeConnectService) {
      return res.status(500).json({ error: 'Stripe Connect not configured' });
    }

    const user = (req as any).user;
    const salesperson = await storage.getSalespersonByUserId(user.id);
    
    if (!salesperson) {
      return res.status(404).json({ error: 'Salesperson profile not found' });
    }

    if (!salesperson.stripeAccountId) {
      return res.status(400).json({ error: 'No Stripe account found' });
    }

    // Force update the account status
    await stripeConnectService.updateAccountStatus(salesperson.stripeAccountId);
    
    // Get updated salesperson data
    const updatedSalesperson = await storage.getSalesperson(salesperson.id);
    
    res.json({ 
      success: true, 
      message: 'Account status updated',
      status: {
        accountStatus: updatedSalesperson?.stripeAccountStatus,
        onboardingComplete: updatedSalesperson?.stripeOnboardingComplete,
        payoutsEnabled: updatedSalesperson?.stripePayoutsEnabled,
        chargesEnabled: updatedSalesperson?.stripeChargesEnabled,
      }
    });
  } catch (error) {
    console.error('Error forcing account status update:', error);
    res.status(500).json({ error: 'Failed to update account status' });
  }
});

// Get Stripe dashboard link
stripeConnectRouter.post('/accounts/dashboard', isAuthenticated, requireRole(['admin', 'salesperson']), async (req: Request, res: Response) => {
  try {
    if (!stripeConnectService) {
      return res.status(500).json({ error: 'Stripe Connect not configured' });
    }

    const user = (req as any).user;
    const salesperson = await storage.getSalespersonByUserId(user.id);
    
    if (!salesperson) {
      return res.status(404).json({ error: 'Salesperson profile not found' });
    }

    if (!salesperson.stripeAccountId || !salesperson.stripeOnboardingComplete) {
      return res.status(400).json({ error: 'Stripe account not ready. Complete onboarding first.' });
    }

    const dashboardUrl = await stripeConnectService.createDashboardLink(salesperson.id);
    
    res.json({ 
      success: true, 
      url: dashboardUrl,
      message: 'Dashboard link created successfully' 
    });
  } catch (error) {
    console.error('Error creating dashboard link:', error);
    res.status(500).json({ error: 'Failed to create dashboard link' });
  }
});

// Admin: Process commission payment with Stripe Connect splitting
const commissionPaymentSchema = z.object({
  contractorId: z.number(),
  salespersonId: z.number(),
  amount: z.number().positive(),
  description: z.string(),
});

stripeConnectRouter.post('/payments/commission', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    if (!stripeConnectService) {
      return res.status(500).json({ error: 'Stripe Connect not configured' });
    }

    const validatedData = commissionPaymentSchema.parse(req.body);
    const { contractorId, salespersonId, amount, description } = validatedData;

    // Convert dollars to cents
    const amountInCents = Math.round(amount * 100);

    const result = await stripeConnectService.createSplitPayment(
      contractorId,
      salespersonId,
      amountInCents,
      description
    );

    if (result.success) {
      res.json({
        success: true,
        paymentIntentId: result.paymentIntent.id,
        message: 'Commission payment processed successfully',
        splitDetails: {
          totalAmount: amount,
          salespersonAmount: amount * 0.50,
          platformAmount: amount * 0.50,
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment processing failed',
        details: result.paymentIntent.last_payment_error?.message
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error processing commission payment:', error);
    res.status(500).json({ error: 'Failed to process commission payment' });
  }
});

// Stripe Connect webhook handler
stripeConnectRouter.post('/webhook', async (req: Request, res: Response) => {
  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body length:', req.body ? req.body.length : 'null');
  
  try {
    if (!stripe) {
      console.error('Stripe not configured for webhook');
      return res.status(500).send("Stripe not configured");
    }

    const sig = req.headers['stripe-signature'];
    console.log('Stripe signature present:', !!sig);
    
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_CONNECT_WEBHOOK_SECRET || "");
      console.log('Webhook signature verified successfully');
      console.log('Event type:', event.type);
      console.log('Event ID:', event.id);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Handle Stripe Connect account events
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        console.log(`Processing account.updated for account: ${account.id}`);
        console.log('Account details_submitted:', account.details_submitted);
        console.log('Account charges_enabled:', account.charges_enabled);
        console.log('Account payouts_enabled:', account.payouts_enabled);
        
        if (stripeConnectService) {
          await stripeConnectService.updateAccountStatus(account.id);
        }
        console.log(`Stripe Connect account updated: ${account.id}`);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.metadata?.charge_type === 'commission_split') {
          console.log(`Commission split payment succeeded: ${paymentIntent.id}`);
          // The payment is automatically split by Stripe - no additional processing needed
        }
        break;

      case 'transfer.created':
        const transfer = event.data.object as Stripe.Transfer;
        console.log(`Transfer created to Connect account: ${transfer.id}`);
        break;

      default:
        console.log(`Unhandled Stripe Connect event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe Connect webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default stripeConnectRouter;