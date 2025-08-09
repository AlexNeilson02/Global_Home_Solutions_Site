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
   * Create commission record for every bid request
   * Commission attribution depends on QR/NFC verification
   */
  static async createCommissionForBidRequest(
    bidRequest: BidRequest,
    salespersonId: number | null,
    overrideManagerId?: number
  ): Promise<void> {
    try {
      // ========== COMMISSION ELIGIBILITY CHECK ==========
      let isEligibleForSalesCommission = false;
      
      // If salesperson is attributed, they get commission
      if (salespersonId) {
        isEligibleForSalesCommission = true;
        console.log(`✅ SALES COMMISSION ELIGIBLE: Salesperson ${salespersonId} attributed to bid request ${bidRequest.id}`);
      } else {
        console.log(`ℹ️  No salesperson attribution - processing as general lead (corporate commission only)`);
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
          // Only pay salesperson if they have verified QR/NFC attribution
          salesmanAmount: isEligibleForSalesCommission ? commissionAmounts.salesmanAmount : 0,
          overrideAmount: commissionAmounts.overrideAmount,
          // If no eligible salesperson, all their portion goes to corp
          corpAmount: isEligibleForSalesCommission ? commissionAmounts.corpAmount : (commissionAmounts.corpAmount + commissionAmounts.salesmanAmount),
          status: 'pending',
          paymentStatus: 'unpaid'
        };

        const createdRecord = await storage.createCommissionRecord(commissionRecord);
        await this.processCommissionPayment(createdRecord.id);
      }

      console.log(`Total commission for ${serviceCommissions.length} services: $${totalCommissionAmount}`);

      // Update salesperson commission total only if eligible for sales commission
      if (isEligibleForSalesCommission && salespersonId) {
        const salesperson = await storage.getSalesperson(salespersonId!);
        if (salesperson) {
          const salesCommissionTotal = serviceCommissions.reduce((sum, sc) => {
            const commissionAmounts = this.calculateCommissionAmounts(sc.category);
            return sum + commissionAmounts.salesmanAmount;
          }, 0);
          
          await storage.updateSalesperson(salespersonId!, {
            commissions: (salesperson.commissions || 0) + salesCommissionTotal
          });
          
          console.log(`💰 Salesperson ${salespersonId} earned $${salesCommissionTotal} commission from lead attribution`);
        }
      } else {
        console.log(`🏢 No salesperson - entire commission ($${totalCommissionAmount}) assigned to corporate`);
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