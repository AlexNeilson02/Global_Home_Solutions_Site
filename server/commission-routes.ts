import { Router, Request, Response } from "express";
import { storage } from "./database-storage";
import { CommissionService } from "./commission-service";
import { isAuthenticated, requireRole } from "./auth";
import { z } from "zod";

export const commissionRouter = Router();

// Get commission records for a salesperson
commissionRouter.get('/salesperson/:id/commissions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const salespersonId = parseInt(req.params.id);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const summary = await CommissionService.getSalespersonCommissionSummary(
      salespersonId,
      startDate,
      endDate
    );

    res.json(summary);
  } catch (error) {
    console.error('Error fetching salesperson commissions:', error);
    res.status(500).json({ error: 'Failed to fetch commission data' });
  }
});

// Get commission analytics for admin
commissionRouter.get('/analytics', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const analytics = await CommissionService.getCommissionAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching commission analytics:', error);
    res.status(500).json({ error: 'Failed to fetch commission analytics' });
  }
});

// Get commission records with filtering
commissionRouter.get('/records', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { salespersonId, startDate, endDate, status, paymentStatus } = req.query;
    
    let records;
    
    if (salespersonId) {
      records = await storage.getCommissionRecordsBySalesperson(parseInt(salespersonId as string));
    } else if (startDate && endDate) {
      records = await storage.getCommissionRecordsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      // For admin, get recent records
      const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      records = await storage.getCommissionRecordsByDateRange(recentDate, new Date());
    }

    // Apply additional filters
    if (status) {
      records = records.filter(r => r.status === status);
    }
    if (paymentStatus) {
      records = records.filter(r => r.paymentStatus === paymentStatus);
    }

    // Get additional details for each record
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const salesperson = await storage.getSalesperson(record.salespersonId);
        const user = salesperson ? await storage.getUser(salesperson.userId) : null;
        const bidRequest = await storage.getBidRequest(record.bidRequestId);
        
        return {
          ...record,
          salespersonName: user?.fullName || 'Unknown',
          bidRequestDetails: bidRequest ? {
            fullName: bidRequest.fullName,
            email: bidRequest.email,
            serviceRequested: bidRequest.serviceRequested
          } : null
        };
      })
    );

    res.json({ records: enrichedRecords });
  } catch (error) {
    console.error('Error fetching commission records:', error);
    res.status(500).json({ error: 'Failed to fetch commission records' });
  }
});

// Create manual commission adjustment
const adjustmentSchema = z.object({
  commissionRecordId: z.number(),
  newAmount: z.number().min(0),
  reason: z.string().min(1),
  notes: z.string().optional()
});

commissionRouter.post('/adjustments', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const validatedData = adjustmentSchema.parse(req.body);
    const userId = (req as any).user?.id;

    await CommissionService.createCommissionAdjustment(
      validatedData.commissionRecordId,
      userId,
      validatedData.newAmount,
      validatedData.reason,
      validatedData.notes
    );

    res.json({ success: true, message: 'Commission adjustment created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error creating commission adjustment:', error);
    res.status(500).json({ error: 'Failed to create commission adjustment' });
  }
});

// Get commission payments for a user
commissionRouter.get('/payments/:userId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const payments = await storage.getCommissionPaymentsByRecipient(userId);
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching commission payments:', error);
    res.status(500).json({ error: 'Failed to fetch commission payments' });
  }
});

// Manual payment processing (admin only)
commissionRouter.post('/payments/:paymentId/process', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    await storage.updateCommissionPaymentStatus(paymentId, 'completed');
    res.json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get top earners
commissionRouter.get('/top-earners', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const topEarners = await storage.getTopEarnersBySalesperson(limit, startDate, endDate);
    res.json({ topEarners });
  } catch (error) {
    console.error('Error fetching top earners:', error);
    res.status(500).json({ error: 'Failed to fetch top earners' });
  }
});

// Get commission rates for all services
commissionRouter.get('/rates', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const serviceCategories = await storage.getAllServiceCategories();
    const rates = serviceCategories.map(category => ({
      id: category.id,
      service: category.name,
      baseCost: category.baseCost || 0,
      salesmanCommission: category.salesmanCommission || 0,
      overrideCommission: category.overrideCommission || 0,
      corpCommission: category.corpCommission || 0
    }));
    
    res.json({ rates });
  } catch (error) {
    console.error('Error fetching commission rates:', error);
    res.status(500).json({ error: 'Failed to fetch commission rates' });
  }
});

// Update commission rates (admin only)
const rateUpdateSchema = z.object({
  serviceId: z.number(),
  baseCost: z.number().min(0),
  salesmanCommission: z.number().min(0),
  overrideCommission: z.number().min(0),
  corpCommission: z.number().min(0)
});

commissionRouter.put('/rates', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const validatedData = rateUpdateSchema.parse(req.body);
    
    await storage.updateServiceCategory(validatedData.serviceId, {
      baseCost: validatedData.baseCost,
      salesmanCommission: validatedData.salesmanCommission,
      overrideCommission: validatedData.overrideCommission,
      corpCommission: validatedData.corpCommission
    });
    
    res.json({ success: true, message: 'Commission rates updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error updating commission rates:', error);
    res.status(500).json({ error: 'Failed to update commission rates' });
  }
});