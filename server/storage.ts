import { 
  User, InsertUser, 
  Contractor, InsertContractor, 
  Salesperson, InsertSalesperson, 
  Project, InsertProject, 
  Testimonial, InsertTestimonial,
  ServiceCategory, InsertServiceCategory,
  BidRequest, InsertBidRequest,
  PageVisit, InsertPageVisit,
  CommissionRecord, InsertCommissionRecord,
  CommissionAdjustment, InsertCommissionAdjustment,
  CommissionPayment, InsertCommissionPayment,
  EmailCommunication, InsertEmailCommunication
} from "@shared/schema";

// Storage interface defining all required methods for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserByRole(role: string): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User | undefined>;

  // Contractor methods
  getContractor(id: number): Promise<Contractor | undefined>;
  getContractorByUserId(userId: number): Promise<Contractor | undefined>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: number, contractor: Partial<Contractor>): Promise<Contractor | undefined>;
  getAllContractors(): Promise<Contractor[]>;
  getFeaturedContractors(limit: number): Promise<Contractor[]>;
  updateContractorStripeInfo(contractorId: number, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string | null }): Promise<Contractor | undefined>;
  getContractorByStripeSubscriptionId(subscriptionId: string): Promise<Contractor | undefined>;
  
  // Salesperson methods
  getSalesperson(id: number): Promise<Salesperson | undefined>;
  getSalespersonById(id: number): Promise<Salesperson | undefined>;
  getSalespersonByUserId(userId: number): Promise<Salesperson | undefined>;
  getSalespersonByNfcId(nfcId: string): Promise<Salesperson | undefined>;
  getSalespersonByProfileUrl(profileUrl: string): Promise<Salesperson | undefined>;
  createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson>;
  updateSalesperson(id: number, salesperson: Partial<Salesperson>): Promise<Salesperson | undefined>;
  getAllSalespersons(): Promise<Salesperson[]>;
  incrementSalespersonStats(id: number, field: 'totalVisits' | 'successfulConversions'): Promise<Salesperson | undefined>;
  getSalespersonAnalytics(id: number): Promise<{ totalVisits: number, conversions: number, conversionRate: number }>;
  getTopSalespersons(limit: number, metric: 'totalLeads' | 'conversionRate' | 'commissions'): Promise<Salesperson[]>;
  
  // Service Category methods
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(serviceCategory: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, serviceCategory: Partial<ServiceCategory>): Promise<ServiceCategory | undefined>;
  getAllServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategoryByName(name: string): Promise<ServiceCategory | null>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByHomeownerId(homeownerId: number): Promise<Project[]>;
  getProjectsByContractorId(contractorId: number): Promise<Project[]>;
  getProjectsBySalespersonId(salespersonId: number): Promise<Project[]>;
  getRecentProjects(limit: number): Promise<Project[]>;
  
  // Testimonial methods
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getAllTestimonials(): Promise<Testimonial[]>;
  getTestimonialsByUserId(userId: number): Promise<Testimonial[]>;
  getRecentTestimonials(limit: number): Promise<Testimonial[]>;
  
  // Bid Request methods
  createBidRequest(bidRequest: InsertBidRequest): Promise<BidRequest>;
  getBidRequest(id: number): Promise<BidRequest | undefined>;
  getBidRequestsByContractorId(contractorId: number): Promise<BidRequest[]>;
  getBidRequestsBySalespersonId(salespersonId: number): Promise<BidRequest[]>;
  getRecentBidRequests(limit: number): Promise<BidRequest[]>;
  updateBidRequestStatus(id: number, status: string): Promise<BidRequest | undefined>;
  updateBidRequestEmailSent(id: number, emailSent: boolean): Promise<BidRequest | undefined>;
  updateBidRequestNotes(id: number, notes: string): Promise<BidRequest | undefined>;
  markBidRequestAsContacted(id: number): Promise<BidRequest | undefined>;
  
  // Page Visit methods
  createPageVisit(pageVisit: InsertPageVisit): Promise<PageVisit>;
  getPageVisitsBySalespersonId(salespersonId: number): Promise<PageVisit[]>;
  updatePageVisitConversion(id: number, bidRequestId: number): Promise<PageVisit | undefined>;
  getPageVisitStats(salespersonId: number, startDate?: Date, endDate?: Date): Promise<{ 
    totalVisits: number, 
    uniqueVisitors: number, 
    conversionRate: number 
  }>;
  // QR/NFC verification for commission eligibility
  getVerifiedQrNfcVisit(sessionTrackingId: string, salespersonId: number): Promise<PageVisit | undefined>;

  // Commission methods
  createCommissionRecord(commission: InsertCommissionRecord): Promise<CommissionRecord>;
  getCommissionRecord(id: number): Promise<CommissionRecord | undefined>;
  getCommissionRecordsByBidRequest(bidRequestId: number): Promise<CommissionRecord[]>;
  getCommissionRecordsBySalesperson(salespersonId: number): Promise<CommissionRecord[]>;
  getCommissionRecordsByDateRange(startDate: Date, endDate: Date): Promise<CommissionRecord[]>;
  updateCommissionRecordStatus(id: number, status: string): Promise<CommissionRecord | undefined>;
  updateCommissionRecordPayment(id: number, paymentStatus: string, paidAt?: Date): Promise<CommissionRecord | undefined>;
  
  // Commission adjustments
  createCommissionAdjustment(adjustment: InsertCommissionAdjustment): Promise<CommissionAdjustment>;
  getCommissionAdjustmentsByRecord(commissionRecordId: number): Promise<CommissionAdjustment[]>;
  
  // Commission payments
  createCommissionPayment(payment: InsertCommissionPayment): Promise<CommissionPayment>;
  getCommissionPaymentsByRecipient(recipientId: number): Promise<CommissionPayment[]>;
  updateCommissionPaymentStatus(id: number, status: string): Promise<CommissionPayment | undefined>;
  getPendingCommissionsForContractor(contractorId: number): Promise<CommissionRecord[]>;
  
  // Commission analytics
  getCommissionSummaryBySalesperson(salespersonId: number, startDate?: Date, endDate?: Date): Promise<{
    totalEarned: number;
    pendingCommissions: number;
    paidCommissions: number;
    totalRecords: number;
  }>;
  getTopEarnersBySalesperson(limit: number, startDate?: Date, endDate?: Date): Promise<any[]>;
  getCommissionAnalytics(startDate?: Date, endDate?: Date): Promise<{
    totalCommissions: number;
    salesmanTotal: number;
    overrideTotal: number;
    corpTotal: number;
    totalRecords: number;
  }>;
  
  // Email communication methods
  createEmailCommunication(email: InsertEmailCommunication): Promise<EmailCommunication>;
  getEmailCommunicationsByContractorId(contractorId: number, limit?: number): Promise<EmailCommunication[]>;
  getEmailCommunicationsByBidRequestId(bidRequestId: number): Promise<EmailCommunication[]>;
  updateEmailCommunication(id: number, email: Partial<EmailCommunication>): Promise<EmailCommunication | undefined>;
}

import { DatabaseStorage } from "./database-storage";

// Use Database Storage instead of MemStorage
export const storage = new DatabaseStorage();