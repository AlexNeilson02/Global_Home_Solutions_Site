import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./database-storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
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

      // If there's a sales rep attribution, update their stats and notify them
      if (salespersonId) {
        try {
          // Increment the salesperson's successful conversions
          await storage.incrementSalespersonStats(Number(salespersonId), 'successfulConversions');
          
          // Get salesperson and user details for notification
          const salesperson = await storage.getSalesperson(Number(salespersonId));
          if (salesperson) {
            const salesUser = await storage.getUser(salesperson.userId);
            console.log(`Bid request attributed to sales rep: ${salesUser?.fullName} (ID: ${salespersonId})`);
            
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

  const httpServer = createServer(app);
  
  // Temporarily disable WebSocket to fix stability issues
  // TODO: Re-implement WebSocket with proper error handling
  
  return httpServer;
}