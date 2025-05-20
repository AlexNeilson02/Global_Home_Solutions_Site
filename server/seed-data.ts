import { db } from './db';
import { 
  users, contractors, salespersons, projects, testimonials,
  type User, type InsertUser,
  type Contractor, type InsertContractor,
  type Salesperson, type InsertSalesperson,
  type Project, type InsertProject,
  type Testimonial, type InsertTestimonial
} from "@shared/schema";
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  // Check if we already have users in the database
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  console.log('Seeding database...');

  try {
    // Create users
    const homeowner1 = await db.insert(users).values({
      username: 'homeowner1',
      password: 'password123',
      email: 'homeowner1@example.com',
      fullName: 'John Smith',
      role: 'homeowner',
      phone: '555-123-4567',
      avatarUrl: null
    }).returning();

    const homeowner2 = await db.insert(users).values({
      username: 'homeowner2',
      password: 'password123',
      email: 'homeowner2@example.com',
      fullName: 'Sarah Johnson',
      role: 'homeowner',
      phone: '555-987-6543',
      avatarUrl: null
    }).returning();

    const contractorUser1 = await db.insert(users).values({
      username: 'contractor1',
      password: 'password123',
      email: 'contractor1@example.com',
      fullName: 'Mike Wilson',
      role: 'contractor',
      phone: '555-456-7890',
      avatarUrl: null
    }).returning();

    const contractorUser2 = await db.insert(users).values({
      username: 'contractor2',
      password: 'password123',
      email: 'contractor2@example.com',
      fullName: 'Lisa Brown',
      role: 'contractor',
      phone: '555-234-5678',
      avatarUrl: null
    }).returning();

    const salespersonUser1 = await db.insert(users).values({
      username: 'sales1',
      password: 'password123',
      email: 'sales1@example.com',
      fullName: 'James Wilson',
      role: 'salesperson',
      phone: '555-789-0123',
      avatarUrl: null
    }).returning();

    const adminUser = await db.insert(users).values({
      username: 'admin',
      password: 'password123',
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: 'admin',
      phone: '555-321-0987',
      avatarUrl: null
    }).returning();

    // Create contractors
    const contractor1 = await db.insert(contractors).values({
      userId: contractorUser1[0].id,
      companyName: 'Wilson Home Improvements',
      description: 'Quality home renovations with over 15 years of experience',
      specialties: ['Kitchen Remodeling', 'Bathroom Renovations', 'Basement Finishing'],
      rating: 4.8,
      reviewCount: 124,
      hourlyRate: 75,
      logoUrl: null,
      isVerified: true,
      isActive: true,
      subscriptionTier: 'pro'
    }).returning();

    const contractor2 = await db.insert(contractors).values({
      userId: contractorUser2[0].id,
      companyName: 'Brown\'s Electrical Services',
      description: 'Licensed electrical contractor specializing in residential and commercial work',
      specialties: ['Electrical', 'Lighting', 'Panel Upgrades'],
      rating: 4.9,
      reviewCount: 86,
      hourlyRate: 85,
      logoUrl: null,
      isVerified: true,
      isActive: true,
      subscriptionTier: 'premium'
    }).returning();

    // Create salesperson
    const salesperson1 = await db.insert(salespersons).values({
      userId: salespersonUser1[0].id,
      nfcId: 'NFC12345',
      profileUrl: 'james-wilson',
      lastScanned: new Date(),
      isActive: true,
      totalLeads: 45,
      conversionRate: 68.5,
      commissions: 12750.75,
      activeProjects: 8
    }).returning();

    // Create projects
    const project1 = await db.insert(projects).values({
      homeownerId: homeowner1[0].id,
      contractorId: contractor1[0].id,
      salespersonId: salesperson1[0].id,
      title: 'Kitchen Renovation',
      description: 'Complete kitchen remodel including new cabinets, countertops, and appliances',
      serviceType: 'Kitchen Remodeling',
      status: 'in_progress',
      budget: 25000,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      completedAt: null,
      imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80"
    }).returning();

    const project2 = await db.insert(projects).values({
      homeownerId: homeowner2[0].id,
      contractorId: contractor2[0].id,
      salespersonId: salesperson1[0].id,
      title: 'Electrical System Upgrade',
      description: 'Upgrading electrical panel and rewiring entire house',
      serviceType: 'Electrical',
      status: 'completed',
      budget: 12000,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80"
    }).returning();

    const project3 = await db.insert(projects).values({
      homeownerId: homeowner1[0].id,
      contractorId: contractor1[0].id,
      salespersonId: salesperson1[0].id,
      title: 'Bathroom Remodel',
      description: 'Complete master bathroom renovation with walk-in shower and double vanity',
      serviceType: 'Bathroom Renovations',
      status: 'pending',
      budget: 18000,
      imageUrl: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      completedAt: null,
    }).returning();

    // Create testimonials
    await db.insert(testimonials).values({
      userId: homeowner2[0].id,
      projectId: project2[0].id,
      content: 'Brown\'s Electrical Services did an amazing job upgrading our electrical system. The work was completed on time and within budget. I highly recommend them!',
      rating: 5,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    });

    await db.insert(testimonials).values({
      userId: homeowner1[0].id,
      projectId: project1[0].id,
      content: 'Wilson Home Improvements is currently renovating our kitchen and we couldn\'t be happier with their progress. Mike and his team are professional, clean, and detail-oriented.',
      rating: 4,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}