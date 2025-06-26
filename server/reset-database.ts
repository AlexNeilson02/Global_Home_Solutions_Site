import { db } from './db';
import { 
  users, 
  contractors, 
  salespersons, 
  projects, 
  testimonials, 
  bidRequests, 
  pageVisits, 
  documents, 
  projectMilestones, 
  projectStatusUpdates, 
  commissionRecords, 
  commissionAdjustments, 
  commissionPayments 
} from '../shared/schema';
import { eq, ne } from 'drizzle-orm';

export async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    // Delete in order to respect foreign key constraints
    console.log('Deleting commission data...');
    await db.delete(commissionPayments);
    await db.delete(commissionAdjustments);
    await db.delete(commissionRecords);
    
    console.log('Deleting project-related data...');
    await db.delete(projectStatusUpdates);
    await db.delete(projectMilestones);
    await db.delete(documents);
    await db.delete(pageVisits);
    await db.delete(bidRequests);
    await db.delete(projects);
    await db.delete(testimonials);
    
    console.log('Deleting contractors and salespersons...');
    await db.delete(contractors);
    await db.delete(salespersons);
    
    console.log('Deleting non-admin users...');
    // Delete all users except admin
    await db.delete(users).where(ne(users.username, 'admin'));
    
    console.log('Database reset completed successfully!');
    console.log('Only admin user remains in the system.');
    
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

// Export for use in other files
export { resetDatabase as default };