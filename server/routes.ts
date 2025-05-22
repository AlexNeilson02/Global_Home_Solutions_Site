import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import QRCode from "qrcode";
import { 
  loginSchema, 
  insertUserSchema, 
  insertContractorSchema, 
  insertSalespersonSchema, 
  insertProjectSchema, 
  insertTestimonialSchema,
  insertBidRequestSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Session management - for simplicity using in-memory sessions
  const sessions: Record<string, { userId: number, role: string }> = {};

  // Middleware to check authentication
  const authenticate = (req: Request, res: Response, next: Function) => {
    const sessionId = req.headers.authorization?.split(" ")[1];
    if (!sessionId || !sessions[sessionId]) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = sessions[sessionId];
    next();
  };

  // Middleware to check role
  const checkRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // Auth endpoints
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login timestamp
      await storage.updateUserLastLogin(user.id);
      
      const sessionId = Math.random().toString(36).substring(2, 15);
      sessions[sessionId] = { userId: user.id, role: user.role };
      
      res.json({ 
        token: sessionId, 
        user: { 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName, 
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/auth/logout", authenticate, (req: Request, res: Response) => {
    const sessionId = req.headers.authorization?.split(" ")[1];
    if (sessionId) {
      delete sessions[sessionId];
    }
    res.json({ message: "Logged out successfully" });
  });

  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(data);
      res.status(201).json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName, 
          email: user.email,
          role: user.role
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User endpoints
  apiRouter.get("/users/me", authenticate, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      // Get role-specific data
      let roleData = null;
      if (user.role === "contractor") {
        roleData = await storage.getContractorByUserId(user.id);
      } else if (user.role === "salesperson") {
        roleData = await storage.getSalespersonByUserId(user.id);
      }
      
      res.json({ user: userWithoutPassword, roleData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user by ID - admin only
  apiRouter.get("/users/:id", authenticate, checkRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      // Get role-specific data
      let roleData = null;
      if (user.role === "contractor") {
        roleData = await storage.getContractorByUserId(user.id);
      } else if (user.role === "salesperson") {
        roleData = await storage.getSalespersonByUserId(user.id);
      }
      
      res.json({ user: userWithoutPassword, roleData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all users by role - admin only
  apiRouter.get("/users/role/:role", authenticate, checkRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const role = req.params.role;
      if (!["homeowner", "contractor", "salesperson", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const users = await storage.getUsersByRole(role);
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({ users: usersWithoutPasswords });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Contractor endpoints
  apiRouter.get("/contractors", async (req: Request, res: Response) => {
    try {
      const contractors = await storage.getAllContractors();
      
      // Fetch user data for each contractor
      const contractorsWithUserData = await Promise.all(
        contractors.map(async (contractor) => {
          const user = await storage.getUser(contractor.userId);
          return {
            ...contractor,
            fullName: user?.fullName,
            email: user?.email,
            phone: user?.phone,
            avatarUrl: user?.avatarUrl
          };
        })
      );
      
      res.json({ contractors: contractorsWithUserData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/contractors/featured", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 3;
      const contractors = await storage.getFeaturedContractors(limit);
      
      // Fetch user data for each contractor
      const contractorsWithUserData = await Promise.all(
        contractors.map(async (contractor) => {
          const user = await storage.getUser(contractor.userId);
          return {
            ...contractor,
            fullName: user?.fullName,
            email: user?.email,
            phone: user?.phone,
            avatarUrl: user?.avatarUrl
          };
        })
      );
      
      res.json({ contractors: contractorsWithUserData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/contractors/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const contractor = await storage.getContractor(id);
      
      if (!contractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      
      const user = await storage.getUser(contractor.userId);
      
      res.json({ 
        contractor: {
          ...contractor,
          fullName: user?.fullName,
          email: user?.email,
          phone: user?.phone,
          avatarUrl: user?.avatarUrl
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/contractors", authenticate, async (req: Request, res: Response) => {
    try {
      // Only allow admins to create contractors
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertContractorSchema.parse(req.body);
      const contractor = await storage.createContractor(data);
      res.status(201).json({ contractor });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Salesperson endpoints
  apiRouter.get("/salespersons", authenticate, checkRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const salespersons = await storage.getAllSalespersons();
      
      // Fetch user data for each salesperson
      const salespersonsWithUserData = await Promise.all(
        salespersons.map(async (salesperson) => {
          const user = await storage.getUser(salesperson.userId);
          return {
            ...salesperson,
            fullName: user?.fullName,
            email: user?.email,
            phone: user?.phone,
            avatarUrl: user?.avatarUrl
          };
        })
      );
      
      res.json({ salespersons: salespersonsWithUserData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/salespersons/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      // Only allow admins or the salesperson themselves to access their data
      if (req.user.role !== "admin" && req.user.userId !== salesperson.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const user = await storage.getUser(salesperson.userId);
      
      res.json({ 
        salesperson: {
          ...salesperson,
          fullName: user?.fullName,
          email: user?.email,
          phone: user?.phone,
          avatarUrl: user?.avatarUrl
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Salesperson analytics endpoints
  apiRouter.get("/salespersons/:id/analytics", authenticate, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      // Only allow admins or the salesperson themselves to access their analytics
      if (req.user.role !== "admin" && req.user.userId !== salesperson.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get analytics data
      const analytics = await storage.getSalespersonAnalytics(id);
      
      // Get recent bid requests
      const bidRequests = await storage.getBidRequestsBySalespersonId(id);
      
      // Get conversion metrics over time (last 30 days by default)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const visitStats = await storage.getPageVisitStats(id, startDate);
      
      res.json({ 
        analytics,
        recentBidRequests: bidRequests.slice(0, 5), // Just get the 5 most recent
        visitStats
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Top performing salespersons - admin only
  apiRouter.get("/salespersons/top/:metric", authenticate, checkRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const metric = req.params.metric as 'totalLeads' | 'conversionRate' | 'commissions';
      const limit = parseInt(req.query.limit as string) || 5;
      
      if (!['totalLeads', 'conversionRate', 'commissions'].includes(metric)) {
        return res.status(400).json({ message: "Invalid metric" });
      }
      
      const topSalespersons = await storage.getTopSalespersons(limit, metric);
      
      // Fetch user data for each salesperson
      const enrichedData = await Promise.all(
        topSalespersons.map(async (salesperson) => {
          const user = await storage.getUser(salesperson.userId);
          return {
            ...salesperson,
            fullName: user?.fullName,
            email: user?.email,
            avatarUrl: user?.avatarUrl
          };
        })
      );
      
      res.json({ salespersons: enrichedData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Bid requests for a salesperson
  apiRouter.get("/salespersons/:id/bid-requests", authenticate, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      // Only allow admins or the salesperson themselves to access their bid requests
      if (req.user.role !== "admin" && req.user.userId !== salesperson.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const bidRequests = await storage.getBidRequestsBySalespersonId(id);
      
      // Enrich bid requests with contractor data
      const enrichedRequests = await Promise.all(
        bidRequests.map(async (request) => {
          const contractor = await storage.getContractor(request.contractorId);
          return {
            ...request,
            contractorName: contractor?.companyName || "Unknown"
          };
        })
      );
      
      res.json({ bidRequests: enrichedRequests });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update bid request status - only available to the salesperson who created it or admin
  apiRouter.patch("/bid-requests/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      
      if (!status || !['pending', 'sent', 'contacted', 'completed', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const bidRequest = await storage.getBidRequest(id);
      if (!bidRequest) {
        return res.status(404).json({ message: "Bid request not found" });
      }
      
      // Verify authorization (only admin or the salesperson who created it)
      const salesperson = bidRequest.salespersonId ? 
        await storage.getSalesperson(bidRequest.salespersonId) : null;
      
      if (
        req.user.role !== "admin" && 
        (!salesperson || req.user.userId !== salesperson.userId)
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedRequest = await storage.updateBidRequestStatus(id, status);
      res.json({ bidRequest: updatedRequest });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Add notes to bid request
  apiRouter.patch("/bid-requests/:id/notes", authenticate, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { notes } = req.body;
      
      if (!notes) {
        return res.status(400).json({ message: "Notes are required" });
      }
      
      const bidRequest = await storage.getBidRequest(id);
      if (!bidRequest) {
        return res.status(404).json({ message: "Bid request not found" });
      }
      
      // Verify authorization (only admin or the salesperson who created it)
      const salesperson = bidRequest.salespersonId ? 
        await storage.getSalesperson(bidRequest.salespersonId) : null;
      
      if (
        req.user.role !== "admin" && 
        (!salesperson || req.user.userId !== salesperson.userId)
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedRequest = await storage.updateBidRequestNotes(id, notes);
      res.json({ bidRequest: updatedRequest });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // NFC profile route - publicly accessible
  apiRouter.get("/nfc/:profileUrl", async (req: Request, res: Response) => {
    try {
      const profileUrl = req.params.profileUrl;
      const salesperson = await storage.getSalespersonByProfileUrl(profileUrl);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      // Update last scanned time
      await storage.updateSalesperson(salesperson.id, {
        lastScanned: new Date()
      });
      
      const user = await storage.getUser(salesperson.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get their contractors
      const contractors = await storage.getAllContractors();
      
      res.json({ 
        salesperson: {
          id: salesperson.id,
          fullName: user.fullName,
          profileUrl: salesperson.profileUrl,
          nfcId: salesperson.nfcId,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          email: user.email,
          lastScanned: salesperson.lastScanned
        },
        contractors
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Salesperson profile route by ID - publicly accessible
  apiRouter.get("/salesperson/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid salesperson ID" });
      }
      
      const salesperson = await storage.getSalesperson(id);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      // Update last scanned time
      await storage.updateSalesperson(salesperson.id, {
        lastScanned: new Date()
      });
      
      const user = await storage.getUser(salesperson.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get their contractors
      const contractors = await storage.getAllContractors();
      
      res.json({ 
        salesperson: {
          id: salesperson.id,
          fullName: user.fullName,
          profileUrl: salesperson.profileUrl,
          nfcId: salesperson.nfcId,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          email: user.email,
          lastScanned: salesperson.lastScanned
        },
        contractors
      });
    } catch (error) {
      console.error("Error fetching salesperson by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Service categories endpoint
  apiRouter.get("/service-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllServiceCategories();
      res.json({ categories });
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project endpoints
  apiRouter.get("/projects", authenticate, async (req: Request, res: Response) => {
    try {
      let projects = [];
      
      // Filter projects based on role
      if (req.user.role === "admin") {
        projects = await storage.getAllProjects();
      } else if (req.user.role === "contractor") {
        const contractor = await storage.getContractorByUserId(req.user.userId);
        if (contractor) {
          projects = await storage.getProjectsByContractorId(contractor.id);
        }
      } else if (req.user.role === "salesperson") {
        const salesperson = await storage.getSalespersonByUserId(req.user.userId);
        if (salesperson) {
          projects = await storage.getProjectsBySalespersonId(salesperson.id);
        }
      } else {
        projects = await storage.getProjectsByHomeownerId(req.user.userId);
      }
      
      res.json({ projects });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.get("/projects/recent", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 3;
      const projects = await storage.getRecentProjects(limit);
      
      // Fetch contractor data for each project
      const projectsWithContractorData = await Promise.all(
        projects.map(async (project) => {
          let contractorName = "Unknown";
          
          if (project.contractorId) {
            const contractor = await storage.getContractor(project.contractorId);
            if (contractor) {
              contractorName = contractor.companyName;
            }
          }
          
          return {
            ...project,
            contractorName
          };
        })
      );
      
      res.json({ projects: projectsWithContractorData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/projects", authenticate, async (req: Request, res: Response) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      
      // Set homeownerId to the logged in user if they're a homeowner
      if (req.user.role === "homeowner") {
        data.homeownerId = req.user.userId;
      }
      
      const project = await storage.createProject(data);
      
      // If project has a salespersonId, update their stats
      if (project.salespersonId) {
        const salesperson = await storage.getSalesperson(project.salespersonId);
        if (salesperson) {
          await storage.updateSalesperson(salesperson.id, {
            totalLeads: (salesperson.totalLeads || 0) + 1,
            activeProjects: (salesperson.activeProjects || 0) + 1
          });
        }
      }
      
      res.status(201).json({ project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Testimonial endpoints
  apiRouter.get("/testimonials/recent", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 3;
      const testimonials = await storage.getRecentTestimonials(limit);
      
      // Fetch user data for each testimonial
      const testimonialsWithUserData = await Promise.all(
        testimonials.map(async (testimonial) => {
          const user = await storage.getUser(testimonial.userId);
          return {
            ...testimonial,
            fullName: user?.fullName,
            avatarUrl: user?.avatarUrl
          };
        })
      );
      
      res.json({ testimonials: testimonialsWithUserData });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/testimonials", authenticate, async (req: Request, res: Response) => {
    try {
      const data = insertTestimonialSchema.parse(req.body);
      
      // Set userId to the logged in user
      data.userId = req.user.userId;
      
      // Verify that the project exists and belongs to the user
      if (data.projectId) {
        const project = await storage.getProject(data.projectId);
        if (!project || project.homeownerId !== req.user.userId) {
          return res.status(403).json({ message: "You can only leave testimonials for your own projects" });
        }
      }
      
      const testimonial = await storage.createTestimonial(data);
      res.status(201).json({ testimonial });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
