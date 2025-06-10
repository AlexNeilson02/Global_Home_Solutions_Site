import { storage } from "./database-storage";
import { hashPassword } from "./auth";

export async function fixUserPasswords() {
  try {
    console.log("Starting password hash fix...");
    
    // Get all users
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2)
      if (!user.password.startsWith('$2')) {
        console.log(`Fixing password for user: ${user.username}`);
        
        // Hash the plain text password
        const hashedPassword = await hashPassword(user.password);
        
        // Update the user with the hashed password
        await storage.updateUser(user.id, { password: hashedPassword });
        
        console.log(`Password updated for user: ${user.username}`);
      } else {
        console.log(`Password already hashed for user: ${user.username}`);
      }
    }
    
    console.log("Password fix completed successfully!");
  } catch (error) {
    console.error("Error fixing passwords:", error);
    throw error;
  }
}