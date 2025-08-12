import { storage } from "./database-storage";
import { StripeConnectService } from './stripe-connect-service';
import Stripe from 'stripe';
import { 
  type InsertCommissionRecord, 
  type ServiceCategory, 
  type BidRequest,
  type Salesperson
} from "@shared/schema";

// Initialize Stripe for Connect service
let stripeConnectService: StripeConnectService | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    stripeConnectService = new StripeConnectService(stripe);
  }
} catch (error) {
  console.error("Failed to initialize Stripe Connect in commission service:", error);
}

export class CommissionService {
  /**
   * Calculate commission amounts based on service category
   */
  static calculateCommissionAmounts(serviceCategory: ServiceCategory): {
    salesmanAmount: number;
    overrideAmount: number;
    corpAmount: number;
    totalCommission: number;
  } {
    return {
      salesmanAmount: serviceCategory.salesmanCommission || 0,
      overrideAmount: serviceCategory.overrideCommission || 0,
      corpAmount: serviceCategory.corpCommission || 0,
      totalCommission: serviceCategory.baseCost || 0
    };
  }

  /**
   * Create commission record when bid request is sent
   * ONLY if the user arrived via verified QR/NFC code
   */
  static async createCommissionForBidRequest(
    bidRequest: BidRequest,
    salespersonId: number | null,
    overrideManagerId?: number
  ): Promise<void> {
    try {
      // ========== COMMISSION ELIGIBILITY CHECK ==========
      // Verify commission eligibility for salesperson attribution
      if (salespersonId) {
        if (!bidRequest.sessionTrackingId) {
          console.warn(`❌ COMMISSION DENIED: Salesperson ${salespersonId} attributed but no session tracking ID provided`);
          console.warn(`🚫 NO COMMISSION - Sales rep cannot receive commission without session tracking`);
          return; // Exit early - no commission will be created
        }

        if (!bidRequest.isCommissionEligible) {
          console.warn(`❌ COMMISSION DENIED: Bid request ${bidRequest.id} marked as not commission eligible`);
          console.warn(`🚫 NO COMMISSION - Sales rep attribution not eligible for commission`);
          return; // Exit early - no commission will be created
        }

        console.log(`✅ COMMISSION ELIGIBLE: Session tracking ID found (${bidRequest.sessionTrackingId}), salesperson ${salespersonId} eligible for commission`);
      } else {
        console.log(`ℹ️  No salesperson attribution - processing as general lead (no sales commission)`);
      }
      
      // Get service categories to determine commission amounts
      const serviceCategories = await storage.getAllServiceCategories();
      let totalCommissionAmount = 0;
      const serviceCommissions = [];

      // Process each requested service
      for (const requestedServiceName of bidRequest.servicesRequested) {
        console.log(`Processing commission for service: ${requestedServiceName}`);

        // Find matching service category
        let serviceCategory = serviceCategories.find(
          cat => cat.name.toLowerCase() === requestedServiceName.toLowerCase()
        );

        // If no exact match, try partial matches
        if (!serviceCategory) {
          const serviceLower = requestedServiceName.toLowerCase();
          serviceCategory = serviceCategories.find(cat => {
            const categoryName = cat.name.toLowerCase();
            return categoryName.includes(serviceLower) || serviceLower.includes(categoryName.split('&')[0].trim());
          });
        }

        if (!serviceCategory) {
          console.warn(`No commission rates found for service: ${requestedServiceName}`);
          continue;
        }

        const commissionAmounts = this.calculateCommissionAmounts(serviceCategory);
        totalCommissionAmount += commissionAmounts.totalCommission;
        
        serviceCommissions.push({
          serviceName: requestedServiceName,
          category: serviceCategory,
          commission: commissionAmounts.totalCommission
        });

        console.log(`Service: ${requestedServiceName}, Commission: $${commissionAmounts.totalCommission}`);

        // Create commission record for this service
        const commissionRecord: InsertCommissionRecord = {
          bidRequestId: bidRequest.id,
          salespersonId: salespersonId || null,
          overrideManagerId: overrideManagerId || null,
          serviceCategory: requestedServiceName,
          totalCommission: commissionAmounts.totalCommission,
          salesmanAmount: salespersonId ? commissionAmounts.salesmanAmount : 0, // No salesperson = $0
          overrideAmount: commissionAmounts.overrideAmount,
          corpAmount: salespersonId ? commissionAmounts.corpAmount : commissionAmounts.totalCommission, // If no salesperson, all goes to corp
          status: 'pending',
          paymentStatus: 'unpaid'
        };

        const createdRecord = await storage.createCommissionRecord(commissionRecord);
        await this.processCommissionPayment(createdRecord.id);
      }

      console.log(`Total commission for ${serviceCommissions.length} services: $${totalCommissionAmount}`);

      // If no salesperson, log that all commission goes to corporate
      if (!salespersonId) {
        console.log(`🏢 No salesperson - entire commission ($${totalCommissionAmount}) assigned to corporate`);
      } else {
        // Update salesperson commission total
        const salesperson = await storage.getSalesperson(salespersonId!);
        if (salesperson) {
          const salesCommissionTotal = serviceCommissions.reduce((sum, sc) => {
            const commissionAmounts = this.calculateCommissionAmounts(sc.category);
            return sum + commissionAmounts.salesmanAmount;
          }, 0);
          
          await storage.updateSalesperson(salespersonId!, {
            commissions: (salesperson.commissions || 0) + salesCommissionTotal
          });
        }
      }
    } catch (error) {
      console.error('Error creating commission:', error);
    }
  }

  /**
   * Process commission payment immediately
   */
  static async processCommissionPayment(commissionRecordId: number): Promise<void> {
    try {
      const commissionRecord = await storage.getCommissionRecord(commissionRecordId);
      if (!commissionRecord) return;

      // Mark commission as paid
      await storage.updateCommissionRecordPayment(
        commissionRecordId,
        'paid',
        new Date()
      );

      // Create payment records for each recipient
      const recipients = [];

      // Add salesperson payment only if there's a salesperson and amount > 0
      if (commissionRecord.salespersonId && commissionRecord.salesmanAmount > 0) {
        recipients.push({
          recipientId: commissionRecord.salespersonId,
          recipientType: 'salesperson',
          amount: commissionRecord.salesmanAmount
        });
      }

      // Add override manager if exists
      if (commissionRecord.overrideManagerId && commissionRecord.overrideAmount > 0) {
        recipients.push({
          recipientId: commissionRecord.overrideManagerId,
          recipientType: 'override',
          amount: commissionRecord.overrideAmount
        });
      }

      // Add corp payment (admin gets corp commission)
      const adminUsers = await storage.getUsersByRole('admin');
      if (adminUsers.length > 0 && commissionRecord.corpAmount > 0) {
        recipients.push({
          recipientId: adminUsers[0].id,
          recipientType: 'corp',
          amount: commissionRecord.corpAmount
        });
      }

      // Create payment records
      for (const recipient of recipients) {
        await storage.createCommissionPayment({
          recipientId: recipient.recipientId,
          recipientType: recipient.recipientType,
          totalAmount: recipient.amount,
          commissionRecordIds: [commissionRecordId],
          paymentMethod: 'system',
          status: 'completed',
          scheduledDate: new Date()
        });
      }

      console.log(`Commission payment processed for record ${commissionRecordId}`);
    } catch (error) {
      console.error('Error processing commission payment:', error);
    }
  }

  /**
   * Process commission payment using Stripe Connect for automatic splitting
   */
  static async processStripeConnectCommissionPayment(
    contractorId: number,
    salespersonId: number,
    totalAmount: number,
    description: string
  ): Promise<{ success: boolean; paymentIntentId?: string }> {
    try {
      if (!stripeConnectService) {
        console.error('Stripe Connect service not initialized');
        return { success: false };
      }

      // Check if salesperson has Stripe Connect account set up
      const salesperson = await storage.getSalesperson(salespersonId);
      if (!salesperson || !salesperson.stripeAccountId || !salesperson.stripeChargesEnabled) {
        console.error(`Salesperson ${salespersonId} not set up for Stripe Connect payments`);
        return { success: false };
      }

      // Convert dollars to cents for Stripe
      const amountInCents = Math.round(totalAmount * 100);

      // Create split payment using Stripe Connect
      const result = await stripeConnectService.createSplitPayment(
        contractorId,
        salespersonId,
        amountInCents,
        description
      );

      if (result.success) {
        console.log(`✅ Stripe Connect commission payment successful: ${result.paymentIntent.id}`);
        console.log(`   → Total: $${totalAmount}`);
        console.log(`   → Salesperson (50%): $${totalAmount * 0.50}`);
        console.log(`   → Platform (50%): $${totalAmount * 0.50}`);
        
        return { 
          success: true, 
          paymentIntentId: result.paymentIntent.id 
        };
      } else {
        console.error('❌ Stripe Connect commission payment failed');
        return { success: false };
      }
    } catch (error) {
      console.error('Error processing Stripe Connect commission payment:', error);
      return { success: false };
    }
  }

  /**
   * Get enhanced commission summary for a salesperson with Stripe analytics
   */
  static async getSalespersonCommissionSummary(
    salespersonId: number,
    startDate?: Date,
    endDate?: Date
  ) {
    const summary = await storage.getCommissionSummaryBySalesperson(
      salespersonId,
      startDate,
      endDate
    );

    const records = await storage.getCommissionRecordsBySalesperson(salespersonId);
    const recentRecords = startDate && endDate 
      ? records.filter(r => {
          const recordDate = new Date(r.createdAt || new Date());
          return recordDate >= startDate && recordDate <= endDate;
        })
      : records.slice(0, 10); // Last 10 records

    // Calculate Stripe payment analytics
    const paidRecords = records.filter(r => r.paymentStatus === 'paid' && r.paidAt);
    const unpaidRecords = records.filter(r => r.paymentStatus === 'unpaid');
    const pendingRecords = records.filter(r => r.paymentStatus === 'pending');

    // Calculate payment timing analytics
    const paymentTimings = paidRecords.map(r => {
      if (r.createdAt && r.paidAt) {
        const created = new Date(r.createdAt);
        const paid = new Date(r.paidAt);
        return Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // days
      }
      return 0;
    }).filter(days => days >= 0);

    const averagePaymentTime = paymentTimings.length > 0 
      ? Math.round(paymentTimings.reduce((sum, days) => sum + days, 0) / paymentTimings.length)
      : 0;

    // Calculate monthly payment trends
    const monthlyPayments = new Map<string, {amount: number, count: number}>();
    paidRecords.forEach(r => {
      if (r.paidAt) {
        const monthKey = new Date(r.paidAt).toISOString().substr(0, 7); // YYYY-MM
        const existing = monthlyPayments.get(monthKey) || {amount: 0, count: 0};
        monthlyPayments.set(monthKey, {
          amount: existing.amount + (r.salesmanAmount || 0),
          count: existing.count + 1
        });
      }
    });

    // Convert to array sorted by month
    const paymentTrends = Array.from(monthlyPayments.entries())
      .map(([month, data]) => ({month, ...data}))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    return {
      ...summary,
      recentCommissions: recentRecords,
      stripeAnalytics: {
        totalPaidPayments: paidRecords.length,
        totalUnpaidPayments: unpaidRecords.length,
        totalPendingPayments: pendingRecords.length,
        averagePaymentTimeInDays: averagePaymentTime,
        successfulPaymentRate: records.length > 0 ? ((paidRecords.length / records.length) * 100).toFixed(1) : '0.0',
        paymentTrends,
        lastPaymentDate: paidRecords.length > 0 
          ? Math.max(...paidRecords.map(r => new Date(r.paidAt!).getTime()))
          : null,
        totalEarnedThisMonth: (() => {
          const thisMonth = new Date().toISOString().substr(0, 7);
          const thisMonthData = monthlyPayments.get(thisMonth);
          return thisMonthData?.amount || 0;
        })()
      }
    };
  }

  /**
   * Create manual commission adjustment
   */
  static async createCommissionAdjustment(
    commissionRecordId: number,
    adjustedBy: number,
    newAmount: number,
    reason: string,
    notes?: string
  ): Promise<void> {
    try {
      const commissionRecord = await storage.getCommissionRecord(commissionRecordId);
      if (!commissionRecord) {
        throw new Error('Commission record not found');
      }

      const previousAmount = commissionRecord.salesmanAmount;
      const adjustmentAmount = newAmount - previousAmount;

      // Create adjustment record
      await storage.createCommissionAdjustment({
        commissionRecordId,
        adjustedBy,
        previousAmount,
        newAmount,
        adjustmentAmount,
        reason,
        notes
      });

      // Update commission record
      await storage.updateCommissionRecordStatus(commissionRecordId, 'adjusted');

      console.log(`Commission adjustment created: ${adjustmentAmount > 0 ? '+' : ''}$${adjustmentAmount}`);
    } catch (error) {
      console.error('Error creating commission adjustment:', error);
      throw error;
    }
  }

  /**
   * Get commission analytics for admin dashboard
   */
  static async getCommissionAnalytics(startDate?: Date, endDate?: Date) {
    const analytics = await storage.getCommissionAnalytics(startDate, endDate);
    const topEarners = await storage.getTopEarnersBySalesperson(10, startDate, endDate);

    return {
      ...analytics,
      topEarners
    };
  }
}