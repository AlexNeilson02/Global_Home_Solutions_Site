import express, { type Request, type Response } from "express";
import passport from "passport";
import { loginSchema, insertUserSchema, type User } from "@shared/schema";
import { storage } from "./database-storage";
import { hashPassword } from "./auth";

const router = express.Router();

// Login route
router.post("/login", (req: Request, res: Response, next) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || "Invalid credentials" });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      
      // Return user info without password
      const { password, ...userInfo } = user;
      res.json({ 
        message: "Login successful", 
        user: userInfo,
        redirectTo: getRedirectUrl(user.role)
      });
    });
  })(req, res, next);
});

// Logout route
router.post("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logout successful" });
  });
});

// Get current user
router.get("/user", (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const user = req.user as User;
  const { password, ...userInfo } = user;
  res.json(userInfo);
});

// Registration route (for testing)
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    const existingEmail = await storage.getUserByEmail(data.email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Create user
    const newUser = await storage.createUser({
      ...data,
      password: hashedPassword,
    });
    
    const { password, ...userInfo } = newUser;
    res.status(201).json({ message: "User created successfully", user: userInfo });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ message: "Invalid registration data" });
  }
});

// Helper function to determine redirect URL based on role
function getRedirectUrl(role: string): string {
  switch (role) {
    case "admin":
      return "/admin-portal";
    case "contractor":
      return "/contractor-portal";
    case "salesperson":
      return "/sales-portal";
    default:
      return "/";
  }
}

export default router;