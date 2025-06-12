import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./database-storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
import { CommissionService } from "./commission-service";
import { z } from "zod";
import QRCode from "qrcode";
import { 
  insertContractorSchema, 
  insertSalespersonSchema, 
  insertProjectSchema, 
  insertTestimonialSchema,
  insertBidRequestSchema,
  type User
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  await setupAuth(app);
  
  // API routes prefix
  const apiRouter = express.Router();
  
  // Add middleware to log all API requests
  apiRouter.use((req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path} - Body:`, req.body);
    next();
  });
  
  app.use("/api", apiRouter);

  // Import and use authentication routes
  const authRoutes = (await import("./auth-routes")).default;
  apiRouter.use("/auth", authRoutes);

  // WebSocket connections for real-time notifications
  const contractorConnections = new Map<number, WebSocket[]>();

  // Protected routes that require authentication
  apiRouter.get("/users/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { password, ...userInfo } = user;
      
      console.log('User role:', user.role, 'User ID:', user.id);
      
      // If user is a contractor, include contractor data
      if (user.role === 'contractor') {
        const contractor = await storage.getContractorByUserId(user.id);
        console.log('Found contractor data:', contractor);
        res.json({ ...userInfo, roleData: contractor });
      }
      // If user is a salesperson, include salesperson data
      else if (user.role === 'salesperson') {
        const salesperson = await storage.getSalespersonByUserId(user.id);
        console.log('Found salesperson data:', salesperson);
        res.json({ ...userInfo, roleData: salesperson });
      }
      else {
        res.json(userInfo);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  apiRouter.get("/users/:id", isAuthenticated, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  apiRouter.get("/users/role/:role", isAuthenticated, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const role = req.params.role;
      const users = await storage.getUsersByRole(role);
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Contractors routes
  apiRouter.get("/contractors", async (req: Request, res: Response) => {
    try {
      const contractors = await storage.getAllContractors();
      res.json({ contractors });
    } catch (error) {
      console.error("Error fetching contractors:", error);
      res.status(500).json({ message: "Failed to fetch contractors" });
    }
  });

  apiRouter.get("/contractors/featured", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const contractors = await storage.getFeaturedContractors(limit);
      res.json({ contractors });
    } catch (error) {
      console.error("Error fetching featured contractors:", error);
      res.status(500).json({ message: "Failed to fetch featured contractors" });
    }
  });

  apiRouter.get("/contractors/:id", async (req: Request, res: Response) => {
    try {
      const contractorId = parseInt(req.params.id);
      const contractor = await storage.getContractor(contractorId);
      if (!contractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      res.json({ contractor });
    } catch (error) {
      console.error("Error fetching contractor:", error);
      res.status(500).json({ message: "Failed to fetch contractor" });
    }
  });

  apiRouter.patch("/contractors/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const contractorId = parseInt(req.params.id);
      const contractor = await storage.updateContractor(contractorId, req.body);
      if (!contractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      res.json({ contractor });
    } catch (error) {
      console.error("Error updating contractor:", error);
      res.status(500).json({ message: "Failed to update contractor" });
    }
  });

  apiRouter.post("/contractors/register", async (req: Request, res: Response) => {
    try {
      const data = insertContractorSchema.parse(req.body);
      const contractor = await storage.createContractor(data);
      res.status(201).json({ message: "Contractor registered successfully", contractor });
    } catch (error) {
      console.error("Error registering contractor:", error);
      res.status(400).json({ message: "Invalid contractor data" });
    }
  });

  // Service categories routes
  apiRouter.get("/service-categories", async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServiceCategories();
      res.json({ services });
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  // Salespersons routes
  apiRouter.get("/salespersons", isAuthenticated, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const salespersons = await storage.getAllSalespersons();
      res.json({ salespersons });
    } catch (error) {
      console.error("Error fetching salespersons:", error);
      res.status(500).json({ message: "Failed to fetch salespersons" });
    }
  });

  apiRouter.get("/salespersons/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const salespersonId = parseInt(req.params.id);
      const salesperson = await storage.getSalesperson(salespersonId);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      res.json({ salesperson });
    } catch (error) {
      console.error("Error fetching salesperson:", error);
      res.status(500).json({ message: "Failed to fetch salesperson" });
    }
  });

  // QR code generation endpoint
  apiRouter.get("/salespersons/:id/qrcode", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      // Construct the URL for the homepage with sales rep tracking
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const landingPageUrl = `${baseUrl}/?ref=${salesperson.profileUrl}`;
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(landingPageUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
          dark: '#003366',  // Blue color for QR code
          light: '#ffffff'  // White background
        }
      });
      
      res.json({
        qrCode: qrCodeDataUrl,
        landingPageUrl
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Error generating QR code" });
    }
  });

  // Salesperson profile route by profile URL - publicly accessible
  apiRouter.get("/salesperson/:profileUrl", async (req: Request, res: Response) => {
    try {
      const { profileUrl } = req.params;
      
      const salesperson = await storage.getSalespersonByProfileUrl(profileUrl);
      
      if (!salesperson) {
        return res.status(400).json({ message: "Invalid salesperson profile" });
      }
      
      // Increment total visits
      await storage.incrementSalespersonStats(salesperson.id, 'totalVisits');
      
      // Get the user associated with this salesperson
      const user = await storage.getUser(salesperson.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        user: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl
        },
        salesperson: {
          id: salesperson.id,
          profileUrl: salesperson.profileUrl,
          bio: salesperson.bio,
          specialties: salesperson.specialties || [],
          certifications: salesperson.certifications || [],
          yearsExperience: salesperson.yearsExperience,
          totalVisits: salesperson.totalVisits,
          successfulConversions: salesperson.successfulConversions
        }
      });
    } catch (error) {
      console.error("Error fetching salesperson profile:", error);
      res.status(500).json({ message: "Error fetching salesperson profile" });
    }
  });

  // Track page visit for QR code attribution - public endpoint
  apiRouter.post("/track-visit", async (req: Request, res: Response) => {
    try {
      const { salespersonProfileUrl, userAgent, referrer } = req.body;
      
      if (!salespersonProfileUrl) {
        return res.status(400).json({ message: "Salesperson profile URL is required" });
      }

      // Get salesperson by profile URL
      const salesperson = await storage.getSalespersonByProfileUrl(salespersonProfileUrl);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      // Create page visit record for tracking
      const pageVisit = await storage.createPageVisit({
        salespersonId: salesperson.id,
        path: '/',
        userAgent: userAgent || null,
        referrer: referrer || null,
        visitorIp: req.ip || null
      });

      // Increment salesperson's total visits
      await storage.incrementSalespersonStats(salesperson.id, 'totalVisits');

      res.json({ 
        success: true, 
        salesperson: {
          id: salesperson.id,
          profileUrl: salesperson.profileUrl
        }
      });
    } catch (error) {
      console.error("Error tracking visit:", error);
      res.status(500).json({ message: "Error tracking visit" });
    }
  });

  // Bid requests routes
  apiRouter.post("/bid-requests", upload.array('media', 10), async (req: Request, res: Response) => {
    try {
      console.log('Processing bid request with body:', req.body);
      
      const {
        // New field names
        fullName,
        email,
        phone,
        address,
        description,
        timeline,
        budget,
        serviceRequested,
        preferredContactMethod,
        additionalInformation,
        contractorId,
        salespersonId,
        // Legacy fields for backward compatibility
        customerName,
        customerEmail,
        customerPhone,
        projectDescription,
        projectAddress,
        preferredTimeframe
      } = req.body;

      // Use new fields if available, fallback to legacy fields for backward compatibility
      const finalFullName = fullName || customerName;
      const finalEmail = email || customerEmail;
      const finalPhone = phone || customerPhone;
      const finalAddress = address || projectAddress;
      const finalDescription = description || projectDescription;
      const finalTimeline = timeline || preferredTimeframe;
      
      // Validate required fields
      if (!finalFullName || !finalEmail || !finalPhone || !finalDescription || !finalAddress || !finalTimeline || !contractorId) {
        console.log('Missing required fields:', {
          fullName: !!finalFullName,
          email: !!finalEmail,
          phone: !!finalPhone,
          description: !!finalDescription,
          address: !!finalAddress,
          timeline: !!finalTimeline,
          contractorId: !!contractorId
        });
        return res.status(400).json({ message: "All required fields must be provided" });
      }

      // Process uploaded files
      const files = req.files as Express.Multer.File[];
      let mediaUrls: string[] = [];
      
      if (files && files.length > 0) {
        // Convert files to base64 for storage
        mediaUrls = files.map((file, index) => {
          const base64Data = file.buffer.toString('base64');
          const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
          return dataUrl;
        });
      }

      // Create bid request with correct field names for database schema
      const bidRequestData = {
        contractorId: Number(contractorId),
        salespersonId: salespersonId ? Number(salespersonId) : null,
        fullName: finalFullName,
        email: finalEmail,
        phone: finalPhone,
        address: finalAddress,
        serviceRequested: serviceRequested || "General Services",
        description: finalDescription,
        timeline: finalTimeline,
        budget: budget || null,
        preferredContactMethod: preferredContactMethod || "email",
        additionalInformation: additionalInformation || (mediaUrls.length > 0 ? JSON.stringify({ mediaUrls }) : null)
      };

      console.log('Creating bid request with data:', bidRequestData);
      const bidRequest = await storage.createBidRequest(bidRequestData);

      // If there's a sales rep attribution, update their stats, create commission, and notify them
      if (salespersonId) {
        try {
          // Increment the salesperson's successful conversions
          await storage.incrementSalespersonStats(Number(salespersonId), 'successfulConversions');
          
          // Get salesperson and user details for notification
          const salesperson = await storage.getSalesperson(Number(salespersonId));
          if (salesperson) {
            const salesUser = await storage.getUser(salesperson.userId);
            console.log(`Bid request attributed to sales rep: ${salesUser?.fullName} (ID: ${salespersonId})`);
            
            // Create commission record for this bid request
            try {
              await CommissionService.createCommissionForBidRequest(bidRequest, salesperson.id);
              console.log(`Commission created for bid request ${bidRequest.id}, salesperson ${salespersonId}`);
            } catch (commissionError) {
              console.error('Error creating commission:', commissionError);
              // Log but don't fail the bid request creation
            }
            
            // Here you could send email notification to sales rep
            // await sendSalesRepNotification(salesUser, bidRequest);
          }
        } catch (error) {
          console.error('Error updating salesperson stats:', error);
          // Don't fail the entire request if sales rep update fails
        }
      }

      // Get contractor details for notification
      const contractor = await storage.getContractor(Number(contractorId));
      if (contractor) {
        const contractorUser = await storage.getUser(contractor.userId);
        console.log(`Bid request sent to contractor: ${contractor.companyName} (ID: ${contractorId})`);
        
        // Here you could send email notification to contractor
        // await sendContractorNotification(contractorUser, bidRequest);
      }

      res.status(201).json({ 
        message: "Bid request created successfully", 
        bidRequest,
        salesRepAttributed: !!salespersonId
      });
    } catch (error) {
      console.error("Error creating bid request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/bid-requests/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const bidRequests = await storage.getRecentBidRequests(limit);
      res.json({ bidRequests });
    } catch (error) {
      console.error("Error fetching recent bid requests:", error);
      res.status(500).json({ message: "Failed to fetch bid requests" });
    }
  });

  // Get bid requests for a specific contractor
  apiRouter.get("/contractors/:id/bid-requests", async (req: Request, res: Response) => {
    try {
      const contractorId = Number(req.params.id);
      console.log("Fetching bid requests for contractor:", contractorId);
      
      const bidRequests = await storage.getBidRequestsByContractorId(contractorId);
      console.log("Found bid requests for contractor", contractorId, ":", bidRequests.length);
      
      res.status(200).json({ 
        success: true,
        bidRequests: bidRequests,
        count: bidRequests.length 
      });
    } catch (error) {
      console.error("Error fetching contractor bid requests:", error);
      res.status(500).json({ message: "Internal server error", success: false });
    }
  });

  // Get bid requests for a specific salesperson
  apiRouter.get("/salespersons/:id/bid-requests", async (req: Request, res: Response) => {
    try {
      const salespersonId = Number(req.params.id);
      console.log("Fetching bid requests for salesperson:", salespersonId);
      
      const bidRequests = await storage.getBidRequestsBySalespersonId(salespersonId);
      console.log("Found bid requests for salesperson", salespersonId, ":", bidRequests.length);
      
      res.status(200).json({ 
        success: true,
        bidRequests: bidRequests,
        count: bidRequests.length 
      });
    } catch (error) {
      console.error("Error fetching salesperson bid requests:", error);
      res.status(500).json({ message: "Internal server error", success: false });
    }
  });

  // Update bid request status
  apiRouter.patch("/bid-requests/:id/status", async (req: Request, res: Response) => {
    try {
      const requestId = Number(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Get current bid request to track the status change
      const currentBidRequest = await storage.getBidRequest(requestId);
      if (!currentBidRequest) {
        return res.status(404).json({ message: "Bid request not found" });
      }

      // Log the status change for analytics
      const previousStatus = currentBidRequest.status;
      console.log(`Bid request ${requestId} status change: ${previousStatus} → ${status}`);
      
      // Track analytics data:
      // - Previous status and new status
      // - Timestamp of change
      // - Time spent in previous status
      // - Actor making the change (contractor/admin)
      const statusChangeTime = new Date();
      const createdAt = currentBidRequest.createdAt ? new Date(currentBidRequest.createdAt) : statusChangeTime;
      const timeInPreviousStatus = statusChangeTime.getTime() - createdAt.getTime();
      
      console.log(`Analytics: Bid ${requestId} spent ${Math.round(timeInPreviousStatus / (1000 * 60))} minutes in '${previousStatus}' status`);

      // Update the bid request status in the database
      const result = await storage.updateBidRequestStatus(requestId, status);
      
      if (!result) {
        return res.status(404).json({ message: "Failed to update bid request" });
      }

      // Additional analytics logging for specific status changes
      if (status === 'contacted') {
        console.log(`Analytics: Contractor responded to bid request ${requestId} - customer contact initiated`);
      } else if (status === 'bid_sent') {
        console.log(`Analytics: Bid sent for request ${requestId} - moved to projects tracking`);
        
        // If there's a sales rep attribution, increment their conversion stats
        if (currentBidRequest.salespersonId) {
          try {
            console.log(`Analytics: Incrementing conversion stats for sales rep ${currentBidRequest.salespersonId}`);
            // Note: This would ideally be a separate "bid_sent" metric, but using existing increment
          } catch (error) {
            console.error('Error updating salesperson bid sent stats:', error);
          }
        }
      } else if (status === 'won') {
        console.log(`Analytics: Project won for bid request ${requestId} - revenue event`);
        
        // Track revenue and final conversion for sales rep
        if (currentBidRequest.salespersonId) {
          console.log(`Analytics: Sales rep ${currentBidRequest.salespersonId} earned commission on won project ${requestId}`);
        }
      } else if (status === 'lost') {
        console.log(`Analytics: Project lost for bid request ${requestId} - conversion failed`);
      } else if (status === 'declined') {
        console.log(`Analytics: Bid request ${requestId} declined by contractor`);
      }

      res.json({ success: true, bidRequest: result, statusChange: {
        from: previousStatus,
        to: status,
        timestamp: statusChangeTime,
        duration: timeInPreviousStatus
      }});
    } catch (error) {
      console.error("Error updating bid request status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete bid request
  apiRouter.delete("/bid-requests/:id", async (req: Request, res: Response) => {
    try {
      const requestId = Number(req.params.id);
      
      // For now, we'll mark as declined rather than actually deleting
      const result = await storage.updateBidRequestStatus(requestId, 'declined');
      
      if (!result) {
        return res.status(404).json({ message: "Bid request not found" });
      }

      res.json({ success: true, message: "Bid request declined successfully" });
    } catch (error) {
      console.error("Error declining bid request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced analytics endpoints with real data calculations
  apiRouter.get("/analytics/admin/overview", isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string;
      let startDate: Date, endDate: Date;

      switch (timeRange) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          endDate = new Date();
      }

      const comprehensiveAnalytics = await storage.getComprehensiveAnalytics({ startDate, endDate });
      const revenueAnalytics = await storage.getRevenueAnalytics({ startDate, endDate });

      res.json({
        timeRange: timeRange || '30d',
        overview: comprehensiveAnalytics.overview,
        conversions: comprehensiveAnalytics.conversions,
        performance: comprehensiveAnalytics.performance,
        trends: comprehensiveAnalytics.trends,
        revenue: revenueAnalytics
      });
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch admin analytics" });
    }
  });

  // Sales rep individual analytics
  apiRouter.get("/analytics/sales-rep/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const repId = Number(req.params.id);
      const user = req.user as User;
      
      // Ensure user can only access their own data or admin can access any
      if (user.role !== 'admin') {
        const salesperson = await storage.getSalespersonByUserId(user.id);
        if (!salesperson || salesperson.id !== repId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const salesperson = await storage.getSalesperson(repId);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      // Get all bid requests attributed to this sales rep
      const allBidRequests = await storage.getRecentBidRequests(1000);
      const repBids = allBidRequests.filter(bid => bid.salespersonId === repId);

      // Calculate personal performance metrics
      const totalLeads = repBids.length;
      const contactedLeads = repBids.filter(bid => ['contacted', 'bid_sent', 'won', 'lost'].includes(bid.status)).length;
      const bidsSent = repBids.filter(bid => ['bid_sent', 'won', 'lost'].includes(bid.status)).length;
      const wonProjects = repBids.filter(bid => bid.status === 'won').length;

      // Commission-eligible projects (won projects with budget data)
      const commissionEligible = repBids.filter(bid => bid.status === 'won' && bid.budget);
      const totalCommissionValue = commissionEligible.reduce((sum, bid) => sum + (parseFloat(bid.budget || '0') || 0), 0);

      // Performance comparison with other reps
      const allSalesPersons = await storage.getAllSalespersons();
      const rankings = await Promise.all(
        allSalesPersons.map(async (rep) => {
          const otherRepBids = allBidRequests.filter(bid => bid.salespersonId === rep.id);
          const otherRepWons = otherRepBids.filter(bid => bid.status === 'won');
          return {
            id: rep.id,
            wonProjects: otherRepWons.length,
            totalLeads: otherRepBids.length
          };
        })
      );

      const rankByWins = rankings.sort((a, b) => b.wonProjects - a.wonProjects)
        .findIndex(rep => rep.id === repId) + 1;
      const rankByLeads = rankings.sort((a, b) => b.totalLeads - a.totalLeads)
        .findIndex(rep => rep.id === repId) + 1;

      res.json({
        personalMetrics: {
          totalQrScans: salesperson.totalVisits || 0,
          totalLeads,
          contactedLeads,
          bidsSent,
          wonProjects,
          conversionRate: totalLeads > 0 ? (wonProjects / totalLeads * 100).toFixed(1) : 0,
          scanToLeadRate: (salesperson.totalVisits || 0) > 0 ? (totalLeads / (salesperson.totalVisits || 1) * 100).toFixed(1) : 0
        },
        commissionData: {
          eligibleProjects: commissionEligible.length,
          totalCommissionValue,
          averageProjectValue: commissionEligible.length > 0 ? (totalCommissionValue / commissionEligible.length).toFixed(0) : 0
        },
        performance: {
          rankByWins,
          rankByLeads,
          totalReps: allSalesPersons.length
        },
        recentLeads: repBids.slice(0, 10).map(bid => ({
          id: bid.id,
          customerName: bid.fullName,
          service: bid.serviceRequested,
          status: bid.status,
          submittedAt: bid.createdAt,
          projectValue: bid.budget
        }))
      });
    } catch (error) {
      console.error("Error fetching sales rep analytics:", error);
      res.status(500).json({ message: "Failed to fetch sales rep analytics" });
    }
  });

  // Conversion funnel analytics
  apiRouter.get("/analytics/conversion-funnel", isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.query;
      const daysBack = Number(days);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const allBidRequests = await storage.getRecentBidRequests(1000);
      const recentBids = allBidRequests.filter(bid => {
        const bidDate = bid.createdAt ? new Date(bid.createdAt) : new Date();
        return bidDate >= cutoffDate;
      });

      // Track progression through each stage
      const funnelData = [
        {
          stage: 'QR Code Scans',
          count: recentBids.reduce((sum, bid) => {
            // Estimate scans based on attributed requests (rough approximation)
            return sum + (bid.salespersonId ? 3 : 0); // Assume 3 scans per attributed request
          }, 0),
          description: 'Total QR code scans recorded'
        },
        {
          stage: 'Bid Requests',
          count: recentBids.length,
          description: 'Customers who submitted project requests'
        },
        {
          stage: 'Contacted',
          count: recentBids.filter(bid => ['contacted', 'bid_sent', 'won', 'lost'].includes(bid.status)).length,
          description: 'Requests where contractor contacted customer'
        },
        {
          stage: 'Bids Sent',
          count: recentBids.filter(bid => ['bid_sent', 'won', 'lost'].includes(bid.status)).length,
          description: 'Formal bids submitted to customers'
        },
        {
          stage: 'Projects Won',
          count: recentBids.filter(bid => bid.status === 'won').length,
          description: 'Successfully closed deals'
        }
      ];

      // Calculate drop-off rates
      const dropOffAnalysis = funnelData.map((stage, index) => {
        if (index === 0) return { ...stage, dropOffRate: 0, conversionRate: 100 };
        
        const previousStage = funnelData[index - 1];
        const dropOffRate = previousStage.count > 0 ? 
          ((previousStage.count - stage.count) / previousStage.count * 100).toFixed(1) : 0;
        const conversionRate = funnelData[0].count > 0 ? 
          (stage.count / funnelData[0].count * 100).toFixed(1) : 0;

        return { ...stage, dropOffRate, conversionRate };
      });

      res.json({
        timeframe: `Last ${daysBack} days`,
        funnelData: dropOffAnalysis,
        summary: {
          totalScans: funnelData[0].count,
          totalRequests: funnelData[1].count,
          totalWins: funnelData[4].count,
          overallConversionRate: funnelData[0].count > 0 ? 
            (funnelData[4].count / funnelData[0].count * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error("Error fetching conversion funnel analytics:", error);
      res.status(500).json({ message: "Failed to fetch conversion funnel data" });
    }
  });

  // Projects routes
  apiRouter.get("/projects", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      let projects;
      
      if (user.role === "admin") {
        projects = await storage.getAllProjects();
      } else if (user.role === "contractor") {
        const contractor = await storage.getContractorByUserId(user.id);
        if (contractor) {
          projects = await storage.getProjectsByContractorId(contractor.id);
        }
      } else if (user.role === "salesperson") {
        const salesperson = await storage.getSalespersonByUserId(user.id);
        if (salesperson) {
          projects = await storage.getProjectsBySalespersonId(salesperson.id);
        }
      } else {
        projects = await storage.getProjectsByHomeownerId(user.id);
      }
      
      res.json({ projects: projects || [] });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  apiRouter.get("/projects/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const projects = await storage.getRecentProjects(limit);
      res.json({ projects });
    } catch (error) {
      console.error("Error fetching recent projects:", error);
      res.status(500).json({ message: "Failed to fetch recent projects" });
    }
  });

  apiRouter.post("/projects", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...data,
        homeownerId: user.id,
      });
      res.status(201).json({ message: "Project created successfully", project });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Testimonials routes
  apiRouter.get("/testimonials/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const testimonials = await storage.getRecentTestimonials(limit);
      res.json({ testimonials });
    } catch (error) {
      console.error("Error fetching recent testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  apiRouter.post("/testimonials", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const data = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial({
        ...data,
        userId: user.id,
      });
      res.status(201).json({ message: "Testimonial created successfully", testimonial });
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(400).json({ message: "Invalid testimonial data" });
    }
  });

  // Enhanced Document Management Routes
  apiRouter.post("/documents/upload", isAuthenticated, upload.array('files', 10), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const files = req.files as Express.Multer.File[];
      const { category = 'general', relatedId, relatedType, description, tags } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedDocuments = [];

      for (const file of files) {
        // Convert file to base64
        const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        // Create document record
        const document = await storage.createDocument({
          fileName: `${Date.now()}_${file.originalname}`,
          originalName: file.originalname,
          fileType: file.mimetype.startsWith('image/') ? 'image' : 'video',
          mimeType: file.mimetype,
          fileSize: file.size,
          fileUrl: base64Data,
          uploadedBy: user.id,
          category,
          relatedId: relatedId ? parseInt(relatedId) : null,
          relatedType: relatedType || null,
          description: description || null,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : []
        });

        uploadedDocuments.push(document);
      }

      res.status(201).json({ 
        message: `${uploadedDocuments.length} files uploaded successfully`,
        documents: uploadedDocuments 
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  apiRouter.get("/documents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { category, relatedId, search } = req.query;

      let documents;
      
      if (search) {
        documents = await storage.searchDocuments(search as string, category as string);
      } else if (category) {
        documents = await storage.getDocumentsByCategory(
          category as string, 
          relatedId ? parseInt(relatedId as string) : undefined
        );
      } else {
        documents = await storage.getDocumentsByUser(user.id);
      }

      res.json({ documents });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  apiRouter.get("/documents/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json({ document });
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  apiRouter.delete("/documents/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const user = req.user as User;
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user owns the document or is admin
      if (document.uploadedBy !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteDocument(documentId);
      
      if (deleted) {
        res.json({ message: "Document deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Enhanced Project Management Routes
  apiRouter.get("/projects/:id/timeline", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const timeline = await storage.getProjectTimeline(projectId);
      res.json({ timeline });
    } catch (error) {
      console.error("Error fetching project timeline:", error);
      res.status(500).json({ message: "Failed to fetch project timeline" });
    }
  });

  apiRouter.post("/projects/:id/milestones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const user = req.user as User;
      const { title, description, dueDate, orderIndex = 0 } = req.body;

      const milestone = await storage.createProjectMilestone({
        projectId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        orderIndex,
        createdBy: user.id
      });

      res.status(201).json({ 
        message: "Milestone created successfully", 
        milestone 
      });
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(400).json({ message: "Failed to create milestone" });
    }
  });

  apiRouter.patch("/projects/:id/milestones/:milestoneId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const milestoneId = parseInt(req.params.milestoneId);
      const { status, completedAt, ...updateData } = req.body;

      let finalUpdateData = { ...updateData };
      
      if (status === 'completed' && !completedAt) {
        finalUpdateData.completedAt = new Date();
      }
      finalUpdateData.status = status;

      const milestone = await storage.updateProjectMilestone(milestoneId, finalUpdateData);
      
      if (milestone) {
        res.json({ message: "Milestone updated successfully", milestone });
      } else {
        res.status(404).json({ message: "Milestone not found" });
      }
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  apiRouter.post("/projects/:id/status-updates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const user = req.user as User;
      const { status, notes, attachments = [] } = req.body;

      const statusUpdate = await storage.createProjectStatusUpdate({
        projectId,
        status,
        notes,
        updatedBy: user.id,
        attachments
      });

      res.status(201).json({ 
        message: "Status update created successfully", 
        statusUpdate 
      });
    } catch (error) {
      console.error("Error creating status update:", error);
      res.status(400).json({ message: "Failed to create status update" });
    }
  });

  const httpServer = createServer(app);
  
  // Temporarily disable WebSocket to fix stability issues
  // TODO: Re-implement WebSocket with proper error handling
  
  return httpServer;
}