import { storage } from "./database-storage";
import { 
  type InsertCommissionRecord, 
  type ServiceCategory, 
  type BidRequest,
  type Salesperson
} from "@shared/schema";

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
   */
  static async createCommissionForBidRequest(
    bidRequest: BidRequest,
    salespersonId: number | null,
    overrideManagerId?: number
  ): Promise<void> {
    try {
      // Get service category to determine commission amounts
      const serviceCategories = await storage.getAllServiceCategories();
      
      // First try exact match
      let serviceCategory = serviceCategories.find(
        cat => cat.name.toLowerCase() === bidRequest.serviceRequested.toLowerCase()
      );

      // If no exact match, try partial matches for common variations
      if (!serviceCategory) {
        const requestedService = bidRequest.serviceRequested.toLowerCase();
        serviceCategory = serviceCategories.find(cat => {
          const categoryName = cat.name.toLowerCase();
          // Check if the requested service is contained in the category name or vice versa
          return categoryName.includes(requestedService) || requestedService.includes(categoryName.split('&')[0].trim());
        });
      }

      // If still no match, try keyword matching for common service types
      if (!serviceCategory) {
        const requestedService = bidRequest.serviceRequested.toLowerCase();
        const serviceKeywords = {
          'flooring': ['flooring & hardwood', 'epoxy flooring'],
          'electrical': ['electrical'],
          'plumbing': ['plumbing'],
          'roofing': ['roofing'],
          'painting': ['painting interior & exterior'],
          'hvac': ['heating & cooling', 'hvac'],
          'kitchen': ['kitchen remodeling'],
          'bathroom': ['reglazing (bath & countertop)', 'walk-in tubs'],
          'concrete': ['concrete patio/drive walk', 'concrete polishing'],
          'pool': ['swimming pools', 'pool service'],
          'handyman': ['handyman', 'handy man service'],
          'windows': ['windows & doors', 'window and door install'],
          'siding': ['siding'],
          'fence': ['fencing', 'block wall/ fence'],
          'landscaping': ['landscaping', 'landscape design'],
          'solar': ['solar'],
          'foundation': ['foundation repair']
        };

        for (const [keyword, categories] of Object.entries(serviceKeywords)) {
          if (requestedService.includes(keyword)) {
            serviceCategory = serviceCategories.find(cat => 
              categories.some(catName => cat.name.toLowerCase().includes(catName))
            );
            if (serviceCategory) break;
          }
        }
      }

      if (!serviceCategory) {
        console.warn(`No commission rates found for service: ${bidRequest.serviceRequested}. Available categories:`, 
          serviceCategories.map(cat => cat.name).join(', '));
        return;
      }

      console.log(`Matched service "${bidRequest.serviceRequested}" to category "${serviceCategory.name}"`)

      const commissionAmounts = this.calculateCommissionAmounts(serviceCategory);

      // Commission rule: If no salesperson reference, assign commission to admin
      let effectiveRecipientId = salespersonId;
      let isAdminCommission = false;
      
      if (!salespersonId) {
        // Find admin user
        const allUsers = await storage.getAllUsers();
        const adminUser = allUsers.find(user => user.role === 'admin');
        if (adminUser) {
          effectiveRecipientId = adminUser.id;
          isAdminCommission = true;
          console.log(`No salesperson reference - assigning commission to admin (ID: ${adminUser.id})`);
        }
      }

      // Create commission record (only if we have a valid recipient)
      if (!effectiveRecipientId) {
        console.log('No valid recipient found for commission - skipping commission creation');
        return;
      }

      const commissionRecord: InsertCommissionRecord = {
        bidRequestId: bidRequest.id,
        salespersonId: effectiveRecipientId,
        overrideManagerId: overrideManagerId || null,
        serviceCategory: bidRequest.serviceRequested,
        totalCommission: commissionAmounts.totalCommission,
        salesmanAmount: commissionAmounts.salesmanAmount,
        overrideAmount: commissionAmounts.overrideAmount,
        corpAmount: commissionAmounts.corpAmount,
        status: 'pending',
        paymentStatus: 'unpaid'
      };

      const createdRecord = await storage.createCommissionRecord(commissionRecord);

      // Update commission totals - either for salesperson or admin
      if (isAdminCommission) {
        // For admin, we could track this separately or just log it
        console.log(`Admin commission earned: $${commissionAmounts.salesmanAmount} from unattributed lead`);
      } else {
        // Update salesperson commission total
        const salesperson = await storage.getSalesperson(effectiveRecipientId);
        if (salesperson) {
          await storage.updateSalesperson(effectiveRecipientId, {
            commissions: (salesperson.commissions || 0) + commissionAmounts.salesmanAmount
          });
        }
      }

      // Process immediate payment (since your requirement is immediate payout)
      await this.processCommissionPayment(createdRecord.id);

      console.log(`Commission created for bid request ${bidRequest.id}: $${commissionAmounts.salesmanAmount} to salesperson`);
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
      const recipients = [
        {
          recipientId: commissionRecord.salespersonId,
          recipientType: 'salesperson',
          amount: commissionRecord.salesmanAmount
        }
      ];

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
   * Get commission summary for a salesperson
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

    return {
      ...summary,
      recentCommissions: recentRecords
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