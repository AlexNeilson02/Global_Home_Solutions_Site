import { Router, Request, Response } from "express";
import { storage } from "./database-storage";
import { isAuthenticated, requireRole } from "./auth";
import { z } from "zod";
import { insertRefundRequestSchema } from "@shared/schema";
import { StripeConnectService } from "./stripe-connect-service";
import Stripe from "stripe";

export const refundRouter = Router();

// Initialize Stripe Connect service if configured
let stripeConnectService: StripeConnectService | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil'
  });
  stripeConnectService = new StripeConnectService(stripe);
}

// Validation schemas
const createRefundRequestSchema = insertRefundRequestSchema.omit({
  refundDate: true,
}).extend({
  reason: z.string().min(1, "Reason is required"),
  amount: z.number().positive("Amount must be positive"),
  bidRequestId: z.union([z.number(), z.string(), z.null()]).optional().transform(val => {
    if (!val || val === '' || val === 'not_listed') return null;
    if (typeof val === 'number') return val;
    const parsed = parseInt(val.toString());
    return isNaN(parsed) ? null : parsed;
  }),
  refundDate: z.union([z.string(), z.date(), z.null()]).optional().transform(val => {
    if (!val || val === '') return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }),
});

const reviewRefundSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
  bidRequestId: z.string().nullable().optional().transform(val => {
    if (!val || val === '' || val === 'not_listed') return null;
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
  }),
});

// Get refund requests for a contractor
refundRouter.get('/contractor/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    const user = req.user as any;

    // Check if user is the contractor or an admin
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    if (user.role !== 'admin' && contractor.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden - Can only view your own refund requests" });
    }

    const refundRequests = await storage.getRefundRequestsByContractorId(contractorId);
    res.json({ refundRequests });
  } catch (error) {
    console.error('Error fetching contractor refund requests:', error);
    res.status(500).json({ error: 'Failed to fetch refund requests' });
  }
});

// Get all pending refund requests (admin only)
refundRouter.get('/pending', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const pendingRequests = await storage.getPendingRefundRequests();
    
    // Enrich with contractor and user details
    const enrichedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const contractor = await storage.getContractor(request.contractorId);
        const requestedByUser = await storage.getUser(request.requestedBy);
        
        return {
          ...request,
          contractor: contractor ? {
            id: contractor.id,
            companyName: contractor.companyName,
            userId: contractor.userId
          } : null,
          requestedByUser: requestedByUser ? {
            id: requestedByUser.id,
            fullName: requestedByUser.fullName,
            email: requestedByUser.email
          } : null
        };
      })
    );

    res.json({ refundRequests: enrichedRequests });
  } catch (error) {
    console.error('Error fetching pending refund requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending refund requests' });
  }
});

// Get all refund requests (admin only)
refundRouter.get('/all', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { status, contractorId } = req.query;
    
    let refundRequests = await storage.getAllRefundRequests();
    
    // Apply filters
    if (status) {
      refundRequests = refundRequests.filter(r => r.status === status);
    }
    if (contractorId) {
      refundRequests = refundRequests.filter(r => r.contractorId === parseInt(contractorId as string));
    }

    // Enrich with contractor and user details
    const enrichedRequests = await Promise.all(
      refundRequests.map(async (request) => {
        const contractor = await storage.getContractor(request.contractorId);
        const requestedByUser = await storage.getUser(request.requestedBy);
        const reviewedByUser = request.reviewedBy ? await storage.getUser(request.reviewedBy) : null;
        
        return {
          ...request,
          contractor: contractor ? {
            id: contractor.id,
            companyName: contractor.companyName,
            userId: contractor.userId
          } : null,
          requestedByUser: requestedByUser ? {
            id: requestedByUser.id,
            fullName: requestedByUser.fullName,
            email: requestedByUser.email
          } : null,
          reviewedByUser: reviewedByUser ? {
            id: reviewedByUser.id,
            fullName: reviewedByUser.fullName
          } : null
        };
      })
    );

    res.json({ refundRequests: enrichedRequests });
  } catch (error) {
    console.error('Error fetching all refund requests:', error);
    res.status(500).json({ error: 'Failed to fetch refund requests' });
  }
});

// Create a new refund request
refundRouter.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const validatedData = createRefundRequestSchema.parse(req.body);
    const user = req.user as any;

    // Verify the contractor belongs to the requesting user
    const contractor = await storage.getContractor(validatedData.contractorId);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    if (contractor.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden - Can only create refund requests for your own company" });
    }

    // Create refund request 
    const refundRequest = await storage.createRefundRequest({
      ...validatedData,
      requestedBy: user.id,
      status: 'pending',
      requestedAt: new Date()
    } as any);

    res.status(201).json({ 
      message: "Refund request created successfully", 
      refundRequest 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error creating refund request:', error);
    res.status(500).json({ error: 'Failed to create refund request' });
  }
});

// Review a refund request (admin only)
refundRouter.patch('/:id/review', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const refundRequestId = parseInt(req.params.id);
    const validatedData = reviewRefundSchema.parse(req.body);
    const user = req.user as any;

    const refundRequest = await storage.getRefundRequest(refundRequestId);
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    if (refundRequest.status !== 'pending') {
      return res.status(400).json({ message: "Can only review pending refund requests" });
    }

    // Update refund request status and bid request association
    const updatedRequest = await storage.updateRefundRequestStatus(
      refundRequestId,
      validatedData.status,
      user.id,
      validatedData.reviewNotes
    );

    // Handle bid request association override by admin
    if (validatedData.bidRequestId !== undefined) {
      await storage.updateRefundRequestBidAssociation(refundRequestId, validatedData.bidRequestId);
      console.log(`Admin updated bid request association for refund ${refundRequestId} to bid request ${validatedData.bidRequestId}`);
    }

    // If approved, handle Stripe refund processing or manual refund
    if (validatedData.status === 'approved') {
      if (stripeConnectService && refundRequest.stripePaymentIntentId) {
        // Case 1: Has payment intent - process through Stripe
        try {
          console.log(`Processing Stripe refund for payment intent: ${refundRequest.stripePaymentIntentId}, amount: $${refundRequest.amount}`);
          
          // Process the refund through Stripe
          const stripeRefund = await stripeConnectService.processRefund(
            refundRequest.stripePaymentIntentId,
            Math.round(refundRequest.amount * 100), // Convert to cents
            'requested_by_customer'
          );

          console.log(`Stripe refund processed successfully:`, stripeRefund);

          // Update the refund request with Stripe refund details
          await storage.updateRefundRequestProcessing(
            refundRequestId,
            stripeRefund.id,
            new Date()
          );

          res.json({ 
            message: `Refund request approved and processed successfully through Stripe`, 
            refundRequest: updatedRequest,
            stripeRefund: {
              id: stripeRefund.id,
              amount: stripeRefund.amount / 100,
              status: stripeRefund.status
            }
          });
        } catch (stripeError: any) {
          console.error('Stripe refund processing failed:', stripeError);
          
          // Update the refund request to reflect the failure
          await storage.updateRefundRequestStatus(
            refundRequestId,
            'approved_pending_stripe',
            user.id,
            `Approved but Stripe refund failed: ${stripeError.message}`
          );

          res.json({ 
            message: `Refund request approved but Stripe processing failed: ${stripeError.message}`, 
            refundRequest: updatedRequest,
            error: stripeError.message
          });
        }
      } else {
        // Case 2: No payment intent - approve for manual processing
        console.log(`Refund request ${refundRequestId} approved for manual processing - no payment intent ID found`);
        
        // Update status to show it needs manual processing
        await storage.updateRefundRequestStatus(
          refundRequestId,
          'approved_manual',
          user.id,
          `Approved for manual refund - no payment intent found. Amount: $${refundRequest.amount}. Please process this refund manually through Stripe dashboard or other payment method.`
        );

        res.json({ 
          message: `Refund request approved for manual processing - no payment intent found. Please process $${refundRequest.amount} refund manually through Stripe dashboard.`, 
          refundRequest: updatedRequest,
          requiresManualProcessing: true
        });
      }
    } else {
      res.json({ 
        message: `Refund request ${validatedData.status} successfully`, 
        refundRequest: updatedRequest 
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error reviewing refund request:', error);
    res.status(500).json({ error: 'Failed to review refund request' });
  }
});

// Get bid requests for a contractor (for refund form dropdown)
refundRouter.get('/bid-requests/contractor/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    const user = req.user as any;

    // Check permissions - contractor or admin
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    if (user.role !== 'admin' && contractor.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden - Can only view your own bid requests" });
    }

    // Get bid requests for this contractor
    const bidRequests = await storage.getBidRequestsByContractorId(contractorId);
    
    res.json({ bidRequests });
  } catch (error) {
    console.error('Error fetching contractor bid requests:', error);
    res.status(500).json({ error: 'Failed to fetch bid requests' });
  }
});

// Get all bid requests (for admin override dropdown)
refundRouter.get('/bid-requests', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const bidRequests = await storage.getAllBidRequests();
    
    // Enrich with contractor info for better display
    const enrichedRequests = await Promise.all(
      bidRequests.map(async (bidRequest: any) => {
        const contractor = bidRequest.contractorId ? await storage.getContractor(bidRequest.contractorId) : null;
        return {
          ...bidRequest,
          contractor: contractor ? {
            id: contractor.id,
            companyName: contractor.companyName,
            userId: contractor.userId
          } : null
        };
      })
    );

    res.json({ bidRequests: enrichedRequests });
  } catch (error) {
    console.error('Error fetching all bid requests:', error);
    res.status(500).json({ error: 'Failed to fetch bid requests' });
  }
});

// Get a specific refund request
refundRouter.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const refundRequestId = parseInt(req.params.id);
    const user = req.user as any;

    const refundRequest = await storage.getRefundRequest(refundRequestId);
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    // Check permissions
    const contractor = await storage.getContractor(refundRequest.contractorId);
    if (user.role !== 'admin' && contractor?.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden - Can only view your own refund requests" });
    }

    // Enrich with additional details
    const requestedByUser = await storage.getUser(refundRequest.requestedBy);
    const reviewedByUser = refundRequest.reviewedBy ? await storage.getUser(refundRequest.reviewedBy) : null;

    const enrichedRequest = {
      ...refundRequest,
      contractor: contractor ? {
        id: contractor.id,
        companyName: contractor.companyName,
        userId: contractor.userId
      } : null,
      requestedByUser: requestedByUser ? {
        id: requestedByUser.id,
        fullName: requestedByUser.fullName,
        email: requestedByUser.email
      } : null,
      reviewedByUser: reviewedByUser ? {
        id: reviewedByUser.id,
        fullName: reviewedByUser.fullName
      } : null
    };

    res.json({ refundRequest: enrichedRequest });
  } catch (error) {
    console.error('Error fetching refund request:', error);
    res.status(500).json({ error: 'Failed to fetch refund request' });
  }
});

// Process a refund (actually execute the Stripe refund) - admin only
refundRouter.post('/:id/process', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    if (!stripeConnectService) {
      return res.status(500).json({ error: 'Stripe Connect not configured' });
    }

    const refundRequestId = parseInt(req.params.id);
    const user = req.user as any;

    const refundRequest = await storage.getRefundRequest(refundRequestId);
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    if (refundRequest.status !== 'approved') {
      return res.status(400).json({ message: "Can only process approved refund requests" });
    }

    if (refundRequest.processedAt) {
      return res.status(400).json({ message: "Refund has already been processed" });
    }

    if (!refundRequest.stripePaymentIntentId) {
      return res.status(400).json({ message: "No Stripe payment intent ID found for this refund request" });
    }

    try {
      // Process the refund through Stripe
      const refund = await stripeConnectService.processRefund(
        refundRequest.stripePaymentIntentId,
        Math.round(refundRequest.amount * 100), // Convert to cents
        'requested_by_customer'
      );

      // Update the refund request with Stripe refund details
      const updatedRequest = await storage.updateRefundRequestProcessing(
        refundRequestId,
        refund.id,
        new Date()
      );

      res.json({
        message: 'Refund processed successfully',
        refundRequest: updatedRequest,
        stripeRefund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      });
    } catch (stripeError: any) {
      console.error('Stripe refund processing failed:', stripeError);
      
      // Update the refund request to reflect the failure
      await storage.updateRefundRequestStatus(
        refundRequestId,
        'failed',
        user.id,
        `Stripe refund failed: ${stripeError.message}`
      );

      return res.status(400).json({
        error: 'Failed to process refund through Stripe',
        details: stripeError.message
      });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});