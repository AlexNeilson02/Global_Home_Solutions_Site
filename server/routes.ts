import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import passport from "passport";
import { storage } from "./database-storage";
import { setupAuth, isAuthenticated, requireRole, hashPassword } from "./auth";
import { z } from "zod";
import QRCode from "qrcode";
import { 
  loginSchema, 
  insertUserSchema, 
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

// Database retry utility function
async function retryDatabaseOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Database operation attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  throw lastError!;
}

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
      res.json(userInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  apiRouter.get("/users/:id", isAuthenticated, requireRole(["admin"]), async (req: Request, res: Response) => {
      
      const user = await storage.getUserByUsername(data.username);
      console.log("User found:", user ? `ID: ${user.id}, Role: ${user.role}` : "None");
      
      if (!user || user.password !== data.password) {
        console.log("Login failed - invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const sessionId = Math.random().toString(36).substring(2, 15);
      sessions[sessionId] = { userId: user.id, role: user.role };
      console.log("Login successful - creating session:", sessionId);
      
      res.json({ 
        success: true,
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
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
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
      
      // If the user is registering as a salesperson, create salesperson record
      if (user.role === "salesperson") {
        try {
          const salespersonData = {
            userId: user.id,
            profileUrl: user.username, // Use username as profile URL
            nfcId: `nfc_${user.username}_${Date.now()}`, // Generate unique NFC ID
            bio: `Hello! I'm ${user.fullName}, your dedicated sales representative at Global Home Solutions. I'm here to help you find the perfect contractors for your home improvement projects.`,
            totalLeads: 0,
            totalVisits: 0,
            successfulConversions: 0,
            conversionRate: 0,
            commissions: 0
          };
          
          await storage.createSalesperson(salespersonData);
        } catch (error) {
          console.error("Failed to create salesperson record:", error);
          // Continue with user creation even if salesperson creation fails
        }
      }
      
      // If the user is registering as a contractor, create contractor record
      if (user.role === "contractor") {
        try {
          const contractorData = {
            userId: user.id,
            companyName: `${user.fullName} Services`, // Default company name
            description: "Professional contracting services for all your home improvement needs.",
            specialties: ["General Contracting"],
            hourlyRate: 75.0,
            monthlySpendCap: 1000.0,
            paymentMethodAdded: false,
            mediaFiles: [],
            isActive: true,
            subscriptionTier: "basic",
            reviewCount: 0,
            rating: null
          };
          
          await storage.createContractor(contractorData);
        } catch (error) {
          console.error("Failed to create contractor record:", error);
          // Continue with user creation even if contractor creation fails
        }
      }
      
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
  // Create contractor endpoint (admin only)
  apiRouter.post("/contractors", isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const {
        username,
        password,
        fullName,
        email,
        phone,
        companyName,
        description,
        hourlyRate,
        serviceAreas
      } = req.body;

      // Validate required fields
      if (!username || !password || !fullName || !email || !companyName) {
        return res.status(400).json({ message: "Username, password, full name, email, and company name are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user account
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        fullName,
        email,
        phone: phone || null,
        role: 'contractor'
      });

      // Create contractor profile
      const newContractor = await storage.createContractor({
        userId: newUser.id,
        companyName,
        description: description || '',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        serviceAreas: serviceAreas || [],
        isActive: true
      });

      res.status(201).json({ 
        message: "Contractor created successfully",
        contractor: newContractor,
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone
        }
      });
    } catch (error) {
      console.error('Error creating contractor:', error);
      res.status(500).json({ message: "Failed to create contractor" });
    }
  });

  apiRouter.get("/contractors", async (req: Request, res: Response) => {
    try {
      const allContractors = await storage.getAllContractors();
      
      // Filter out archived contractors (where isActive is false)
      const activeContractors = allContractors.filter(contractor => contractor.isActive !== false);
      
      // Fetch user data for each active contractor
      const contractorsWithUserData = await Promise.all(
        activeContractors.map(async (contractor) => {
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
      const allFeaturedContractors = await storage.getFeaturedContractors(limit * 2); // Get more to account for filtering
      
      // Filter out archived contractors
      const activeFeaturedContractors = allFeaturedContractors
        .filter(contractor => contractor.isActive !== false)
        .slice(0, limit); // Take only the requested number after filtering
      
      // Fetch user data for each active contractor
      const contractorsWithUserData = await Promise.all(
        activeFeaturedContractors.map(async (contractor) => {
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

  // Update contractor endpoint
  apiRouter.patch("/contractors/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const contractor = await storage.getContractor(id);
      
      if (!contractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      
      // Check if user owns this contractor profile or is admin
      if (req.user.role !== "admin" && contractor.userId !== req.user.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedContractor = await storage.updateContractor(id, req.body);
      res.json({ contractor: updatedContractor });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public contractor registration endpoint
  apiRouter.post("/contractors/register", async (req: Request, res: Response) => {
    try {
      const {
        username,
        password,
        fullName,
        email,
        phone,
        companyName,
        licenseNumber,
        insuranceProvider,
        businessAddress,
        yearsInBusiness,
        employeeCount,
        specialties,
        serviceAreas,
        portfolioDescription,
        websiteUrl,
        certifications,
        additionalNotes
      } = req.body;

      // Validate required fields
      if (!username || !password || !fullName || !email || !phone || !companyName || !licenseNumber || !insuranceProvider || !businessAddress || !yearsInBusiness || !employeeCount || !specialties || specialties.length === 0 || !serviceAreas || !portfolioDescription) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "This username is already taken" });
      }

      // Create user account
      console.log("Creating user with username:", username, "password:", password);
      const userData = {
        username,
        fullName,
        email,
        phone,
        role: "contractor",
        password // In production, hash this
      };
      console.log("User data to insert:", userData);
      
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user.id, user.username);

      // Create contractor profile
      const contractor = await storage.createContractor({
        userId: user.id,
        companyName,
        description: portfolioDescription,
        specialties,
        isVerified: false,
        isActive: true
      });
      console.log("Contractor created successfully:", contractor.id);

      res.status(201).json({ 
        success: true,
        contractor: {
          id: contractor.id,
          companyName: contractor.companyName,
          username: user.username
        },
        message: "Registration successful! You can now log in to your contractor portal."
      });
    } catch (error) {
      console.error("Error registering contractor:", error);
      res.status(500).json({ message: "Registration failed", error: error.message });
    }
  });

  // Debug endpoint to check users
  apiRouter.get("/debug/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      console.log("All users in database:", users.map(u => ({ id: u.id, username: u.username, role: u.role })));
      res.json({ users: users.map(u => ({ id: u.id, username: u.username, role: u.role, email: u.email })) });
    } catch (error) {
      console.error("Error fetching users:", error);
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

  // Get bid requests for a specific contractor - NO AUTH REQUIRED  
  apiRouter.get("/bid-requests-for-contractor/:id", async (req: Request, res: Response) => {
    try {
      const contractorId = Number(req.params.id);
      console.log("Fetching bid requests for contractor:", contractorId);
      
      const bidRequests = await storage.getBidRequestsByContractorId(contractorId);
      console.log("Found bid requests:", bidRequests.length);
      console.log("Bid requests data:", JSON.stringify(bidRequests, null, 2));
      
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ bidRequests });
    } catch (error) {
      console.error("Error fetching contractor bid requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get bid requests for a specific contractor (original endpoint)
  apiRouter.get("/contractors/:id/bid-requests", async (req: Request, res: Response) => {
    try {
      const contractorId = Number(req.params.id);
      console.log("Fetching bid requests for contractor:", contractorId);
      
      // Debug: Show all bid requests to see what's in storage
      const allBidRequests = await storage.getRecentBidRequests(50);
      console.log("All bid requests in system:", allBidRequests.length);
      console.log("All bid requests:", JSON.stringify(allBidRequests.map(br => ({ 
        id: br.id, 
        contractorId: br.contractorId, 
        fullName: br.fullName 
      })), null, 2));
      
      const bidRequests = await storage.getBidRequestsByContractorId(contractorId);
      console.log("Found bid requests for contractor", contractorId, ":", bidRequests.length);
      console.log("Bid requests data:", JSON.stringify(bidRequests, null, 2));
      
      res.setHeader('Content-Type', 'application/json');
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

  // Create bid request - public endpoint for customers with optional file upload support
  apiRouter.post("/bid-requests", upload.array('media', 10), async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    let client;
    
    try {
      console.log('Processing bid request submission...');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const {
        fullName,
        email,
        phone,
        address,
        serviceRequested,
        description,
        timeline,
        budget,
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
        console.log('Validation failed - missing required fields:', {
          fullName: !!finalFullName,
          email: !!finalEmail,
          phone: !!finalPhone,
          description: !!finalDescription,
          address: !!finalAddress,
          timeline: !!finalTimeline,
          contractorId: !!contractorId
        });
        return res.status(400).json({ 
          success: false,
          message: "All required fields must be provided",
          missingFields: {
            fullName: !finalFullName,
            email: !finalEmail,
            phone: !finalPhone,
            description: !finalDescription,
            address: !finalAddress,
            timeline: !finalTimeline,
            contractorId: !contractorId
          }
        });
      }

      // Process uploaded files with error handling
      let mediaUrls: string[] = [];
      try {
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
          console.log(`Processing ${files.length} uploaded files`);
          mediaUrls = files.map((file, index) => {
            const base64Data = file.buffer.toString('base64');
            const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
            return dataUrl;
          });
          console.log('Files processed successfully');
        }
      } catch (fileError) {
        console.error('Error processing files:', fileError);
        // Continue without files rather than failing the entire request
      }

      // Create bid request with proper data validation
      const bidRequestData = {
        contractorId: Number(contractorId),
        salespersonId: salespersonId ? Number(salespersonId) : null,
        fullName: String(finalFullName).trim(),
        email: String(finalEmail).trim().toLowerCase(),
        phone: String(finalPhone).trim(),
        address: String(finalAddress).trim(),
        serviceRequested: String(serviceRequested || "General Services").trim(),
        description: String(finalDescription).trim(),
        timeline: String(finalTimeline).trim(),
        budget: budget ? String(budget).trim() : null,
        preferredContactMethod: String(preferredContactMethod || "email").trim(),
        additionalInformation: additionalInformation || (mediaUrls.length > 0 ? JSON.stringify({ mediaUrls }) : null)
      };

      console.log('Creating bid request with data:', JSON.stringify(bidRequestData, null, 2));

      // Create the bid request with retry logic and timeout handling
      const bidRequest = await Promise.race([
        retryDatabaseOperation(() => storage.createBidRequest(bidRequestData), 3),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timeout')), 20000)
        )
      ]) as any;

      console.log('Bid request created successfully:', bidRequest.id);
      console.log('About to create commission record...');

      // Create commission record (either for salesperson or admin if no salesperson)
      try {
        console.log('Entering commission creation block');
        if (bidRequest.salespersonId) {
          console.log('Creating commission record for salesperson:', bidRequest.salespersonId);
        } else {
          console.log('No salesperson reference - commission will be assigned to admin');
        }
        console.log('Importing CommissionService...');
        const { CommissionService } = await import('./commission-service');
        console.log('Calling createCommissionForBidRequest...');
        await CommissionService.createCommissionForBidRequest(bidRequest, bidRequest.salespersonId);
        console.log('Commission record created successfully');
      } catch (commissionError) {
        console.error('Error creating commission record:', commissionError);
        console.error('Commission error stack:', commissionError.stack);
        // Don't fail the entire request for commission errors
      }

      // Send WebSocket notification with error handling
      try {
        const contractorWSConnections = contractorConnections.get(Number(contractorId)) || [];
        if (contractorWSConnections.length > 0) {
          const notification = {
            type: 'NEW_BID_REQUEST',
            data: {
              id: bidRequest.id,
              customerName: bidRequest.fullName,
              projectDescription: bidRequest.description,
              timeline: bidRequest.timeline,
              budget: bidRequest.budget,
              email: bidRequest.email,
              phone: bidRequest.phone,
              address: bidRequest.address,
              createdAt: bidRequest.createdAt
            }
          };

          contractorWSConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(notification));
            }
          });
          console.log('Real-time notification sent to contractor:', contractorId);
        }
      } catch (wsError) {
        console.error('WebSocket notification error:', wsError);
        // Continue without failing the request
      }

      res.status(201).json({ 
        message: 'Bid request created successfully',
        bidRequest,
        salesRepAttributed: !!bidRequest.salespersonId
      });

    } catch (error) {
      console.error("Critical error creating bid request:", error);
      
      // Provide detailed error information
      let errorMessage = "Failed to submit bid request";
      let statusCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
          statusCode = 408;
        } else if (error.message.includes('connection')) {
          errorMessage = "Database connection issue. Please try again.";
          statusCode = 503;
        } else if (error.message.includes('validation')) {
          errorMessage = "Invalid data provided";
          statusCode = 400;
        }
        
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }

      res.status(statusCode).json({ 
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    } finally {
      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          console.error('Error releasing database client:', releaseError);
        }
      }
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

  // Simplified endpoint for bid status updates - using POST instead of PATCH
  apiRouter.post("/update-bid-status", async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      console.log('Bid status update request - Body:', req.body);
      const { id, status } = req.body;
      
      if (!id || !status) {
        console.log('Missing required fields - id:', id, 'status:', status);
        return res.status(400).json({ message: "ID and status are required" });
      }
      
      if (!['pending', 'contacted', 'completed', 'bid_sent', 'not_interested', 'no_response', 'won', 'lost'].includes(status)) {
        console.log('Invalid status received:', status);
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const bidRequest = await storage.getBidRequest(Number(id));
      if (!bidRequest) {
        console.log('Bid request not found for ID:', id);
        return res.status(404).json({ message: "Bid request not found" });
      }
      
      console.log('Updating bid request status from', bidRequest.status, 'to', status);
      const updatedRequest = await storage.updateBidRequestStatus(Number(id), status);
      console.log('Status updated successfully:', updatedRequest);
      
      res.json({ success: true, bidRequest: updatedRequest });
    } catch (error) {
      console.error('Error updating bid request status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Keep the original PATCH endpoint for backward compatibility
  apiRouter.patch("/contractor/bid-requests/:id/status", async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      console.log('Contractor status update - ID:', req.params.id, 'Body:', req.body);
      const id = Number(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'contacted', 'completed', 'bid_sent', 'not_interested', 'no_response', 'won', 'lost'].includes(status)) {
        console.log('Invalid status received:', status);
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const bidRequest = await storage.getBidRequest(id);
      if (!bidRequest) {
        console.log('Bid request not found for ID:', id);
        return res.status(404).json({ message: "Bid request not found" });
      }
      
      console.log('Updating bid request status from', bidRequest.status, 'to', status);
      const updatedRequest = await storage.updateBidRequestStatus(id, status);
      console.log('Status updated successfully:', updatedRequest);
      
      res.json({ success: true, bidRequest: updatedRequest });
    } catch (error) {
      console.error('Error updating bid request status:', error);
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
  
  // Salesperson profile route by ID - publicly accessible
  apiRouter.get("/salesperson/id/:id", async (req: Request, res: Response) => {
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
  
  // Generate QR code for salesperson's landing page - public access
  apiRouter.get("/salespersons/:id/qrcode", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      // This endpoint is now public, no need for authentication checks
      
      // Construct the URL for the salesperson's tracked landing page
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
        visitedAt: new Date(),
        userAgent: userAgent || null,
        referrer: referrer || null,
        converted: false
      });

      // Increment total visits for the salesperson
      await storage.incrementSalespersonStats(salesperson.id, 'totalVisits');

      res.json({ 
        success: true, 
        visitId: pageVisit.id,
        salesperson: {
          id: salesperson.id,
          fullName: salesperson.fullName,
          profileUrl: salesperson.profileUrl
        }
      });
    } catch (error) {
      console.error("Error tracking page visit:", error);
      res.status(500).json({ message: "Error tracking visit" });
    }
  });

  // Service categories endpoint
  apiRouter.get("/service-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllServiceCategories();
      res.json({ services: categories });
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
  
  // Create WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'CONTRACTOR_CONNECT' && data.contractorId) {
          const contractorId = Number(data.contractorId);
          
          // Add this connection to the contractor's connections
          if (!contractorConnections.has(contractorId)) {
            contractorConnections.set(contractorId, []);
          }
          contractorConnections.get(contractorId)!.push(ws);
          
          console.log(`Contractor ${contractorId} connected for real-time notifications`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'CONNECTION_CONFIRMED',
            contractorId: contractorId
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove this connection from all contractor lists
      contractorConnections.forEach((connections, contractorId) => {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
          console.log(`Contractor ${contractorId} disconnected from real-time notifications`);
          
          // Clean up empty arrays
          if (connections.length === 0) {
            contractorConnections.delete(contractorId);
          }
        }
      });
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Delete bid request
  apiRouter.delete("/bid-requests/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Mark as deleted by updating status
      const deletedBidRequest = await storage.updateBidRequestStatus(parseInt(id), 'deleted');
      
      if (!deletedBidRequest) {
        return res.status(404).json({ success: false, message: "Bid request not found" });
      }
      
      res.json({ success: true, message: "Bid request deleted successfully" });
    } catch (error) {
      console.error('Error deleting bid request:', error);
      res.status(500).json({ success: false, message: "Failed to delete bid request" });
    }
  });
  
  return httpServer;
}
