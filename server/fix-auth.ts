import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './auth';

export async function fixAuthCredentials() {
  console.log('Fixing authentication credentials...');

  try {
    // Update admin user
    const adminHashedPassword = await hashPassword('admin123');
    await db.update(users)
      .set({ 
        password: adminHashedPassword,
        username: 'admin',
        email: 'admin@globalhomesolutions.com'
      })
      .where(eq(users.username, 'admin'));

    // Create or update contractor user
    const contractorHashedPassword = await hashPassword('contractor123');
    const existingContractor = await db.select().from(users).where(eq(users.username, 'contractor')).limit(1);
    
    if (existingContractor.length === 0) {
      await db.insert(users).values({
        username: 'contractor',
        password: contractorHashedPassword,
        email: 'contractor@globalhomesolutions.com',
        fullName: 'Test Contractor',
        phone: '555-0101',
        role: 'contractor',
        lastLogin: null,
      });
    } else {
      await db.update(users)
        .set({ password: contractorHashedPassword })
        .where(eq(users.username, 'contractor'));
    }

    // Create or update salesperson user
    const salespersonHashedPassword = await hashPassword('sales123');
    const existingSalesperson = await db.select().from(users).where(eq(users.username, 'salesperson')).limit(1);
    
    if (existingSalesperson.length === 0) {
      await db.insert(users).values({
        username: 'salesperson',
        password: salespersonHashedPassword,
        email: 'sales@globalhomesolutions.com',
        fullName: 'Test Salesperson',
        phone: '555-0102',
        role: 'salesperson',
        lastLogin: null,
      });
    } else {
      await db.update(users)
        .set({ password: salespersonHashedPassword })
        .where(eq(users.username, 'salesperson'));
    }

    // Update existing test users with proper hashed passwords
    const testPassword = await hashPassword('password123');
    await db.update(users)
      .set({ password: testPassword })
      .where(eq(users.username, 'contractor1'));

    await db.update(users)
      .set({ password: testPassword })
      .where(eq(users.username, 'sales1'));

    console.log('Authentication credentials fixed successfully');
  } catch (error) {
    console.error('Error fixing credentials:', error);
  }
}