import { eq, and, desc, sql, asc, count, avg, max, lt, gt, between } from "drizzle-orm";
import { db } from "./db";
import { 
  users, contractors, salespersons, projects, testimonials, serviceCategories, bidRequests, pageVisits,
  type User, type InsertUser,
  type Contractor, type InsertContractor,
  type Salesperson, type InsertSalesperson,
  type Project, type InsertProject,
  type Testimonial, type InsertTestimonial,
  type ServiceCategory, type InsertServiceCategory,
  type BidRequest, type InsertBidRequest,
  type PageVisit, type InsertPageVisit
} from "@shared/schema";
import { IStorage } from "./storage";
import { QRCodeService } from "./qr-service";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  // Contractor methods
  async getContractor(id: number): Promise<Contractor | undefined> {
    const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
    return contractor;
  }

  async getContractorByUserId(userId: number): Promise<Contractor | undefined> {
    const [contractor] = await db.select().from(contractors).where(eq(contractors.userId, userId));
    return contractor;
  }

  async createContractor(insertContractor: InsertContractor): Promise<Contractor> {
    const [contractor] = await db.insert(contractors).values(insertContractor).returning();
    return contractor;
  }

  async updateContractor(id: number, contractorData: Partial<Contractor>): Promise<Contractor | undefined> {
    const [contractor] = await db
      .update(contractors)
      .set(contractorData)
      .where(eq(contractors.id, id))
      .returning();
    return contractor;
  }

  async getAllContractors(): Promise<Contractor[]> {
    return db.select().from(contractors);
  }

  async getFeaturedContractors(limit: number): Promise<Contractor[]> {
    return db
      .select()
      .from(contractors)
      .where(eq(contractors.isActive, true))
      .orderBy(contractors.rating)
      .limit(limit);
  }

  // Salesperson methods
  async getSalesperson(id: number): Promise<Salesperson | undefined> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.id, id));
    return salesperson;
  }

  async getSalespersonByUserId(userId: number): Promise<Salesperson | undefined> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.userId, userId));
    return salesperson;
  }

  async getSalespersonByNfcId(nfcId: string): Promise<Salesperson | undefined> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.nfcId, nfcId));
    return salesperson;
  }

  async getSalespersonByProfileUrl(profileUrl: string): Promise<Salesperson | undefined> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.profileUrl, profileUrl));
    return salesperson;
  }

  async createSalesperson(insertSalesperson: InsertSalesperson): Promise<Salesperson> {
    // Create the salesperson first
    const [salesperson] = await db.insert(salespersons).values(insertSalesperson).returning();
    
    // Generate QR code for this salesperson
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.PRODUCTION_URL || 'https://your-domain.com'
        : 'http://localhost:5000';
      
      const landingPageUrl = QRCodeService.generateLandingPageUrl(baseUrl, salesperson.profileUrl);
      const qrCodeDataURL = await QRCodeService.generateQRCode(landingPageUrl);
      
      // Update the salesperson with the QR code
      const [updatedSalesperson] = await db
        .update(salespersons)
        .set({ qrCodeUrl: qrCodeDataURL })
        .where(eq(salespersons.id, salesperson.id))
        .returning();
      
      return updatedSalesperson;
    } catch (error) {
      console.error('Failed to generate QR code for salesperson:', error);
      // Return the salesperson even if QR code generation fails
      return salesperson;
    }
  }

  async updateSalesperson(id: number, salespersonData: Partial<Salesperson>): Promise<Salesperson | undefined> {
    const [salesperson] = await db
      .update(salespersons)
      .set(salespersonData)
      .where(eq(salespersons.id, id))
      .returning();
    return salesperson;
  }

  async getAllSalespersons(): Promise<Salesperson[]> {
    return db.select().from(salespersons);
  }
  
  async incrementSalespersonStats(id: number, field: 'totalVisits' | 'successfulConversions'): Promise<Salesperson | undefined> {
    // Get current value
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.id, id));
    if (!salesperson) return undefined;
    
    // Increment the specified field
    const updateData: Partial<Salesperson> = {};
    if (field === 'totalVisits') {
      updateData.totalVisits = (salesperson.totalVisits || 0) + 1;
    } else if (field === 'successfulConversions') {
      updateData.successfulConversions = (salesperson.successfulConversions || 0) + 1;
      
      // Also recalculate conversion rate
      const totalVisits = salesperson.totalVisits || 0;
      const successfulConversions = (salesperson.successfulConversions || 0) + 1;
      if (totalVisits > 0) {
        updateData.conversionRate = successfulConversions / totalVisits;
      }
    }
    
    // Update salesperson record
    const [updated] = await db
      .update(salespersons)
      .set(updateData)
      .where(eq(salespersons.id, id))
      .returning();
    
    return updated;
  }
  
  async getSalespersonAnalytics(id: number): Promise<{ totalVisits: number, conversions: number, conversionRate: number }> {
    // Get salesperson
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.id, id));
    if (!salesperson) {
      return { totalVisits: 0, conversions: 0, conversionRate: 0 };
    }
    
    // Count bid requests
    const bidRequestsCount = await db
      .select({ count: count() })
      .from(bidRequests)
      .where(eq(bidRequests.salespersonId, id));
    
    const conversions = bidRequestsCount[0]?.count || 0;
    const totalVisits = salesperson.totalVisits || 0;
    const conversionRate = totalVisits > 0 ? conversions / totalVisits : 0;
    
    return {
      totalVisits,
      conversions,
      conversionRate
    };
  }
  
  async getTopSalespersons(limit: number, metric: 'totalLeads' | 'conversionRate' | 'commissions'): Promise<Salesperson[]> {
    switch (metric) {
      case 'totalLeads':
        return db
          .select()
          .from(salespersons)
          .orderBy(desc(salespersons.totalLeads))
          .limit(limit);
      case 'conversionRate':
        return db
          .select()
          .from(salespersons)
          .orderBy(desc(salespersons.conversionRate))
          .limit(limit);
      case 'commissions':
        return db
          .select()
          .from(salespersons)
          .orderBy(desc(salespersons.commissions))
          .limit(limit);
    }
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async getProjectsByHomeownerId(homeownerId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.homeownerId, homeownerId));
  }

  async getProjectsByContractorId(contractorId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.contractorId, contractorId));
  }

  async getProjectsBySalespersonId(salespersonId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.salespersonId, salespersonId));
  }

  async getRecentProjects(limit: number): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(limit);
  }

  // Testimonial methods
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.id, id));
    return testimonial;
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db.insert(testimonials).values(insertTestimonial).returning();
    return testimonial;
  }

  async getAllTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials);
  }

  async getTestimonialsByUserId(userId: number): Promise<Testimonial[]> {
    return db.select().from(testimonials).where(eq(testimonials.userId, userId));
  }

  async getRecentTestimonials(limit: number): Promise<Testimonial[]> {
    return db
      .select()
      .from(testimonials)
      .orderBy(desc(testimonials.createdAt))
      .limit(limit);
  }
  
  // Service Category methods
  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return category;
  }

  async createServiceCategory(insertServiceCategory: InsertServiceCategory): Promise<ServiceCategory> {
    const [category] = await db.insert(serviceCategories).values(insertServiceCategory).returning();
    return category;
  }

  async updateServiceCategory(id: number, serviceCategoryData: Partial<ServiceCategory>): Promise<ServiceCategory | undefined> {
    const [category] = await db
      .update(serviceCategories)
      .set(serviceCategoryData)
      .where(eq(serviceCategories.id, id))
      .returning();
    return category;
  }

  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    return db.select().from(serviceCategories).where(eq(serviceCategories.isActive, true));
  }
  
  // Bid Request methods
  async createBidRequest(bidRequest: InsertBidRequest): Promise<BidRequest> {
    const [request] = await db.insert(bidRequests).values(bidRequest).returning();
    return request;
  }
  
  async getBidRequest(id: number): Promise<BidRequest | undefined> {
    const [request] = await db.select().from(bidRequests).where(eq(bidRequests.id, id));
    return request;
  }
  
  async getBidRequestsByContractorId(contractorId: number): Promise<BidRequest[]> {
    return db.select().from(bidRequests).where(eq(bidRequests.contractorId, contractorId));
  }
  
  async getBidRequestsBySalespersonId(salespersonId: number): Promise<BidRequest[]> {
    return db.select().from(bidRequests).where(eq(bidRequests.salespersonId, salespersonId));
  }
  
  async getRecentBidRequests(limit: number): Promise<BidRequest[]> {
    return db
      .select()
      .from(bidRequests)
      .orderBy(desc(bidRequests.createdAt))
      .limit(limit);
  }
  
  async updateBidRequestStatus(id: number, status: string): Promise<BidRequest | undefined> {
    const [request] = await db
      .update(bidRequests)
      .set({ 
        status,
        lastUpdated: new Date()
      })
      .where(eq(bidRequests.id, id))
      .returning();
    return request;
  }
  
  async updateBidRequestEmailSent(id: number, emailSent: boolean): Promise<BidRequest | undefined> {
    const [request] = await db
      .update(bidRequests)
      .set({ emailSent })
      .where(eq(bidRequests.id, id))
      .returning();
    return request;
  }
  
  async updateBidRequestNotes(id: number, notes: string): Promise<BidRequest | undefined> {
    const [request] = await db
      .update(bidRequests)
      .set({ 
        notes,
        lastUpdated: new Date()
      })
      .where(eq(bidRequests.id, id))
      .returning();
    return request;
  }
  
  // Page Visit methods
  async createPageVisit(pageVisit: InsertPageVisit): Promise<PageVisit> {
    const [visit] = await db.insert(pageVisits).values(pageVisit).returning();
    
    // Update salesperson stats
    if (visit.salespersonId) {
      await this.incrementSalespersonStats(visit.salespersonId, 'totalVisits');
    }
    
    return visit;
  }
  
  async getPageVisitsBySalespersonId(salespersonId: number): Promise<PageVisit[]> {
    return db.select().from(pageVisits).where(eq(pageVisits.salespersonId, salespersonId));
  }
  
  async updatePageVisitConversion(id: number, bidRequestId: number): Promise<PageVisit | undefined> {
    const [visit] = await db
      .update(pageVisits)
      .set({ 
        convertedToBidRequest: true,
        bidRequestId
      })
      .where(eq(pageVisits.id, id))
      .returning();
      
    // Update salesperson conversion stats
    if (visit.salespersonId) {
      await this.incrementSalespersonStats(visit.salespersonId, 'successfulConversions');
    }
    
    return visit;
  }
  
  async getPageVisitStats(salespersonId: number, startDate?: Date, endDate?: Date): Promise<{ 
    totalVisits: number, 
    uniqueVisitors: number, 
    conversionRate: number 
  }> {
    // Get total visits with date filtering if needed
    let totalVisitsQuery = db
      .select()
      .from(pageVisits)
      .where(eq(pageVisits.salespersonId, salespersonId));
      
    // Apply date filters if provided
    if (startDate && endDate) {
      totalVisitsQuery = totalVisitsQuery.where(
        and(
          gt(pageVisits.timestamp, startDate),
          lt(pageVisits.timestamp, endDate)
        )
      );
    } else if (startDate) {
      totalVisitsQuery = totalVisitsQuery.where(gt(pageVisits.timestamp, startDate));
    } else if (endDate) {
      totalVisitsQuery = totalVisitsQuery.where(lt(pageVisits.timestamp, endDate));
    }
    
    // Execute queries
    const totalVisitsResult = await totalVisitsQuery;
    const totalVisits = totalVisitsResult.length;
    
    // Get unique visitors by counting distinct IPs
    const visitorIps = new Set(totalVisitsResult.map(visit => visit.visitorIp).filter(Boolean));
    const uniqueVisitors = visitorIps.size;
    
    // Count conversions
    const conversions = totalVisitsResult.filter(visit => visit.convertedToBidRequest).length;
    
    // Calculate conversion rate
    const conversionRate = totalVisits > 0 ? conversions / totalVisits : 0;
    
    return {
      totalVisits,
      uniqueVisitors,
      conversionRate
    };
  }
}