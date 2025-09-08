import { Router, Request, Response } from "express";
import { storage } from "./database-storage";
import { isAuthenticated, requireRole } from "./auth";
import { z } from "zod";
import { insertRefundRequestSchema } from "@shared/schema";

export const refundRouter = Router();

// Validation schemas
const createRefundRequestSchema = insertRefundRequestSchema.extend({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  amount: z.number().positive("Amount must be positive"),
});

const reviewRefundSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
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
      status: 'pending'
    });

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

    // Update refund request status
    const updatedRequest = await storage.updateRefundRequestStatus(
      refundRequestId,
      validatedData.status,
      user.id,
      validatedData.reviewNotes
    );

    // If approved, we'll handle the actual refund processing and revenue deduction in separate endpoints
    // This allows for a two-step process: approve -> process

    res.json({ 
      message: `Refund request ${validatedData.status} successfully`, 
      refundRequest: updatedRequest 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error reviewing refund request:', error);
    res.status(500).json({ error: 'Failed to review refund request' });
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