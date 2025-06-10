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
      
      // Construct the URL for the salesperson's tracked landing page
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const landingPageUrl = `${baseUrl}/sales/${salesperson.profileUrl}`;
      
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

  // Bid requests routes
  apiRouter.post("/bid-requests", upload.array('media', 10), async (req: Request, res: Response) => {
    try {
      const data = insertBidRequestSchema.parse(req.body);
      const bidRequest = await storage.createBidRequest(data);
      res.status(201).json({ message: "Bid request created successfully", bidRequest });
    } catch (error) {
      console.error("Error creating bid request:", error);
      res.status(400).json({ message: "Invalid bid request data" });
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