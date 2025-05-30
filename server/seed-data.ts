import { db } from './db';
import { 
  users, contractors, salespersons, projects, testimonials, serviceCategories,
  type User, type InsertUser,
  type Contractor, type InsertContractor,
  type Salesperson, type InsertSalesperson,
  type Project, type InsertProject,
  type Testimonial, type InsertTestimonial,
  type ServiceCategory, type InsertServiceCategory
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
    // First, seed the service categories with all 66 services from the CSV
    const services = [
      'Decks & Porches',
      'Electrical',
      'Epoxy Flooring',
      'Fencing',
      'Flooring & Hardwood',
      'Foundation Repair',
      'Handyman',
      'Heating & Cooling',
      'Insulation',
      'Kitchen Remodeling',
      'Outdoor Remodeling',
      'Painting Interior & Exterior',
      'Patio Covers',
      'Pest Control',
      'Plumbing',
      'Rain Gutters',
      'Reglazing (Bath & Countertop)',
      'Restoration (Fire and Water)',
      'Roofing',
      'Room Additions/New Construction',
      'Shutters/Shades/Blinds',
      'Siding',
      'Swimming Pools',
      'Tree Service',
      'Walk-in Tubs',
      'Windows & Doors',
      'Wood Refinishing',
      'Pool service',
      'concrete patio/drive walk',
      'remodle',
      'House cleaning',
      'Block wall/ fence',
      'landscaping',
      'vet services',
      'interior design',
      'low voltage',
      'HVAC',
      'Turf',
      'handy man service',
      'sheet rock',
      'gerneral contracting remodle',
      'garbage haul off',
      'solar',
      'excavation',
      'roofing',
      'stone and masonary',
      'window and door install',
      'trim carpentry',
      'countertops',
      'fireplace',
      'smart home automation',
      'genterator install',
      'home security and surveillance',
      'tile',
      'carpet',
      'concrete polioshing',
      'appliances',
      'home inspection',
      'landscape designe',
      'outdoot kitchens',
      'tree service',
      'blinds and shutters',
      'property management',
      'hvac maintenance',
      'water softeners and filtration',
      'window washing',
      'garage door'
    ];

    // Insert all services
    for (const serviceName of services) {
      await db.insert(serviceCategories).values({
        name: serviceName,
        description: `Professional ${serviceName.toLowerCase()} services`,
        isActive: true
      });
    }
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

    // Create additional contractor users for all the sample contractors
    const contractorUser3 = await db.insert(users).values({
      username: 'apexplumbing',
      password: 'password123',
      email: 'info@apexplumbing.com',
      fullName: 'Robert Martinez',
      role: 'contractor',
      phone: '555-111-2222',
      avatarUrl: null
    }).returning();

    const contractorUser4 = await db.insert(users).values({
      username: 'eliteelectric',
      password: 'password123',
      email: 'info@elitelectric.com',
      fullName: 'David Thompson',
      role: 'contractor',
      phone: '555-333-4444',
      avatarUrl: null
    }).returning();

    const contractorUser5 = await db.insert(users).values({
      username: 'premierflooring',
      password: 'password123',
      email: 'info@premierflooring.com',
      fullName: 'Jennifer Chen',
      role: 'contractor',
      phone: '555-555-6666',
      avatarUrl: null
    }).returning();

    const contractorUser6 = await db.insert(users).values({
      username: 'solidconcrete',
      password: 'password123',
      email: 'info@solidconcrete.com',
      fullName: 'Carlos Rodriguez',
      role: 'contractor',
      phone: '555-777-8888',
      avatarUrl: null
    }).returning();

    const contractorUser7 = await db.insert(users).values({
      username: 'rooftopmasters',
      password: 'password123',
      email: 'info@rooftopmasters.com',
      fullName: 'Mark Anderson',
      role: 'contractor',
      phone: '555-999-0000',
      avatarUrl: null
    }).returning();

    const contractorUser8 = await db.insert(users).values({
      username: 'climatecontrol',
      password: 'password123',
      email: 'info@climatecontrolhvac.com',
      fullName: 'Amanda Foster',
      role: 'contractor',
      phone: '555-222-3333',
      avatarUrl: null
    }).returning();

    // Create contractors with data from the sample file
    const contractor1 = await db.insert(contractors).values({
      userId: contractorUser1[0].id,
      companyName: 'Wilson Home Improvements',
      description: 'Quality home renovations with over 15 years of experience',
      specialties: ['Kitchen Remodeling', 'Bathroom Renovations', 'Basement Finishing'],

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

      hourlyRate: 85,
      logoUrl: null,
      isVerified: true,
      isActive: true,
      subscriptionTier: 'premium'
    }).returning();

    // Apex Plumbing Pros
    const contractor3 = await db.insert(contractors).values({
      userId: contractorUser3[0].id,
      companyName: 'Apex Plumbing Pros',
      description: 'Family-owned plumbing specialists serving the valley for over 15 years. We provide top-quality residential and commercial plumbing services with 24/7 emergency support.',
      specialties: ['Plumbing', 'Emergency Repairs', 'Water Heaters'],

      hourlyRate: 90,
      logoUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isActive: true,
      subscriptionTier: 'premium',
      mediaFiles: [
        { url: '/videos/apex1.mp4', type: 'video', name: 'Apex Demo 1' },
        { url: '/videos/apex2.mp4', type: 'video', name: 'Apex Demo 2' }
      ]
    }).returning();

    // Elite Electricians
    const contractor4 = await db.insert(contractors).values({
      userId: contractorUser4[0].id,
      companyName: 'Elite Electricians',
      description: 'Commercial and residential electrical experts with over 20 years of experience. Specializing in modern electrical installations and smart home solutions.',
      specialties: ['Electrical', 'Smart Home', 'Commercial'],

      hourlyRate: 95,
      logoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isActive: true,
      subscriptionTier: 'premium',
      mediaFiles: [
        { url: '/videos/elite1.mp4', type: 'video', name: 'Elite Demo' }
      ]
    }).returning();

    // Premier Flooring Solutions
    const contractor5 = await db.insert(contractors).values({
      userId: contractorUser5[0].id,
      companyName: 'Premier Flooring Solutions',
      description: 'Expert flooring installation and refinishing services. We work with hardwood, tile, carpet, and luxury vinyl with guaranteed craftsmanship.',
      specialties: ['Flooring', 'Hardwood', 'Tile', 'Carpet'],

      hourlyRate: 65,
      logoUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isActive: true,
      subscriptionTier: 'pro',
      mediaFiles: [
        { url: '/videos/flooring1.mp4', type: 'video', name: 'Flooring Demo 1' },
        { url: '/videos/flooring2.mp4', type: 'video', name: 'Flooring Demo 2' }
      ]
    }).returning();

    // Solid Concrete Works
    const contractor6 = await db.insert(contractors).values({
      userId: contractorUser6[0].id,
      companyName: 'Solid Concrete Works',
      description: 'Professional concrete contractors specializing in driveways, patios, foundations, and decorative concrete work.',
      specialties: ['Concrete', 'Driveways', 'Patios', 'Foundations'],

      hourlyRate: 70,
      logoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isActive: false, // This was marked as "sold out" in the original data
      subscriptionTier: 'basic',
      mediaFiles: [
        { url: '/videos/concrete1.mp4', type: 'video', name: 'Concrete Demo' }
      ]
    }).returning();

    // Rooftop Masters
    const contractor7 = await db.insert(contractors).values({
      userId: contractorUser7[0].id,
      companyName: 'Rooftop Masters',
      description: 'Complete roofing services including installation, repair, and maintenance. Storm damage specialists with insurance claim assistance.',
      specialties: ['Roofing', 'Storm Damage', 'Insurance Claims'],

      hourlyRate: 80,
      logoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isActive: true,
      subscriptionTier: 'premium',
      mediaFiles: [
        { url: '/videos/roofing1.mp4', type: 'video', name: 'Roofing Demo 1' },
        { url: '/videos/roofing2.mp4', type: 'video', name: 'Roofing Demo 2' }
      ]
    }).returning();

    // Climate Control HVAC
    const contractor8 = await db.insert(contractors).values({
      userId: contractorUser8[0].id,
      companyName: 'Climate Control HVAC',
      description: 'Heating, ventilation, and air conditioning experts. Energy-efficient solutions for residential and commercial properties.',
      specialties: ['HVAC', 'Heating', 'Air Conditioning', 'Energy Efficiency'],

      hourlyRate: 85,
      logoUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isActive: true,
      subscriptionTier: 'pro',
      mediaFiles: [
        { url: '/videos/hvac1.mp4', type: 'video', name: 'HVAC Demo' }
      ]
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