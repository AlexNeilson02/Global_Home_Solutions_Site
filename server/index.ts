import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { enhancedRouter } from "./enhanced-routes.js";
import { commissionRouter } from "./commission-routes";
import { videoUploadRouter } from "./video-upload";
import { s3TestRouter } from "./s3-test";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed-data";
import { seedCommissionData } from "./seed-commission-data";

const app = express();

// Development-only cache prevention middleware (MUST BE FIRST)
const isDevelopment = process.env.NODE_ENV === "development" || app.get("env") === "development";
if (isDevelopment) {
  // Block service worker completely in development
  app.get('/sw.js', (req, res) => {
    res.status(404).send('Service worker disabled in development');
  });
  
  // Standard no-cache headers for development
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-cache, must-revalidate',
      'Pragma': 'no-cache'
    });
    next();
  });
}

// Add CORS configuration for deployment
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register API routes FIRST, before Vite middleware
  const server = await registerRoutes(app);
  
  // Register enhanced routes for portal functionality
  app.use('/api', enhancedRouter);
  
  // Register commission system routes
  app.use('/api/commissions', commissionRouter);
  
  // Register Stripe Connect routes for commission distribution
  const stripeConnectRouter = (await import('./stripe-connect-routes')).default;
  app.use('/api/stripe-connect', stripeConnectRouter);
  
  // Register video upload routes
  app.use('/api/video', videoUploadRouter);
  
  // Register S3 test routes
  app.use('/api/s3', s3TestRouter);
  
  // Only run database initialization in development environment
  const isDevelopment = app.get("env") === "development" || process.env.NODE_ENV === "development";
  
  if (isDevelopment) {
    console.log("Running in development mode - initializing database...");
    
    // Seed the database with initial data
    await seedDatabase();
    
    // Seed commission data
    await seedCommissionData();
    
    // Fix authentication credentials
    const { fixAuthCredentials } = await import("./fix-auth");
    await fixAuthCredentials();
    
    // Fix password hashing for existing users
    const { fixUserPasswords } = await import("./fix-passwords");
    await fixUserPasswords();
  } else {
    console.log("Running in production mode - skipping database seeding to preserve production data");
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
