import { pgTable, text, serial, integer, boolean, timestamp, real, json, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Service Categories table
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
  // Commission structure
  baseCost: real("base_cost").notNull().default(0),
  salesmanCommission: real("salesman_commission").notNull().default(0),
  overrideCommission: real("override_commission").notNull().default(0),
  corpCommission: real("corp_commission").notNull().default(0),
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
  serviceAreas: text("service_areas").array(),
  serviceCategoryIds: integer("service_category_ids").array(),

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
  serviceRequested: text("service_requested").notNull(), // Specific service from the 66 services list
  description: text("description").notNull(),
  timeline: text("timeline").notNull(),
  budget: text("budget"),
  preferredContactMethod: text("preferred_contact_method").notNull(),
  additionalInformation: text("additional_information"),
  status: text("status").notNull().default("pending"), // pending, sent, contacted, completed, declined
  emailSent: boolean("email_sent").default(false),
  lastUpdated: timestamp("last_updated"),
  notes: text("notes"),
  attachments: text("attachments").array(), // document IDs
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

// Documents/Files table for organized file management
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(), // image, video, document, etc.
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  fileUrl: text("file_url").notNull(), // base64 data URL or file path
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  category: text("category").notNull().default("general"), // project, portfolio, profile, contract, etc.
  relatedId: integer("related_id"), // ID of related entity (project, bid request, etc.)
  relatedType: text("related_type"), // 'project', 'bid_request', 'contractor', etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  tags: text("tags").array(), // searchable tags
  description: text("description"),
});

// Project milestones for detailed progress tracking
export const projectMilestones = pgTable("project_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, blocked
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Project status updates for timeline tracking
export const projectStatusUpdates = pgTable("project_status_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  status: text("status").notNull(),
  notes: text("notes"),
  updatedBy: integer("updated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  attachments: text("attachments").array(), // document IDs
});

// Commission records table
export const commissionRecords = pgTable("commission_records", {
  id: serial("id").primaryKey(),
  bidRequestId: integer("bid_request_id").notNull().references(() => bidRequests.id),
  salespersonId: integer("salesperson_id").notNull().references(() => salespersons.id),
  overrideManagerId: integer("override_manager_id").references(() => users.id), // Manager who gets override commission
  serviceCategory: text("service_category").notNull(),
  
  // Commission amounts
  totalCommission: real("total_commission").notNull(), // Base cost from service
  salesmanAmount: real("salesman_amount").notNull(),
  overrideAmount: real("override_amount").notNull(),
  corpAmount: real("corp_amount").notNull(),
  
  // Status and tracking
  status: text("status").notNull().default("pending"), // pending, paid, cancelled, adjusted
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, paid, processing
  paidAt: timestamp("paid_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
  adjustmentReason: text("adjustment_reason"),
  originalAmount: real("original_amount"), // For tracking adjustments
});

// Commission adjustments table
export const commissionAdjustments = pgTable("commission_adjustments", {
  id: serial("id").primaryKey(),
  commissionRecordId: integer("commission_record_id").notNull().references(() => commissionRecords.id),
  adjustedBy: integer("adjusted_by").notNull().references(() => users.id),
  
  // Adjustment details
  previousAmount: real("previous_amount").notNull(),
  newAmount: real("new_amount").notNull(),
  adjustmentAmount: real("adjustment_amount").notNull(), // Can be positive or negative
  
  reason: text("reason").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission payments table
export const commissionPayments = pgTable("commission_payments", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  recipientType: text("recipient_type").notNull(), // 'salesperson', 'override', 'corp'
  
  // Payment details
  totalAmount: real("total_amount").notNull(),
  commissionRecordIds: integer("commission_record_ids").array().notNull(),
  
  // Payment method and status
  paymentMethod: text("payment_method").default("system"), // system, manual, external
  paymentReference: text("payment_reference"), // External payment system reference
  status: text("status").notNull().default("pending"), // pending, completed, failed
  
  // Dates
  scheduledDate: timestamp("scheduled_date").defaultNow(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  
  notes: text("notes"),
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

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertProjectMilestoneSchema = createInsertSchema(projectMilestones).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertProjectStatusUpdateSchema = createInsertSchema(projectStatusUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionRecordSchema = createInsertSchema(commissionRecords).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertCommissionAdjustmentSchema = createInsertSchema(commissionAdjustments).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionPaymentSchema = createInsertSchema(commissionPayments).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// Relations - these are required for Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  contractors: many(contractors),
  salespersons: many(salespersons),
  testimonials: many(testimonials),
  projects: many(projects, { relationName: 'homeowner' }),
  documents: many(documents),
  projectMilestones: many(projectMilestones),
  projectStatusUpdates: many(projectStatusUpdates),
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
  milestones: many(projectMilestones),
  statusUpdates: many(projectStatusUpdates),
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

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({ one }) => ({
  project: one(projects, {
    fields: [projectMilestones.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [projectMilestones.createdBy],
    references: [users.id],
  }),
}));

export const projectStatusUpdatesRelations = relations(projectStatusUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectStatusUpdates.projectId],
    references: [projects.id],
  }),
  updatedByUser: one(users, {
    fields: [projectStatusUpdates.updatedBy],
    references: [users.id],
  }),
}));

export const commissionRecordsRelations = relations(commissionRecords, ({ one, many }) => ({
  bidRequest: one(bidRequests, {
    fields: [commissionRecords.bidRequestId],
    references: [bidRequests.id],
  }),
  salesperson: one(salespersons, {
    fields: [commissionRecords.salespersonId],
    references: [salespersons.id],
  }),
  overrideManager: one(users, {
    fields: [commissionRecords.overrideManagerId],
    references: [users.id],
  }),
  adjustments: many(commissionAdjustments),
}));

export const commissionAdjustmentsRelations = relations(commissionAdjustments, ({ one }) => ({
  commissionRecord: one(commissionRecords, {
    fields: [commissionAdjustments.commissionRecordId],
    references: [commissionRecords.id],
  }),
  adjustedByUser: one(users, {
    fields: [commissionAdjustments.adjustedBy],
    references: [users.id],
  }),
}));

export const commissionPaymentsRelations = relations(commissionPayments, ({ one }) => ({
  recipient: one(users, {
    fields: [commissionPayments.recipientId],
    references: [users.id],
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

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type InsertProjectMilestone = z.infer<typeof insertProjectMilestoneSchema>;

export type ProjectStatusUpdate = typeof projectStatusUpdates.$inferSelect;
export type InsertProjectStatusUpdate = z.infer<typeof insertProjectStatusUpdateSchema>;

export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type InsertCommissionRecord = z.infer<typeof insertCommissionRecordSchema>;

export type CommissionAdjustment = typeof commissionAdjustments.$inferSelect;
export type InsertCommissionAdjustment = z.infer<typeof insertCommissionAdjustmentSchema>;

export type CommissionPayment = typeof commissionPayments.$inferSelect;
export type InsertCommissionPayment = z.infer<typeof insertCommissionPaymentSchema>;

// Extended schemas for login
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
