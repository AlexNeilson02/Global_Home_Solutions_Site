import { IStorage } from './storage';
import { InsertCustomerAttribution } from '@shared/schema';

export class CustomerAttributionService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Creates initial session attribution when customer visits via QR/NFC
   */
  async createSessionAttribution(
    customerEmail: string | null,
    salespersonId: number,
    attributionSource: 'qr_code' | 'nfc_tag' | 'web_link',
    customerName?: string,
    customerPhone?: string
  ): Promise<void> {
    try {
      // Only create attribution if we have customer email
      if (!customerEmail) {
        console.log(`📝 Session visit tracked (no email): salesperson ${salespersonId}, source: ${attributionSource}`);
        return;
      }

      // Normalize email
      const normalizedEmail = customerEmail.toLowerCase().trim();

      // Check if customer already has any attribution for this salesperson
      const existingAttribution = await this.storage.getActiveCustomerAttributionByEmail(normalizedEmail);
      
      if (existingAttribution) {
        // If attribution exists for same salesperson, update stats
        if (existingAttribution.salespersonId === salespersonId) {
          console.log(`📊 Updating existing attribution stats for customer`);
          await this.storage.updateCustomerAttributionStats(normalizedEmail, salespersonId);
          return;
        } else {
          // Customer already attributed to different salesperson - log but don't override
          console.log(`⚠️ Customer already attributed to different salesperson ${existingAttribution.salespersonId}, ignoring new attribution to ${salespersonId}`);
          return;
        }
      }

      // Create new session attribution
      const attribution: InsertCustomerAttribution = {
        customerEmail: normalizedEmail,
        salespersonId,
        attributionType: 'session',
        attributionSource,
        customerName,
        customerPhone,
        isActive: true
      };

      console.log(`🆕 Creating session attribution for customer → salesperson ${salespersonId}`);
      await this.storage.createCustomerAttribution(attribution);
    } catch (error) {
      console.error('❌ Error creating session attribution:', error);
    }
  }

  /**
   * Creates or updates customer attribution when they submit their first bid request
   */
  async createOrUpdateCustomerAttribution(
    customerEmail: string,
    salespersonId: number,
    attributionSource: 'qr_code' | 'nfc_tag' | 'web_link',
    customerName?: string,
    customerPhone?: string
  ): Promise<void> {
    try {
      // Normalize email to lowercase
      const normalizedEmail = customerEmail.toLowerCase().trim();

      // Check if attribution already exists for this customer
      const existingAttribution = await this.storage.getActiveCustomerAttributionByEmail(normalizedEmail);

      if (existingAttribution) {
        // Update stats for existing attribution
        console.log(`📊 Updating existing customer attribution for customer`);
        await this.storage.updateCustomerAttributionStats(normalizedEmail, existingAttribution.salespersonId);
      } else {
        // Create new session attribution
        const attribution: InsertCustomerAttribution = {
          customerEmail: normalizedEmail,
          salespersonId,
          attributionType: 'session',
          attributionSource,
          customerName,
          customerPhone,
          isActive: true
        };

        console.log(`🆕 Creating new customer attribution:`, attribution);
        await this.storage.createCustomerAttribution(attribution);
      }
    } catch (error) {
      console.error('❌ Error creating/updating customer attribution:', error);
    }
  }

  /**
   * Upgrades session attribution to permanent when PWA is installed
   */
  async upgradeToPermanentAttribution(
    customerEmail: string,
    salespersonId: number
  ): Promise<boolean> {
    try {
      console.log(`🔄 Upgrading to permanent attribution for salesperson ${salespersonId}`);

      // Normalize email
      const normalizedEmail = customerEmail.toLowerCase().trim();

      // Check if customer already has permanent attribution
      const existingAttribution = await this.storage.getActiveCustomerAttributionByEmail(normalizedEmail);
      
      if (existingAttribution?.attributionType === 'permanent') {
        console.log(`✅ Customer already has permanent attribution`);
        return true;
      }

      // Upgrade the attribution to permanent
      const upgraded = await this.storage.upgradeCustomerAttributionToPermanent(normalizedEmail, salespersonId);
      
      if (upgraded) {
        console.log(`🎉 Successfully upgraded customer to permanent attribution for salesperson ${salespersonId}`);
        return true;
      } else {
        console.warn(`⚠️ Could not find session attribution to upgrade for customer`);
        
        // If no session attribution exists, create a new permanent one
        // This handles the case where customer installs app before submitting bid request
        const attribution: InsertCustomerAttribution = {
          customerEmail: normalizedEmail,
          salespersonId,
          attributionType: 'permanent',
          attributionSource: 'qr_code', // Assume QR since they're installing from tracked visit
          permanentAttributionDate: new Date(),
          isActive: true
        };

        await this.storage.createCustomerAttribution(attribution);
        console.log(`🆕 Created new permanent attribution for customer`);
        return true;
      }
    } catch (error) {
      console.error('❌ Error upgrading to permanent attribution:', error);
      return false;
    }
  }

  /**
   * Gets the active attribution for a customer (prefers permanent over session)
   */
  async getCustomerAttribution(customerEmail: string) {
    try {
      const normalizedEmail = customerEmail.toLowerCase().trim();
      return await this.storage.getActiveCustomerAttributionByEmail(normalizedEmail);
    } catch (error) {
      console.error('❌ Error getting customer attribution:', error);
      return null;
    }
  }

  /**
   * Checks if a customer has permanent attribution
   */
  async hasPermanentAttribution(customerEmail: string): Promise<boolean> {
    const attribution = await this.getCustomerAttribution(customerEmail);
    return attribution?.attributionType === 'permanent';
  }
}