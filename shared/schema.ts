import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Service Categories table
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
});

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
  lastLogin: timestamp("last_login"),
});

// Contractors table
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  description: text("description").notNull(),
  specialties: text("specialties").array(),
  serviceCategoryIds: integer("service_category_ids").array(),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  hourlyRate: real("hourly_rate"),
  logoUrl: text("logo_url"),
  videoUrl: text("video_url"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  subscriptionTier: text("subscription_tier").default("basic"), // basic, premium, pro
  monthlySpendCap: real("monthly_spend_cap").default(1000),
  paymentMethodAdded: boolean("payment_method_added").default(false),
  mediaFiles: json("media_files").$type<{url: string, type: 'image' | 'video', name: string}[]>().default([]),
});

// Salespersons table
export const salespersons = pgTable("salespersons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  nfcId: text("nfc_id").notNull().unique(),
  profileUrl: text("profile_url").notNull().unique(),
  qrCodeUrl: text("qr_code_url"),
  lastScanned: timestamp("last_scanned"),
  isActive: boolean("is_active").default(true),
  bio: text("bio"),
  specialties: text("specialties").array(),
  certifications: text("certifications").array(),
  yearsExperience: integer("years_experience"),
  totalLeads: integer("total_leads").default(0),
  conversionRate: real("conversion_rate").default(0),
  commissions: real("commissions").default(0),
  activeProjects: integer("active_projects").default(0),
  totalVisits: integer("total_visits").default(0),
  successfulConversions: integer("successful_conversions").default(0),
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

// Bid requests table
export const bidRequests = pgTable("bid_requests", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  contractorId: integer("contractor_id").notNull().references(() => contractors.id),
  salespersonId: integer("salesperson_id").references(() => salespersons.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  description: text("description").notNull(),
  timeline: text("timeline").notNull(),
  budget: text("budget"),
  preferredContactMethod: text("preferred_contact_method").notNull(),
  additionalInformation: text("additional_information"),
  status: text("status").notNull().default("pending"), // pending, sent, contacted, completed, declined
  emailSent: boolean("email_sent").default(false),
  lastUpdated: timestamp("last_updated"),
  notes: text("notes"),
});

// Page visit tracking table
export const pageVisits = pgTable("page_visits", {
  id: serial("id").primaryKey(),
  salespersonId: integer("salesperson_id").references(() => salespersons.id),
  visitorIp: text("visitor_ip"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  path: text("path").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  convertedToBidRequest: boolean("converted_to_bid_request").default(false),
  bidRequestId: integer("bid_request_id").references(() => bidRequests.id),
});

// Insert schemas
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
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
  totalVisits: true,
  successfulConversions: true,
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

export const insertBidRequestSchema = createInsertSchema(bidRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  emailSent: true,
  lastUpdated: true,
  notes: true,
});

export const insertPageVisitSchema = createInsertSchema(pageVisits).omit({
  id: true,
  timestamp: true,
  convertedToBidRequest: true,
  bidRequestId: true,
});

// Relations - these are required for Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  contractors: many(contractors),
  salespersons: many(salespersons),
  testimonials: many(testimonials),
  projects: many(projects, { relationName: 'homeowner' }),
}));

export const contractorsRelations = relations(contractors, ({ one, many }) => ({
  user: one(users, {
    fields: [contractors.userId],
    references: [users.id],
  }),
  projects: many(projects),
  bidRequests: many(bidRequests),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  projects: many(projects),
}));

export const salespersonsRelations = relations(salespersons, ({ one, many }) => ({
  user: one(users, {
    fields: [salespersons.userId],
    references: [users.id],
  }),
  projects: many(projects),
  bidRequests: many(bidRequests),
  pageVisits: many(pageVisits),
}));

export const bidRequestsRelations = relations(bidRequests, ({ one, many }) => ({
  contractor: one(contractors, {
    fields: [bidRequests.contractorId],
    references: [contractors.id],
  }),
  salesperson: one(salespersons, {
    fields: [bidRequests.salespersonId],
    references: [salespersons.id],
  }),
  pageVisits: many(pageVisits),
}));

export const pageVisitsRelations = relations(pageVisits, ({ one }) => ({
  salesperson: one(salespersons, {
    fields: [pageVisits.salespersonId],
    references: [salespersons.id],
  }),
  bidRequest: one(bidRequests, {
    fields: [pageVisits.bidRequestId],
    references: [bidRequests.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  homeowner: one(users, {
    fields: [projects.homeownerId],
    references: [users.id],
    relationName: 'homeowner',
  }),
  contractor: one(contractors, {
    fields: [projects.contractorId],
    references: [contractors.id],
  }),
  salesperson: one(salespersons, {
    fields: [projects.salespersonId],
    references: [salespersons.id],
  }),
  testimonials: many(testimonials),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  user: one(users, {
    fields: [testimonials.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [testimonials.projectId],
    references: [projects.id],
  }),
}));

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

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;

export type BidRequest = typeof bidRequests.$inferSelect;
export type InsertBidRequest = z.infer<typeof insertBidRequestSchema>;

export type PageVisit = typeof pageVisits.$inferSelect;
export type InsertPageVisit = z.infer<typeof insertPageVisitSchema>;

// Extended schemas for login
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
