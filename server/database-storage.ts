import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  users, contractors, salespersons, projects, testimonials,
  type User, type InsertUser,
  type Contractor, type InsertContractor,
  type Salesperson, type InsertSalesperson,
  type Project, type InsertProject,
  type Testimonial, type InsertTestimonial
} from "@shared/schema";
import { IStorage } from "./storage";

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
    const [salesperson] = await db.insert(salespersons).values(insertSalesperson).returning();
    return salesperson;
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
}