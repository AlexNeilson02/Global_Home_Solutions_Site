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
  CommissionPayment, InsertCommissionPayment
} from "@shared/schema";

// Extend this interface with all required storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;

  // Contractor methods
  getContractor(id: number): Promise<Contractor | undefined>;
  getContractorByUserId(userId: number): Promise<Contractor | undefined>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: number, contractor: Partial<Contractor>): Promise<Contractor | undefined>;
  getAllContractors(): Promise<Contractor[]>;
  getFeaturedContractors(limit: number): Promise<Contractor[]>;
  
  // Salesperson methods
  getSalesperson(id: number): Promise<Salesperson | undefined>;
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
  
  // Page Visit methods
  createPageVisit(pageVisit: InsertPageVisit): Promise<PageVisit>;
  getPageVisitsBySalespersonId(salespersonId: number): Promise<PageVisit[]>;
  updatePageVisitConversion(id: number, bidRequestId: number): Promise<PageVisit | undefined>;
  getPageVisitStats(salespersonId: number, startDate?: Date, endDate?: Date): Promise<{ 
    totalVisits: number, 
    uniqueVisitors: number, 
    conversionRate: number 
  }>;

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
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contractors: Map<number, Contractor>;
  private salespersons: Map<number, Salesperson>;
  private projects: Map<number, Project>;
  private testimonials: Map<number, Testimonial>;
  private serviceCategories: Map<number, ServiceCategory>;
  private bidRequests: Map<number, BidRequest>;
  
  private userId: number;
  private contractorId: number;
  private salespersonId: number;
  private projectId: number;
  private testimonialId: number;
  private serviceCategoryId: number;
  private bidRequestId: number;

  constructor() {
    this.users = new Map();
    this.contractors = new Map();
    this.salespersons = new Map();
    this.projects = new Map();
    this.testimonials = new Map();
    this.serviceCategories = new Map();
    this.bidRequests = new Map();
    
    this.userId = 1;
    this.contractorId = 1;
    this.salespersonId = 1;
    this.projectId = 1;
    this.testimonialId = 1;
    this.serviceCategoryId = 1;
    this.bidRequestId = 1;
    
    // Initialize with some seed data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Contractor methods
  async getContractor(id: number): Promise<Contractor | undefined> {
    return this.contractors.get(id);
  }

  async getContractorByUserId(userId: number): Promise<Contractor | undefined> {
    return Array.from(this.contractors.values()).find(
      contractor => contractor.userId === userId
    );
  }

  async createContractor(insertContractor: InsertContractor): Promise<Contractor> {
    const id = this.contractorId++;
    const contractor: Contractor = { ...insertContractor, id };
    this.contractors.set(id, contractor);
    return contractor;
  }

  async updateContractor(id: number, contractorData: Partial<Contractor>): Promise<Contractor | undefined> {
    const contractor = await this.getContractor(id);
    if (!contractor) return undefined;
    
    const updatedContractor = { ...contractor, ...contractorData };
    this.contractors.set(id, updatedContractor);
    return updatedContractor;
  }

  async getAllContractors(): Promise<Contractor[]> {
    return Array.from(this.contractors.values());
  }

  async getFeaturedContractors(limit: number): Promise<Contractor[]> {
    return Array.from(this.contractors.values())
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  // Salesperson methods
  async getSalesperson(id: number): Promise<Salesperson | undefined> {
    return this.salespersons.get(id);
  }

  async getSalespersonByUserId(userId: number): Promise<Salesperson | undefined> {
    return Array.from(this.salespersons.values()).find(
      salesperson => salesperson.userId === userId
    );
  }

  async getSalespersonByNfcId(nfcId: string): Promise<Salesperson | undefined> {
    return Array.from(this.salespersons.values()).find(
      salesperson => salesperson.nfcId === nfcId
    );
  }

  async getSalespersonByProfileUrl(profileUrl: string): Promise<Salesperson | undefined> {
    return Array.from(this.salespersons.values()).find(
      salesperson => salesperson.profileUrl === profileUrl
    );
  }

  async createSalesperson(insertSalesperson: InsertSalesperson): Promise<Salesperson> {
    const id = this.salespersonId++;
    const salesperson: Salesperson = { 
      ...insertSalesperson, 
      id, 
      totalLeads: 0,
      conversionRate: 0,
      commissions: 0,
      activeProjects: 0
    };
    this.salespersons.set(id, salesperson);
    return salesperson;
  }

  async updateSalesperson(id: number, salespersonData: Partial<Salesperson>): Promise<Salesperson | undefined> {
    const salesperson = await this.getSalesperson(id);
    if (!salesperson) return undefined;
    
    const updatedSalesperson = { ...salesperson, ...salespersonData };
    this.salespersons.set(id, updatedSalesperson);
    return updatedSalesperson;
  }

  async getAllSalespersons(): Promise<Salesperson[]> {
    return Array.from(this.salespersons.values());
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const now = new Date();
    const project: Project = { ...insertProject, id, createdAt: now, completedAt: null };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByHomeownerId(homeownerId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.homeownerId === homeownerId
    );
  }

  async getProjectsByContractorId(contractorId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.contractorId === contractorId
    );
  }

  async getProjectsBySalespersonId(salespersonId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.salespersonId === salespersonId
    );
  }

  async getRecentProjects(limit: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.status === 'completed')
      .sort((a, b) => {
        const dateA = a.completedAt || a.createdAt;
        const dateB = b.completedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, limit);
  }

  // Testimonial methods
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialId++;
    const now = new Date();
    const testimonial: Testimonial = { ...insertTestimonial, id, createdAt: now };
    this.testimonials.set(id, testimonial);
    return testimonial;
  }

  async getAllTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }

  async getTestimonialsByUserId(userId: number): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values()).filter(
      testimonial => testimonial.userId === userId
    );
  }

  async getRecentTestimonials(limit: number): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  // Bid Request methods
  async createBidRequest(bidRequest: InsertBidRequest): Promise<BidRequest> {
    const id = this.bidRequestId++;
    const now = new Date();
    
    const newBidRequest: BidRequest = {
      ...bidRequest,
      id,
      createdAt: now,
      status: "pending",
      emailSent: false
    };
    
    this.bidRequests.set(id, newBidRequest);
    return newBidRequest;
  }
  
  async getBidRequest(id: number): Promise<BidRequest | undefined> {
    return this.bidRequests.get(id);
  }
  
  async getBidRequestsByContractorId(contractorId: number): Promise<BidRequest[]> {
    return Array.from(this.bidRequests.values())
      .filter(bidRequest => bidRequest.contractorId === contractorId);
  }
  
  async updateBidRequestStatus(id: number, status: string): Promise<BidRequest | undefined> {
    const bidRequest = this.bidRequests.get(id);
    
    if (!bidRequest) {
      return undefined;
    }
    
    const updatedBidRequest = {
      ...bidRequest,
      status
    };
    
    this.bidRequests.set(id, updatedBidRequest);
    return updatedBidRequest;
  }
  
  async updateBidRequestEmailSent(id: number, emailSent: boolean): Promise<BidRequest | undefined> {
    const bidRequest = this.bidRequests.get(id);
    
    if (!bidRequest) {
      return undefined;
    }
    
    const updatedBidRequest = {
      ...bidRequest,
      emailSent
    };
    
    this.bidRequests.set(id, updatedBidRequest);
    return updatedBidRequest;
  }

  // Seed some initial data
  private async seedData() {
    // Create sample users
    const admin = await this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@globalhomesolutions.com",
      fullName: "Admin User",
      role: "admin",
      phone: "555-123-4567",
      avatarUrl: null
    });

    const salesperson = await this.createUser({
      username: "jameswilson",
      password: "password123",
      email: "james@globalhomesolutions.com",
      fullName: "James Wilson",
      role: "salesperson",
      phone: "555-234-5678",
      avatarUrl: null
    });

    const contractor1 = await this.createUser({
      username: "plumbingco",
      password: "password123",
      email: "precision@plumbing.com",
      fullName: "John Doe",
      role: "contractor",
      phone: "555-345-6789",
      avatarUrl: null
    });

    const contractor2 = await this.createUser({
      username: "elitehome",
      password: "password123",
      email: "elite@homerenovations.com",
      fullName: "Sarah Smith",
      role: "contractor",
      phone: "555-456-7890",
      avatarUrl: null
    });

    const contractor3 = await this.createUser({
      username: "brightspark",
      password: "password123",
      email: "info@brightspark.com",
      fullName: "Michael Johnson",
      role: "contractor",
      phone: "555-567-8901",
      avatarUrl: null
    });

    const homeowner = await this.createUser({
      username: "jenniferw",
      password: "password123",
      email: "jennifer@example.com",
      fullName: "Jennifer Williams",
      role: "homeowner",
      phone: "555-678-9012",
      avatarUrl: null
    });

    // Create contractors
    const plumbingContractor = await this.createContractor({
      userId: contractor1.id,
      companyName: "Precision Plumbing Co.",
      description: "Specializing in emergency repairs, installations, and maintenance for residential and commercial properties.",
      specialties: ["Plumbing", "Water Heaters"],
      rating: 5.0,
      reviewCount: 128,
      hourlyRate: 85,
      logoUrl: null,
      isVerified: true,
      isActive: true,
      subscriptionTier: "premium"
    });

    const renovationContractor = await this.createContractor({
      userId: contractor2.id,
      companyName: "Elite Home Renovations",
      description: "Full-service renovation team with 15+ years experience specializing in kitchen and bathroom transformations.",
      specialties: ["Remodeling", "Kitchen"],
      rating: 4.5,
      reviewCount: 94,
      hourlyRate: null,
      logoUrl: null,
      isVerified: true,
      isActive: true,
      subscriptionTier: "premium"
    });

    const electricalContractor = await this.createContractor({
      userId: contractor3.id,
      companyName: "Bright Spark Electrical",
      description: "Licensed electricians providing quality electrical services and smart home installations for modern living.",
      specialties: ["Electrical", "Smart Home"],
      rating: 4.0,
      reviewCount: 76,
      hourlyRate: 95,
      logoUrl: null,
      isVerified: true,
      isActive: true,
      subscriptionTier: "basic"
    });

    // Create salesperson
    const salesRep = await this.createSalesperson({
      userId: salesperson.id,
      nfcId: "8A7B2C9D",
      profileUrl: "jameswilson",
      isActive: true
    });

    // Update with mock stats
    await this.updateSalesperson(salesRep.id, {
      totalLeads: 147,
      conversionRate: 32.8,
      commissions: 4280,
      activeProjects: 24,
      lastScanned: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });

    // Create sample projects
    const kitchenProject = await this.createProject({
      homeownerId: homeowner.id,
      contractorId: renovationContractor.id,
      salespersonId: salesRep.id,
      title: "Modern Kitchen Renovation",
      description: "Complete kitchen overhaul including custom cabinetry, quartz countertops, and new appliances.",
      serviceType: "Kitchen Renovation",
      status: "completed",
      budget: 18500,
      imageUrl: null
    });

    const bathroomProject = await this.createProject({
      homeownerId: homeowner.id,
      contractorId: renovationContractor.id,
      salespersonId: salesRep.id,
      title: "Luxury Bathroom Remodel",
      description: "Walk-in shower, heated flooring, and premium fixtures create a spa-like retreat in this master bathroom.",
      serviceType: "Bathroom Remodel",
      status: "completed",
      budget: 12000,
      imageUrl: null
    });

    const smartHomeProject = await this.createProject({
      homeownerId: homeowner.id,
      contractorId: electricalContractor.id,
      salespersonId: salesRep.id,
      title: "Comprehensive Smart Home Setup",
      description: "Integrated lighting, security, climate control, and entertainment systems for a fully connected home.",
      serviceType: "Smart Home Installation",
      status: "completed",
      budget: 4750,
      imageUrl: null
    });

    // Create testimonials
    await this.createTestimonial({
      userId: homeowner.id,
      projectId: kitchenProject.id,
      content: "The NFC verification gave me peace of mind when a representative came to my door. I could instantly see their credentials and the contractors they represent. Ended up hiring an excellent plumber!",
      rating: 5
    });
  }
}

import { DatabaseStorage } from "./database-storage";

// Use Database Storage instead of MemStorage
export const storage = new DatabaseStorage();
