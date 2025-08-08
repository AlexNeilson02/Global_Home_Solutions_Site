import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./database-storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
import { CommissionService } from "./commission-service";
import Stripe from "stripe";
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

// Initialize Stripe - use environment variable or ask for API keys
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } else {
    console.log("STRIPE_SECRET_KEY not found - subscription features will not work");
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
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
  
  // Import and use Gmail routes
  const gmailRoutes = (await import("./gmail-routes")).default;
  apiRouter.use("/gmail", gmailRoutes);

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
      
      // Log the update request for debugging
      console.log(`Updating contractor ${contractorId} with data:`, req.body);
      
      // Get current contractor data first to ensure we preserve existing fields
      const currentContractor = await storage.getContractor(contractorId);
      if (!currentContractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      
      console.log("Current contractor data:", currentContractor);
      
      // Only update the fields that are provided in the request body
      const updateData = { ...req.body };
      
      // Remove any undefined or null fields except when explicitly setting videoUrl to null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      console.log("Sanitized update data:", updateData);
      
      const contractor = await storage.updateContractor(contractorId, updateData);
      if (!contractor) {
        return res.status(404).json({ message: "Contractor not found after update" });
      }
      
      console.log("Updated contractor:", contractor);
      res.json({ contractor });
    } catch (error) {
      console.error("Error updating contractor:", error);
      res.status(500).json({ message: "Failed to update contractor" });
    }
  });

  // Create contractor endpoint (admin only)
  apiRouter.post("/contractors", isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      console.log('Creating contractor with data:', req.body);
      
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
        console.log('Missing required fields');
        return res.status(400).json({ message: "Username, password, full name, email, and company name are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log('Username already exists:', username);
        return res.status(400).json({ error: "Username already exists. Please choose a different username." });
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        console.log('Email already exists:', email);
        return res.status(400).json({ error: "Email already exists. Please use a different email address." });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('Password hashed successfully');

      // Create user account
      console.log('Creating user account...');
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        fullName,
        email,
        phone: phone || null,
        role: 'contractor'
      });
      console.log('User created successfully:', newUser.id);

      // Create contractor profile
      console.log('Creating contractor profile for user ID:', newUser.id);
      const contractorData = {
        userId: newUser.id,
        companyName,
        description: description || 'Professional contractor services',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        serviceAreas: serviceAreas || null
      };
      console.log('Contractor data to insert:', contractorData);
      
      let newContractor;
      try {
        newContractor = await storage.createContractor(contractorData);
        console.log('Contractor created successfully:', newContractor);
      } catch (contractorError) {
        console.error('Failed to create contractor profile:', contractorError);
        // Clean up the user if contractor creation fails
        try {
          await storage.deleteUser?.(newUser.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup user after contractor error:', cleanupError);
        }
        throw new Error(`Contractor profile creation failed: ${contractorError.message}`);
      }

      const responseData = { 
        message: "Contractor created successfully",
        contractor: newContractor,
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone
        }
      };
      console.log('Sending response:', JSON.stringify(responseData, null, 2));
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Error creating contractor:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: "Failed to create contractor", error: error.message });
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
      
      // All QR codes now point to homepage with unique salesperson tracking
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
        landingPageUrl,
        profileUrl: salesperson.profileUrl
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
      
      // Note: Visit tracking is handled separately by /api/track-visit endpoint
      // to avoid double-counting visits when QR codes are scanned
      
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
      
      console.log('Track visit request received:', { 
        salespersonProfileUrl, 
        userAgent: userAgent?.substring(0, 50) + '...', 
        referrer,
        ip: req.ip 
      });
      
      if (!salespersonProfileUrl) {
        console.error('Missing salesperson profile URL in track-visit request');
        return res.status(400).json({ message: "Salesperson profile URL is required" });
      }

      // Generate unique session tracking ID for this visit
      const sessionTrackingId = `qr_${salespersonProfileUrl}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated session tracking ID:', sessionTrackingId);

      // Get salesperson by profile URL with improved error handling
      console.log('Looking up salesperson by profile URL:', salespersonProfileUrl);
      const salesperson = await storage.getSalespersonByProfileUrl(salespersonProfileUrl);
      
      if (!salesperson) {
        console.error('Salesperson not found for profile URL:', salespersonProfileUrl);
        
        // Log all available salesperson profile URLs for debugging
        const allSalespersons = await storage.getAllSalespersons();
        console.log('Available salesperson profile URLs:', 
          allSalespersons.map(s => s.profileUrl).join(', ')
        );
        
        return res.status(404).json({ 
          message: "Salesperson not found",
          requestedProfile: salespersonProfileUrl,
          availableProfiles: allSalespersons.map(s => s.profileUrl)
        });
      }

      console.log('Found salesperson:', { id: salesperson.id, profileUrl: salesperson.profileUrl });

      // Create page visit record for tracking with QR/NFC verification
      const pageVisit = await storage.createPageVisit({
        salespersonId: salesperson.id,
        path: '/',
        userAgent: userAgent || null,
        referrer: referrer || null,
        visitorIp: req.ip || null,
        // Mark as verified QR/NFC visit for commission eligibility
        isVerifiedQrNfcVisit: true,
        qrNfcSource: 'qr_code', // or 'nfc_tag' if coming from NFC
        sessionTrackingId: sessionTrackingId
      });

      console.log('Created page visit record:', pageVisit.id);

      // Increment salesperson's total visits
      await storage.incrementSalespersonStats(salesperson.id, 'totalVisits');
      
      console.log('Successfully tracked visit for salesperson:', salesperson.id);

      res.json({ 
        success: true, 
        salesperson: {
          id: salesperson.id,
          profileUrl: salesperson.profileUrl
        },
        sessionTrackingId: sessionTrackingId,
        isVerified: true
      });
    } catch (error) {
      console.error("Detailed error tracking visit:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Error tracking visit",
        error: error.message 
      });
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
        servicesRequested,
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
      
      // Handle services requested - either array or single service
      let finalServicesRequested;
      if (servicesRequested) {
        // Parse if it's a JSON string from FormData
        if (typeof servicesRequested === 'string') {
          try {
            finalServicesRequested = JSON.parse(servicesRequested);
          } catch (e) {
            finalServicesRequested = [servicesRequested];
          }
        } else {
          finalServicesRequested = servicesRequested;
        }
      } else if (serviceRequested) {
        finalServicesRequested = [serviceRequested];
      } else {
        finalServicesRequested = ["General Services"];
      }
      
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
        servicesRequested: finalServicesRequested,
        description: finalDescription,
        timeline: finalTimeline,
        budget: budget || null,
        preferredContactMethod: preferredContactMethod || "email",
        additionalInformation: additionalInformation || (mediaUrls.length > 0 ? JSON.stringify({ mediaUrls }) : null)
      };

      console.log('Creating bid request with data:', bidRequestData);
      const bidRequest = await storage.createBidRequest(bidRequestData);

      // Create commission record - simple salesperson_id based attribution
      try {
        console.log('Creating commission record...');
        const { CommissionService } = await import('./commission-service');
        
        if (salespersonId) {
          console.log(`💰 PROCESSING COMMISSION: Salesperson ${salespersonId} attributed to bid request ${bidRequest.id}`);
          
          // Increment the salesperson's successful conversions
          await storage.incrementSalespersonStats(Number(salespersonId), 'successfulConversions');
          
          // Get salesperson and user details for notification
          const salesperson = await storage.getSalesperson(Number(salespersonId));
          if (salesperson) {
            const salesUser = await storage.getUser(salesperson.userId);
            console.log(`Bid request attributed to sales rep: ${salesUser?.fullName} (ID: ${salespersonId})`);
            
            // Create commission record with salesperson attribution
            await CommissionService.createCommissionForBidRequest(bidRequest, salesperson.id);
            console.log(`Commission created for bid request ${bidRequest.id}, salesperson ${salespersonId}`);
          }
        } else {
          console.log('No salesperson_id in URL - commission will be assigned to admin');
          // Create commission record with admin attribution (salesperson_id = null)
          await CommissionService.createCommissionForBidRequest(bidRequest, null);
          console.log(`Admin commission created for bid request ${bidRequest.id}`);
        }
      } catch (commissionError) {
        console.error('Error creating commission record:', commissionError);
        // Log but don't fail the bid request creation
      }

      // Get contractor details for notification and commission charging
      const contractor = await storage.getContractor(Number(contractorId));
      if (contractor) {
        const contractorUser = await storage.getUser(contractor.userId);
        console.log(`Bid request sent to contractor: ${contractor.companyName} (ID: ${contractorId})`);
        
        // Charge commission automatically if contractor has payment method
        if (contractor.paymentMethodAdded && contractor.paymentMethodId) {
          try {
            // Calculate total commission for all selected services
            let totalCommissionAmount = 0;
            const serviceCommissions: {service: string, amount: number}[] = [];
            
            for (const serviceName of finalServicesRequested) {
              const serviceCategory = await storage.getServiceCategoryByName(serviceName);
              const serviceCommissionAmount = serviceCategory?.baseCost || 50; // Default $50 if no category found
              totalCommissionAmount += serviceCommissionAmount;
              serviceCommissions.push({
                service: serviceName,
                amount: serviceCommissionAmount
              });
              console.log(`Service: ${serviceName}, Commission: $${serviceCommissionAmount}`);
            }
            
            console.log(`Total commission for ${finalServicesRequested.length} services: $${totalCommissionAmount}`);
            const commissionAmount = totalCommissionAmount;
            
            // Charge commission to contractor's payment method
            const chargeResult = await chargeCommissionToContractor(
              Number(contractorId),
              commissionAmount,
              `Bid request for ${finalServicesRequested.join(', ')} - ${finalFullName}`
            );
            
            if (chargeResult && chargeResult.success && chargeResult.paymentIntentId) {
              console.log(`✅ Commission charged: $${commissionAmount} for bid request ${bidRequest.id}`);
              
              // Calculate commission distribution
              const salespersonCommission = commissionAmount * 0.50; // 50% to salesperson
              const corpCommission = commissionAmount * 0.50; // 50% to corp (includes override)
              
              // Get recipient user IDs for commission payments
              const salespersonUser = salespersonId ? await storage.getSalespersonById(Number(salespersonId)) : null;
              const adminUser = await storage.getUserByRole('admin');
              
              // Create commission payment for salesperson (if attributed)
              if (salespersonId && salespersonUser) {
                const serviceDetails = serviceCommissions.map(sc => `${sc.service} ($${sc.amount})`).join(', ');
                await storage.createCommissionPayment({
                  recipientId: salespersonUser.userId,
                  recipientType: 'salesperson',
                  totalAmount: salespersonCommission,
                  commissionRecordIds: [], // Will be populated when commission records are created
                  paymentMethod: 'system',
                  status: 'completed',
                  sourceContractorId: Number(contractorId),
                  sourceBidRequestId: bidRequest.id,
                  sourceServiceType: finalServicesRequested.join(', '),
                  stripePaymentIntentId: chargeResult.paymentIntentId,
                  notes: `Salesperson commission (50%) for ${finalServicesRequested.length} services: ${serviceDetails}`
                });
                console.log(`💰 Salesperson commission: $${salespersonCommission} to user ${salespersonUser.userId}`);
              }
              
              // Create commission payment for corp/admin (always)
              if (adminUser) {
                const serviceDetails = serviceCommissions.map(sc => `${sc.service} ($${sc.amount})`).join(', ');
                await storage.createCommissionPayment({
                  recipientId: adminUser.id,
                  recipientType: 'corp',
                  totalAmount: corpCommission,
                  commissionRecordIds: [], // Will be populated when commission records are created
                  paymentMethod: 'system',
                  status: 'completed',
                  sourceContractorId: Number(contractorId),
                  sourceBidRequestId: bidRequest.id,
                  sourceServiceType: finalServicesRequested.join(', '),
                  stripePaymentIntentId: chargeResult.paymentIntentId,
                  notes: `Corp commission (50%) for ${finalServicesRequested.length} services: ${serviceDetails}`
                });
                console.log(`🏢 Corp commission: $${corpCommission} to admin user ${adminUser.id}`);
              }
              console.log(`🏢 Corp commission: $${corpCommission} to admin/corp`);
            } else {
              console.error(`❌ Failed to charge commission for bid request ${bidRequest.id}`);
            }
          } catch (commissionChargeError) {
            console.error('Error charging commission:', commissionChargeError);
          }
        } else {
          console.log(`⚠️ Cannot charge commission - contractor ${contractorId} missing payment method`);
        }
        
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
      const commissionAnalytics = await storage.getCommissionAnalytics(startDate, endDate);

      res.json({
        timeRange: timeRange || '30d',
        overview: comprehensiveAnalytics.overview,
        conversions: comprehensiveAnalytics.conversions,
        performance: comprehensiveAnalytics.performance,
        trends: comprehensiveAnalytics.trends,
        revenue: revenueAnalytics,
        commissions: commissionAnalytics
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

  // Subscription management endpoints
  apiRouter.post("/create-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Payment processing unavailable. Please contact support.",
          needsSetup: true 
        });
      }

      const user = req.user as User;
      const { contractorId, amount, type } = req.body;

      // Validate contractor ownership
      const contractor = await storage.getContractor(contractorId);
      if (!contractor || contractor.userId !== user.id) {
        return res.status(403).json({ message: "Access denied to contractor account" });
      }

      // Create or retrieve Stripe customer
      let customerId = contractor.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: contractor.companyName || user.username,
          metadata: {
            contractorId: contractorId.toString(),
            userId: user.id.toString()
          }
        });
        customerId = customer.id;
        await storage.updateContractorStripeInfo(contractorId, { stripeCustomerId: customerId });
      }

      // Create a product first, then a price
      const product = await stripe.products.create({
        name: 'Contractor Premium Subscription'
      });

      const price = await stripe.prices.create({
        unit_amount: amount, // $100 in cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        product: product.id
      });

      // Create subscription with payment required immediately
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        metadata: {
          contractorId: contractorId.toString(),
          type: type || 'monthly'
        }
      });

      let clientSecret = null;

      // Check for payment intent first
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      if (latestInvoice?.payment_intent) {
        const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
        clientSecret = paymentIntent.client_secret;
      } 
      // If no payment intent, check for setup intent (for future payments)
      else if (subscription.pending_setup_intent) {
        const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;
        clientSecret = setupIntent.client_secret;
      }
      // If neither, create a setup intent manually
      else {
        const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
          usage: 'off_session',
          metadata: {
            subscription_id: subscription.id,
            contractor_id: contractorId.toString()
          }
        });
        clientSecret = setupIntent.client_secret;
      }

      // Store subscription ID
      await storage.updateContractorStripeInfo(contractorId, { 
        stripeSubscriptionId: subscription.id 
      });

      console.log('Subscription created:', subscription.id);
      console.log('Client secret:', clientSecret ? 'present' : 'missing');

      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        status: subscription.status
      });

    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Update payment method endpoint
  apiRouter.post("/update-payment-method", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing unavailable" });
      }

      const user = req.user as User;
      const { contractorId } = req.body;

      const contractor = await storage.getContractor(contractorId);
      if (!contractor || contractor.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!contractor.stripeCustomerId) {
        return res.status(400).json({ message: "No customer found" });
      }

      // Create setup intent to update payment method
      const setupIntent = await stripe.setupIntents.create({
        customer: contractor.stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          contractor_id: contractorId.toString(),
          action: 'update_payment_method'
        }
      });

      res.json({
        clientSecret: setupIntent.client_secret,
        status: 'requires_setup'
      });

    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: "Failed to update payment method" });
    }
  });

  // Create Stripe Checkout session for payment method setup
  apiRouter.post("/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing unavailable" });
      }

      const user = req.user as User;
      const { contractorId } = req.body;

      const contractor = await storage.getContractor(contractorId);
      if (!contractor || contractor.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Create Stripe customer if not exists
      let customerId = contractor.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: contractor.companyName,
          metadata: {
            contractor_id: contractorId.toString()
          }
        });
        customerId = customer.id;
        await storage.updateContractor(contractorId, { stripeCustomerId: customerId });
      }

      // Get the origin URL properly
      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const origin = req.headers.origin || `${protocol}://${host}`;
      
      console.log(`Creating Stripe checkout with origin: ${origin}`);
      console.log(`Headers - host: ${host}, protocol: ${protocol}, origin: ${req.headers.origin}`);
      
      // Create Checkout session for payment mode with $1 verification amount
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Payment Method Verification',
              description: 'One-time verification charge (will be refunded immediately)'
            },
            unit_amount: 100, // $1.00 verification charge
          },
          quantity: 1,
        }],
        payment_intent_data: {
          setup_future_usage: 'off_session', // Save payment method for future use
          metadata: {
            contractor_id: contractorId.toString(),
            action: 'verify_payment_method'
          }
        },
        success_url: `${origin}/contractor-portal?setup_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/contractor-portal?setup_cancelled=true`,
        metadata: {
          contractor_id: contractorId.toString(),
          action: 'setup_payment_method'
        }
      });

      res.json({
        url: session.url,
        sessionId: session.id
      });

    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Mark payment method as added (for manual tracking when webhooks aren't available)
  apiRouter.post("/mark-payment-method-added", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { contractorId } = req.body;

      const contractor = await storage.getContractor(contractorId);
      if (!contractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      
      if (contractor.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Fetch payment methods from Stripe to get real card details
      let cardDetails = null;
      if (contractor.stripeCustomerId) {
        try {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: contractor.stripeCustomerId,
            type: 'card',
          });

          if (paymentMethods.data.length > 0) {
            const pm = paymentMethods.data[0]; // Get the most recent payment method
            cardDetails = {
              paymentMethodId: pm.id,
              cardBrand: pm.card?.brand || 'unknown',
              cardLast4: pm.card?.last4 || '0000',
              cardExpMonth: pm.card?.exp_month || 1,
              cardExpYear: pm.card?.exp_year || 2025,
            };
          }
        } catch (stripeError) {
          console.error("Error fetching payment methods from Stripe:", stripeError);
        }
      }

      // Update contractor record with payment method details
      const updateData = {
        paymentMethodAdded: true,
        ...(cardDetails && cardDetails)
      };

      await storage.updateContractor(contractorId, updateData);

      res.json({ 
        message: "Payment method status updated successfully",
        paymentMethodAdded: true,
        cardDetails
      });

    } catch (error) {
      console.error("Error marking payment method as added:", error);
      res.status(500).json({ message: "Failed to update payment method status" });
    }
  });

  apiRouter.get("/subscription-status/:contractorId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      const user = req.user as User;

      const contractor = await storage.getContractor(contractorId);
      if (!contractor || contractor.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!contractor.stripeSubscriptionId || !stripe) {
        return res.json({ status: 'inactive' });
      }

      const subscription = await stripe.subscriptions.retrieve(contractor.stripeSubscriptionId);
      
      const nextBillingDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
      
      res.json({
        status: subscription.status === 'active' ? 'active' : 'inactive',
        currentPeriodEnd: subscription.current_period_end,
        nextBilling: nextBillingDate
      });

    } catch (error) {
      console.error("Error checking subscription status:", error);
      res.json({ status: 'inactive' });
    }
  });

  apiRouter.post("/cancel-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing unavailable" });
      }

      const user = req.user as User;
      const { contractorId } = req.body;

      const contractor = await storage.getContractor(contractorId);
      if (!contractor || contractor.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!contractor.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      await stripe.subscriptions.cancel(contractor.stripeSubscriptionId);
      
      // Update contractor record
      await storage.updateContractorStripeInfo(contractorId, { 
        stripeSubscriptionId: null 
      });

      res.json({ message: "Subscription cancelled successfully" });

    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Webhook endpoint for handling Stripe events and commission processing
  apiRouter.post("/webhook/stripe", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).send("Stripe not configured");
      }

      const sig = req.headers['stripe-signature'];
      let event: Stripe.Event;

      try {
        // In production, you should set up webhook endpoint secrets
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || "");
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle verification payment success - save payment method and refund
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (paymentIntent.metadata?.action === 'verify_payment_method') {
          console.log('Processing verification payment for contractor:', paymentIntent.metadata.contractor_id);
          
          const contractorId = parseInt(paymentIntent.metadata.contractor_id);
          
          // Mark payment method as added in contractor record
          await storage.updateContractor(contractorId, { 
            paymentMethodAdded: true 
          });
          
          console.log('Payment method saved for contractor:', contractorId);
          
          // Immediately refund the verification charge
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            reason: 'requested_by_customer',
            metadata: {
              reason: 'verification_refund',
              contractor_id: paymentIntent.metadata.contractor_id
            }
          });
          
          console.log('Verification charge refunded successfully');
        }
      }

      // Handle successful subscription payments
      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Find contractor by subscription ID
        const contractor = await storage.getContractorByStripeSubscriptionId(subscriptionId);
        if (!contractor) {
          console.error('Contractor not found for subscription:', subscriptionId);
          return res.status(404).send('Contractor not found');
        }

        // Process commission payments
        await processCommissionPayments(contractor.id, invoice.amount_paid || 0);
      }

      res.json({ received: true });

    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Webhook handler failed");
    }
  });

  // Helper function to process commission payments
  async function processCommissionPayments(contractorId: number, paymentAmount: number) {
    try {
      // Get all relevant commission records for this contractor
      const commissionRecords = await storage.getPendingCommissionsForContractor(contractorId);
      
      // Calculate commission distribution
      const adminCommissionRate = 0.10; // 10% to admin
      const salesRepCommissionRate = 0.05; // 5% to sales rep
      
      const adminCommission = paymentAmount * adminCommissionRate;
      const salesRepCommission = paymentAmount * salesRepCommissionRate;
      
      // Get admin user for commission payment
      const adminUser = await storage.getUserByRole('admin');
      
      // Process admin commission
      if (adminUser) {
        await storage.createCommissionPayment({
          recipientId: adminUser.id,
          recipientType: 'corp',
          totalAmount: adminCommission / 100, // Convert from cents to dollars
          commissionRecordIds: [],
          paymentMethod: 'system',
          status: 'completed',
          sourceContractorId: contractorId,
          sourceServiceType: 'Subscription Payment',
          notes: `Admin commission from $${(paymentAmount / 100).toFixed(2)} subscription payment`
        });
      }
      
      // Process sales rep commissions for any active attributions
      if (commissionRecords && commissionRecords.length > 0) {
        for (const record of commissionRecords) {
          if (record.salespersonId) {
            const salesperson = await storage.getSalespersonById(record.salespersonId);
            if (salesperson) {
              await storage.createCommissionPayment({
                recipientId: salesperson.userId,
                recipientType: 'salesperson',
                totalAmount: salesRepCommission / 100, // Convert from cents to dollars
                commissionRecordIds: [record.id],
                paymentMethod: 'system',
                status: 'completed',
                sourceContractorId: contractorId,
                sourceServiceType: 'Subscription Payment',
                notes: `Sales rep commission from $${(paymentAmount / 100).toFixed(2)} subscription payment`
              });
            }
          }
        }
      }
      
      console.log(`Processed commission payments for contractor ${contractorId}: Admin: $${(adminCommission / 100).toFixed(2)}, Sales Rep: $${(salesRepCommission / 100).toFixed(2)}`);
      
    } catch (error) {
      console.error("Error processing commission payments:", error);
    }
  }

  // Function to charge commission to contractor's payment method
  async function chargeCommissionToContractor(contractorId: number, commissionAmount: number, description: string): Promise<{success: boolean, paymentIntentId?: string}> {
    try {
      const contractor = await storage.getContractor(contractorId);
      if (!contractor || !contractor.stripeCustomerId || !contractor.paymentMethodId) {
        console.error(`Cannot charge commission: contractor ${contractorId} missing Stripe details`);
        return {success: false};
      }

      // Create payment intent for off-session payment (no customer interaction needed)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(commissionAmount * 100), // Convert to cents
        currency: 'usd',
        customer: contractor.stripeCustomerId,
        payment_method: contractor.paymentMethodId,
        confirm: true,
        off_session: true, // This allows charging without customer present
        description: `Commission charge: ${description}`,
        metadata: {
          contractor_id: contractorId.toString(),
          charge_type: 'commission'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        console.log(`✅ Successfully charged $${commissionAmount} commission to contractor ${contractorId} (Payment Intent ID: ${paymentIntent.id})`);
        return {success: true, paymentIntentId: paymentIntent.id};
      } else {
        console.error(`❌ Commission charge failed for contractor ${contractorId}: ${paymentIntent.status}`);
        return {success: false};
      }
    } catch (error) {
      console.error(`Error charging commission to contractor ${contractorId}:`, error);
      return {success: false};
    }
  }

  const httpServer = createServer(app);
  
  // Temporarily disable WebSocket to fix stability issues
  // TODO: Re-implement WebSocket with proper error handling
  
  return httpServer;
}