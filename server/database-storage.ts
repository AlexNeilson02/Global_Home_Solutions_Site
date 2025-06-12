import { eq, and, desc, sql, asc, count, avg, max, lt, gt, between, ne } from "drizzle-orm";
import { db } from "./db";
import { 
  users, contractors, salespersons, projects, testimonials, serviceCategories, bidRequests, pageVisits,
  documents, projectMilestones, projectStatusUpdates, commissionRecords, commissionAdjustments, commissionPayments,
  type User, type InsertUser,
  type Contractor, type InsertContractor,
  type Salesperson, type InsertSalesperson,
  type Project, type InsertProject,
  type Testimonial, type InsertTestimonial,
  type ServiceCategory, type InsertServiceCategory,
  type BidRequest, type InsertBidRequest,
  type PageVisit, type InsertPageVisit,
  type Document, type InsertDocument,
  type ProjectMilestone, type InsertProjectMilestone,
  type ProjectStatusUpdate, type InsertProjectStatusUpdate,
  type CommissionRecord, type InsertCommissionRecord,
  type CommissionAdjustment, type InsertCommissionAdjustment,
  type CommissionPayment, type InsertCommissionPayment
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
      .orderBy(desc(contractors.id))
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
    const results = await db
      .select({
        id: salespersons.id,
        userId: salespersons.userId,
        nfcId: salespersons.nfcId,
        profileUrl: salespersons.profileUrl,
        qrCodeUrl: salespersons.qrCodeUrl,
        lastScanned: salespersons.lastScanned,
        isActive: salespersons.isActive,
        bio: salespersons.bio,
        specialties: salespersons.specialties,
        certifications: salespersons.certifications,
        yearsExperience: salespersons.yearsExperience,
        totalLeads: salespersons.totalLeads,
        conversionRate: salespersons.conversionRate,
        commissions: salespersons.commissions,
        activeProjects: salespersons.activeProjects,
        totalVisits: salespersons.totalVisits,
        successfulConversions: salespersons.successfulConversions,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
      })
      .from(salespersons)
      .leftJoin(users, eq(salespersons.userId, users.id));
    
    return results as any[];
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
    return db.select().from(bidRequests)
      .where(and(
        eq(bidRequests.contractorId, contractorId),
        ne(bidRequests.status, 'deleted')
      ))
      .orderBy(desc(bidRequests.createdAt));
  }
  
  async getBidRequestsBySalespersonId(salespersonId: number): Promise<BidRequest[]> {
    return db.select().from(bidRequests)
      .where(and(
        eq(bidRequests.salespersonId, salespersonId),
        ne(bidRequests.status, 'deleted')
      ))
      .orderBy(desc(bidRequests.createdAt));
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
    // Build base query conditions
    let whereConditions = [eq(pageVisits.salespersonId, salespersonId)];
      
    // Apply date filters if provided
    if (startDate && endDate) {
      whereConditions.push(
        and(
          gt(pageVisits.timestamp, startDate),
          lt(pageVisits.timestamp, endDate)
        )
      );
    } else if (startDate) {
      whereConditions.push(gt(pageVisits.timestamp, startDate));
    } else if (endDate) {
      whereConditions.push(lt(pageVisits.timestamp, endDate));
    }
    
    // Execute query with all conditions
    const totalVisitsResult = await db
      .select()
      .from(pageVisits)
      .where(and(...whereConditions));
      
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

  // Document management methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByCategory(category: string, relatedId?: number): Promise<Document[]> {
    let whereConditions = [
      eq(documents.category, category),
      eq(documents.isActive, true)
    ];
    
    if (relatedId) {
      whereConditions.push(eq(documents.relatedId, relatedId));
    }
    
    return db.select().from(documents)
      .where(and(...whereConditions))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return db.select().from(documents)
      .where(and(
        eq(documents.uploadedBy, userId),
        eq(documents.isActive, true)
      ))
      .orderBy(desc(documents.createdAt));
  }

  async searchDocuments(searchTerm: string, category?: string): Promise<Document[]> {
    let whereConditions = [eq(documents.isActive, true)];
    
    if (category) {
      whereConditions.push(eq(documents.category, category));
    }
    
    // Search in filename, original name, description, and tags
    return db.select().from(documents)
      .where(and(...whereConditions))
      .orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: number, updateData: Partial<Document>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const [document] = await db
      .update(documents)
      .set({ isActive: false })
      .where(eq(documents.id, id))
      .returning();
    return !!document;
  }

  // Project milestone methods
  async createProjectMilestone(insertMilestone: InsertProjectMilestone): Promise<ProjectMilestone> {
    const [milestone] = await db.insert(projectMilestones).values(insertMilestone).returning();
    return milestone;
  }

  async getProjectMilestones(projectId: number): Promise<ProjectMilestone[]> {
    return db.select().from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(asc(projectMilestones.orderIndex));
  }

  async updateProjectMilestone(id: number, updateData: Partial<ProjectMilestone>): Promise<ProjectMilestone | undefined> {
    const [milestone] = await db
      .update(projectMilestones)
      .set(updateData)
      .where(eq(projectMilestones.id, id))
      .returning();
    return milestone;
  }

  async completeProjectMilestone(id: number): Promise<ProjectMilestone | undefined> {
    const [milestone] = await db
      .update(projectMilestones)
      .set({ 
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(projectMilestones.id, id))
      .returning();
    return milestone;
  }

  // Project status update methods
  async createProjectStatusUpdate(insertUpdate: InsertProjectStatusUpdate): Promise<ProjectStatusUpdate> {
    const [update] = await db.insert(projectStatusUpdates).values(insertUpdate).returning();
    return update;
  }

  async getProjectStatusUpdates(projectId: number): Promise<ProjectStatusUpdate[]> {
    return db.select().from(projectStatusUpdates)
      .where(eq(projectStatusUpdates.projectId, projectId))
      .orderBy(desc(projectStatusUpdates.createdAt));
  }

  async getProjectTimeline(projectId: number): Promise<{
    milestones: ProjectMilestone[];
    statusUpdates: ProjectStatusUpdate[];
  }> {
    const [milestones, statusUpdates] = await Promise.all([
      this.getProjectMilestones(projectId),
      this.getProjectStatusUpdates(projectId)
    ]);

    return { milestones, statusUpdates };
  }

  // Advanced Analytics Methods
  async getComprehensiveAnalytics(timeRange?: { startDate: Date; endDate: Date }): Promise<{
    overview: any;
    conversions: any;
    performance: any;
    trends: any;
  }> {
    const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = timeRange?.endDate || new Date();

    // Get all relevant data for the time period
    const [allBidRequests, allContractors, allSalespersons, allPageVisits] = await Promise.all([
      this.getRecentBidRequests(1000),
      this.getAllContractors(),
      this.getAllSalespersons(),
      db.select().from(pageVisits).where(
        and(
          gt(pageVisits.timestamp, startDate),
          lt(pageVisits.timestamp, endDate)
        )
      )
    ]);

    // Filter bid requests by date
    const filteredBidRequests = allBidRequests.filter(bid => {
      const bidDate = new Date(bid.createdAt || new Date());
      return bidDate >= startDate && bidDate <= endDate;
    });

    // Overview metrics
    const overview = {
      totalBidRequests: filteredBidRequests.length,
      totalContractors: allContractors.length,
      totalSalespersons: allSalespersons.length,
      totalPageVisits: allPageVisits.length,
      activeContractors: allContractors.filter(c => c.isActive).length,
      activeSalespersons: allSalespersons.filter(s => s.isActive).length
    };

    // Conversion funnel analysis
    const conversions = {
      pending: filteredBidRequests.filter(b => b.status === 'pending').length,
      contacted: filteredBidRequests.filter(b => ['contacted', 'bid_sent', 'won', 'lost'].includes(b.status)).length,
      bidsSent: filteredBidRequests.filter(b => ['bid_sent', 'won', 'lost'].includes(b.status)).length,
      won: filteredBidRequests.filter(b => b.status === 'won').length,
      lost: filteredBidRequests.filter(b => b.status === 'lost').length,
      conversionRate: filteredBidRequests.length > 0 ? 
        (filteredBidRequests.filter(b => b.status === 'won').length / filteredBidRequests.length * 100) : 0
    };

    // Performance analysis by salesperson
    const salespersonPerformance = await Promise.all(
      allSalespersons.map(async (salesperson) => {
        const repBids = filteredBidRequests.filter(bid => bid.salespersonId === salesperson.id);
        const repVisits = allPageVisits.filter(visit => visit.salespersonId === salesperson.id);
        const wonBids = repBids.filter(bid => bid.status === 'won');
        
        const user = await this.getUser(salesperson.userId);
        return {
          id: salesperson.id,
          name: user?.fullName || `Salesperson ${salesperson.id}`,
          totalVisits: repVisits.length,
          totalLeads: repBids.length,
          wonProjects: wonBids.length,
          conversionRate: repBids.length > 0 ? (wonBids.length / repBids.length * 100) : 0,
          revenue: wonBids.reduce((sum, bid) => sum + (parseFloat(bid.budget || '0') || 0), 0)
        };
      })
    );

    // Time-based trends (weekly breakdown)
    const trends = this.calculateTimeTrends(filteredBidRequests, startDate, endDate);

    return {
      overview,
      conversions,
      performance: salespersonPerformance.sort((a, b) => b.revenue - a.revenue),
      trends
    };
  }

  private calculateTimeTrends(bidRequests: any[], startDate: Date, endDate: Date): any[] {
    const weeks: any[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    for (let date = new Date(startDate); date <= endDate; date = new Date(date.getTime() + weekMs)) {
      const weekEnd = new Date(Math.min(date.getTime() + weekMs, endDate.getTime()));
      const weekBids = bidRequests.filter(bid => {
        const bidDate = new Date(bid.createdAt);
        return bidDate >= date && bidDate < weekEnd;
      });

      weeks.push({
        week: date.toISOString().slice(0, 10),
        totalRequests: weekBids.length,
        contacted: weekBids.filter(b => ['contacted', 'bid_sent', 'won', 'lost'].includes(b.status)).length,
        won: weekBids.filter(b => b.status === 'won').length,
        revenue: weekBids
          .filter(b => b.status === 'won')
          .reduce((sum, bid) => sum + (parseFloat(bid.budget || '0') || 0), 0)
      });
    }

    return weeks;
  }

  async getContractorAnalytics(contractorId: number, timeRange?: { startDate: Date; endDate: Date }): Promise<any> {
    const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = timeRange?.endDate || new Date();

    const contractorBids = await this.getBidRequestsByContractorId(contractorId);
    const filteredBids = contractorBids.filter(bid => {
      const bidDate = new Date(bid.createdAt || new Date());
      return bidDate >= startDate && bidDate <= endDate;
    });

    const responseAnalytics = {
      totalRequests: filteredBids.length,
      responded: filteredBids.filter(b => b.status !== 'pending').length,
      bidsSent: filteredBids.filter(b => ['bid_sent', 'won', 'lost'].includes(b.status)).length,
      won: filteredBids.filter(b => b.status === 'won').length,
      lost: filteredBids.filter(b => b.status === 'lost').length,
      revenue: filteredBids
        .filter(b => b.status === 'won')
        .reduce((sum, bid) => sum + (parseFloat(bid.budget || '0') || 0), 0),
      averageResponseTime: this.calculateAverageResponseTime(filteredBids),
      serviceTypeBreakdown: this.getServiceTypeBreakdown(filteredBids)
    };

    return responseAnalytics;
  }

  private calculateAverageResponseTime(bidRequests: any[]): number {
    const responseTimes = bidRequests
      .filter(bid => bid.lastUpdated && bid.status !== 'pending')
      .map(bid => {
        const created = new Date(bid.createdAt).getTime();
        const updated = new Date(bid.lastUpdated).getTime();
        return (updated - created) / (1000 * 60 * 60); // hours
      });

    return responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
  }

  private getServiceTypeBreakdown(bidRequests: any[]): any[] {
    const serviceCount: { [key: string]: number } = {};
    
    bidRequests.forEach(bid => {
      const service = bid.serviceRequested || 'Unknown';
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });

    return Object.entries(serviceCount)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getRevenueAnalytics(timeRange?: { startDate: Date; endDate: Date }): Promise<any> {
    const startDate = timeRange?.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = timeRange?.endDate || new Date();

    const allBids = await this.getRecentBidRequests(2000);
    const wonBids = allBids.filter(bid => {
      if (bid.status !== 'won' || !bid.budget) return false;
      const bidDate = new Date(bid.createdAt || new Date());
      return bidDate >= startDate && bidDate <= endDate;
    });

    const monthlyRevenue = this.calculateMonthlyRevenue(wonBids);
    const revenueByService = this.calculateRevenueByService(wonBids);
    const revenueByContractor = await this.calculateRevenueByContractor(wonBids);

    return {
      totalRevenue: wonBids.reduce((sum, bid) => sum + (parseFloat(bid.budget || '0') || 0), 0),
      averageProjectValue: wonBids.length > 0 ? 
        wonBids.reduce((sum, bid) => sum + (parseFloat(bid.budget || '0') || 0), 0) / wonBids.length : 0,
      projectCount: wonBids.length,
      monthlyRevenue,
      revenueByService,
      revenueByContractor
    };
  }

  private calculateMonthlyRevenue(wonBids: any[]): any[] {
    const monthlyData: { [key: string]: number } = {};
    
    wonBids.forEach(bid => {
      const date = new Date(bid.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const revenue = parseFloat(bid.budget || '0') || 0;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + revenue;
    });

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateRevenueByService(wonBids: any[]): any[] {
    const serviceRevenue: { [key: string]: number } = {};
    
    wonBids.forEach(bid => {
      const service = bid.serviceRequested || 'Unknown';
      const revenue = parseFloat(bid.budget || '0') || 0;
      serviceRevenue[service] = (serviceRevenue[service] || 0) + revenue;
    });

    return Object.entries(serviceRevenue)
      .map(([service, revenue]) => ({ service, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private async calculateRevenueByContractor(wonBids: any[]): Promise<any[]> {
    const contractorRevenue: { [key: number]: { name: string; revenue: number; projects: number } } = {};
    
    for (const bid of wonBids) {
      if (bid.contractorId) {
        const contractor = await this.getContractor(bid.contractorId);
        const revenue = parseFloat(bid.budget || '0') || 0;
        
        if (!contractorRevenue[bid.contractorId]) {
          contractorRevenue[bid.contractorId] = {
            name: contractor?.companyName || 'Unknown Contractor',
            revenue: 0,
            projects: 0
          };
        }
        
        contractorRevenue[bid.contractorId].revenue += revenue;
        contractorRevenue[bid.contractorId].projects += 1;
      }
    }

    return Object.values(contractorRevenue)
      .sort((a, b) => b.revenue - a.revenue);
  }

  // Commission system methods
  async createCommissionRecord(commission: InsertCommissionRecord): Promise<CommissionRecord> {
    const [record] = await db.insert(commissionRecords).values(commission).returning();
    return record;
  }

  async getCommissionRecord(id: number): Promise<CommissionRecord | undefined> {
    const [record] = await db.select().from(commissionRecords).where(eq(commissionRecords.id, id));
    return record;
  }

  async getCommissionRecordsByBidRequest(bidRequestId: number): Promise<CommissionRecord[]> {
    return await db.select().from(commissionRecords).where(eq(commissionRecords.bidRequestId, bidRequestId));
  }

  async getCommissionRecordsBySalesperson(salespersonId: number): Promise<CommissionRecord[]> {
    return await db.select().from(commissionRecords)
      .where(eq(commissionRecords.salespersonId, salespersonId))
      .orderBy(desc(commissionRecords.createdAt));
  }

  async getCommissionRecordsByDateRange(startDate: Date, endDate: Date): Promise<CommissionRecord[]> {
    return await db.select().from(commissionRecords)
      .where(between(commissionRecords.createdAt, startDate, endDate))
      .orderBy(desc(commissionRecords.createdAt));
  }

  async updateCommissionRecordStatus(id: number, status: string): Promise<CommissionRecord | undefined> {
    const [record] = await db.update(commissionRecords)
      .set({ status })
      .where(eq(commissionRecords.id, id))
      .returning();
    return record;
  }

  async updateCommissionRecordPayment(id: number, paymentStatus: string, paidAt?: Date): Promise<CommissionRecord | undefined> {
    const updateData: any = { paymentStatus };
    if (paidAt) updateData.paidAt = paidAt;
    
    const [record] = await db.update(commissionRecords)
      .set(updateData)
      .where(eq(commissionRecords.id, id))
      .returning();
    return record;
  }

  async createCommissionAdjustment(adjustment: InsertCommissionAdjustment): Promise<CommissionAdjustment> {
    const [record] = await db.insert(commissionAdjustments).values(adjustment).returning();
    return record;
  }

  async getCommissionAdjustmentsByRecord(commissionRecordId: number): Promise<CommissionAdjustment[]> {
    return await db.select().from(commissionAdjustments)
      .where(eq(commissionAdjustments.commissionRecordId, commissionRecordId))
      .orderBy(desc(commissionAdjustments.createdAt));
  }

  async createCommissionPayment(payment: InsertCommissionPayment): Promise<CommissionPayment> {
    const [record] = await db.insert(commissionPayments).values(payment).returning();
    return record;
  }

  async getCommissionPaymentsByRecipient(recipientId: number): Promise<CommissionPayment[]> {
    return await db.select().from(commissionPayments)
      .where(eq(commissionPayments.recipientId, recipientId))
      .orderBy(desc(commissionPayments.createdAt));
  }

  async updateCommissionPaymentStatus(id: number, status: string): Promise<CommissionPayment | undefined> {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.processedAt = new Date();
    }
    
    const [payment] = await db.update(commissionPayments)
      .set(updateData)
      .where(eq(commissionPayments.id, id))
      .returning();
    return payment;
  }

  async getCommissionSummaryBySalesperson(salespersonId: number, startDate?: Date, endDate?: Date): Promise<{
    totalEarned: number;
    pendingCommissions: number;
    paidCommissions: number;
    totalRecords: number;
  }> {
    let query = db.select().from(commissionRecords).where(eq(commissionRecords.salespersonId, salespersonId));
    
    if (startDate && endDate) {
      query = query.where(between(commissionRecords.createdAt, startDate, endDate));
    }
    
    const records = await query;
    
    return {
      totalEarned: records.reduce((sum, r) => sum + (r.salesmanAmount || 0), 0),
      pendingCommissions: records.filter(r => r.paymentStatus === 'pending').reduce((sum, r) => sum + (r.salesmanAmount || 0), 0),
      paidCommissions: records.filter(r => r.paymentStatus === 'paid').reduce((sum, r) => sum + (r.salesmanAmount || 0), 0),
      totalRecords: records.length
    };
  }

  async getTopEarnersBySalesperson(limit: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = db.select({
      salespersonId: commissionRecords.salespersonId,
      totalEarnings: sql<number>`SUM(${commissionRecords.salesmanAmount})`,
      totalCommissions: sql<number>`COUNT(${commissionRecords.id})`
    })
    .from(commissionRecords)
    .groupBy(commissionRecords.salespersonId);
    
    if (startDate && endDate) {
      query = query.where(between(commissionRecords.createdAt, startDate, endDate));
    }
    
    const results = await query.orderBy(sql`SUM(${commissionRecords.salesmanAmount}) DESC`).limit(limit);
    
    // Get salesperson details
    return await Promise.all(results.map(async (result) => {
      const salesperson = await this.getSalesperson(result.salespersonId);
      const user = salesperson ? await this.getUser(salesperson.userId) : null;
      
      return {
        salespersonId: result.salespersonId,
        name: user?.fullName || 'Unknown',
        totalEarnings: result.totalEarnings,
        totalCommissions: result.totalCommissions
      };
    }));
  }

  async getCommissionAnalytics(startDate?: Date, endDate?: Date): Promise<{
    totalCommissions: number;
    salesmanTotal: number;
    overrideTotal: number;
    corpTotal: number;
    totalRecords: number;
  }> {
    let query = db.select().from(commissionRecords);
    
    if (startDate && endDate) {
      query = query.where(between(commissionRecords.createdAt, startDate, endDate));
    }
    
    const records = await query;
    
    return {
      totalCommissions: records.reduce((sum, r) => sum + (r.totalCommission || 0), 0),
      salesmanTotal: records.reduce((sum, r) => sum + (r.salesmanAmount || 0), 0),
      overrideTotal: records.reduce((sum, r) => sum + (r.overrideAmount || 0), 0),
      corpTotal: records.reduce((sum, r) => sum + (r.corpAmount || 0), 0),
      totalRecords: records.length
    };
  }
}

export const storage = new DatabaseStorage();