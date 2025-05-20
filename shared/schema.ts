import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("homeowner"), // homeowner, contractor, salesperson, admin
  createdAt: timestamp("created_at").defaultNow(),
  avatarUrl: text("avatar_url"),
});

// Contractors table
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  description: text("description").notNull(),
  specialties: text("specialties").array(),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  hourlyRate: real("hourly_rate"),
  logoUrl: text("logo_url"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  subscriptionTier: text("subscription_tier").default("basic"), // basic, premium, pro
});

// Salespersons table
export const salespersons = pgTable("salespersons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  nfcId: text("nfc_id").notNull().unique(),
  profileUrl: text("profile_url").notNull().unique(),
  lastScanned: timestamp("last_scanned"),
  isActive: boolean("is_active").default(true),
  totalLeads: integer("total_leads").default(0),
  conversionRate: real("conversion_rate").default(0),
  commissions: real("commissions").default(0),
  activeProjects: integer("active_projects").default(0),
});

// Projects/Leads table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  homeownerId: integer("homeowner_id").notNull().references(() => users.id),
  contractorId: integer("contractor_id").references(() => contractors.id),
  salespersonId: integer("salesperson_id").references(() => salespersons.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, declined
  budget: real("budget"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  imageUrl: text("image_url"),
});

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertContractorSchema = createInsertSchema(contractors).omit({
  id: true,
});

export const insertSalespersonSchema = createInsertSchema(salespersons).omit({
  id: true,
  lastScanned: true,
  totalLeads: true,
  conversionRate: true,
  commissions: true,
  activeProjects: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = z.infer<typeof insertContractorSchema>;

export type Salesperson = typeof salespersons.$inferSelect;
export type InsertSalesperson = z.infer<typeof insertSalespersonSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

// Extended schemas for login
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
