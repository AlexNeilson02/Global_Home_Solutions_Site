import Stripe from 'stripe';
import { storage } from './storage';

export class StripeConnectService {
  private stripe: Stripe;

  constructor(stripe: Stripe) {
    this.stripe = stripe;
  }

  /**
   * Create a Stripe Connect account for a salesperson
   */
  async createConnectAccount(salespersonId: number, userEmail: string): Promise<string> {
    try {
      const salesperson = await storage.getSalesperson(salespersonId);
      if (!salesperson) {
        throw new Error('Salesperson not found');
      }

      // Create Stripe Connect account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: userEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          salesperson_id: salespersonId.toString(),
        },
      });

      // Update salesperson record with Stripe account info
      await storage.updateSalesperson(salespersonId, {
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending',
        stripeOnboardingComplete: false,
      });

      console.log(`Created Stripe Connect account ${account.id} for salesperson ${salespersonId}`);
      return account.id;
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw error;
    }
  }

  /**
   * Create onboarding link for salesperson to complete Stripe Connect setup
   */
  async createOnboardingLink(salespersonId: number, refreshUrl: string, returnUrl: string): Promise<string> {
    try {
      const salesperson = await storage.getSalesperson(salespersonId);
      if (!salesperson || !salesperson.stripeAccountId) {
        throw new Error('Salesperson or Stripe account not found');
      }

      const accountLink = await this.stripe.accountLinks.create({
        account: salesperson.stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw error;
    }
  }

  /**
   * Update salesperson account status based on Stripe account status
   */
  async updateAccountStatus(stripeAccountId: string): Promise<void> {
    try {
      const account = await this.stripe.accounts.retrieve(stripeAccountId);
      const salesperson = await storage.getSalespersonByStripeAccountId(stripeAccountId);
      
      if (!salesperson) {
        console.error('Salesperson not found for Stripe account:', stripeAccountId);
        return;
      }

      const isOnboardingComplete = account.details_submitted && 
                                   account.charges_enabled && 
                                   account.payouts_enabled;

      await storage.updateSalesperson(salesperson.id, {
        stripeAccountStatus: account.charges_enabled ? 'complete' : 'pending',
        stripeOnboardingComplete: isOnboardingComplete,
        stripePayoutsEnabled: account.payouts_enabled || false,
        stripeChargesEnabled: account.charges_enabled || false,
      });

      console.log(`Updated account status for salesperson ${salesperson.id}: ${account.charges_enabled ? 'complete' : 'pending'}`);
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  }

  /**
   * Create payment intent with automatic splitting to salesperson via Stripe Connect
   */
  async createSplitPayment(
    contractorId: number,
    salespersonId: number,
    totalAmount: number,
    description: string
  ): Promise<{ paymentIntent: Stripe.PaymentIntent; success: boolean }> {
    try {
      const contractor = await storage.getContractor(contractorId);
      const salesperson = await storage.getSalesperson(salespersonId);

      if (!contractor || !contractor.stripeCustomerId || !contractor.paymentMethodId) {
        throw new Error(`Contractor ${contractorId} missing Stripe details`);
      }

      if (!salesperson || !salesperson.stripeAccountId || !salesperson.stripeChargesEnabled) {
        throw new Error(`Salesperson ${salespersonId} not set up for receiving payments`);
      }

      // Calculate split amounts (50/50 split)
      const salespersonAmount = Math.round(totalAmount * 0.50);
      const platformAmount = totalAmount - salespersonAmount;

      console.log(`Creating split payment: Total $${totalAmount/100}, Salesperson $${salespersonAmount/100}, Platform $${platformAmount/100}`);

      // Create payment intent with destination charges (money goes to salesperson, platform takes application fee)
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        customer: contractor.stripeCustomerId,
        payment_method: contractor.paymentMethodId,
        confirm: true,
        off_session: true,
        description: `Commission charge: ${description}`,
        transfer_data: {
          destination: salesperson.stripeAccountId,
          amount: salespersonAmount,
        },
        application_fee_amount: platformAmount,
        metadata: {
          contractor_id: contractorId.toString(),
          salesperson_id: salespersonId.toString(),
          charge_type: 'commission_split',
          salesperson_amount: (salespersonAmount / 100).toString(),
          platform_amount: (platformAmount / 100).toString(),
        },
      });

      if (paymentIntent.status === 'succeeded') {
        console.log(`✅ Split payment successful: ${paymentIntent.id}`);
        console.log(`   → Salesperson receives: $${salespersonAmount/100}`);
        console.log(`   → Platform receives: $${platformAmount/100}`);
        
        return { paymentIntent, success: true };
      } else {
        console.error(`❌ Split payment failed: ${paymentIntent.status}`);
        return { paymentIntent, success: false };
      }
    } catch (error) {
      console.error('Error creating split payment:', error);
      throw error;
    }
  }

  /**
   * Get dashboard link for salesperson to view their Stripe Connect dashboard
   */
  async createDashboardLink(salespersonId: number): Promise<string> {
    try {
      const salesperson = await storage.getSalesperson(salespersonId);
      if (!salesperson || !salesperson.stripeAccountId) {
        throw new Error('Salesperson or Stripe account not found');
      }

      const loginLink = await this.stripe.accounts.createLoginLink(salesperson.stripeAccountId);
      return loginLink.url;
    } catch (error) {
      console.error('Error creating dashboard link:', error);
      throw error;
    }
  }
}