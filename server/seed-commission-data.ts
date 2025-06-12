import { storage } from "./database-storage";

// Commission data from the price sheet
const commissionData = [
  { service: "Decks & Porches", baseCost: 200.0, salesmanCommission: 100.0, overrideCommission: 20.0, corpCommission: 80.0 },
  { service: "Electrical", baseCost: 140.0, salesmanCommission: 70.0, overrideCommission: 14.0, corpCommission: 56.0 },
  { service: "Epoxy Flooring", baseCost: 150.0, salesmanCommission: 75.0, overrideCommission: 15.0, corpCommission: 60.0 },
  { service: "Fencing", baseCost: 200.0, salesmanCommission: 100.0, overrideCommission: 20.0, corpCommission: 80.0 },
  { service: "Flooring & Hardwood", baseCost: 250.0, salesmanCommission: 125.0, overrideCommission: 25.0, corpCommission: 100.0 },
  { service: "Foundation Repair", baseCost: 250.0, salesmanCommission: 125.0, overrideCommission: 25.0, corpCommission: 100.0 },
  { service: "Handyman", baseCost: 120.0, salesmanCommission: 60.0, overrideCommission: 12.0, corpCommission: 48.0 },
  { service: "Heating & Cooling", baseCost: 200.0, salesmanCommission: 100.0, overrideCommission: 20.0, corpCommission: 80.0 },
  { service: "Insulation", baseCost: 150.0, salesmanCommission: 75.0, overrideCommission: 15.0, corpCommission: 60.0 },
  { service: "Kitchen Remodeling", baseCost: 400.0, salesmanCommission: 200.0, overrideCommission: 40.0, corpCommission: 160.0 },
  { service: "Outdoor Remodeling", baseCost: 300.0, salesmanCommission: 150.0, overrideCommission: 30.0, corpCommission: 120.0 },
  { service: "Painting Interior & Exterior", baseCost: 200.0, salesmanCommission: 100.0, overrideCommission: 20.0, corpCommission: 80.0 },
  { service: "Patio Covers", baseCost: 200.0, salesmanCommission: 100.0, overrideCommission: 20.0, corpCommission: 80.0 },
  { service: "Pest Control", baseCost: 150.0, salesmanCommission: 75.0, overrideCommission: 15.0, corpCommission: 60.0 },
  { service: "Plumbing", baseCost: 150.0, salesmanCommission: 75.0, overrideCommission: 15.0, corpCommission: 60.0 },
  { service: "Rain Gutters", baseCost: 250.0, salesmanCommission: 125.0, overrideCommission: 25.0, corpCommission: 100.0 },
  { service: "Reglazing (Bath & Countertop)", baseCost: 50.0, salesmanCommission: 25.0, overrideCommission: 5.0, corpCommission: 20.0 },
  { service: "Restoration (Fire and Water)", baseCost: 350.0, salesmanCommission: 175.0, overrideCommission: 35.0, corpCommission: 140.0 },
  { service: "Roofing", baseCost: 400.0, salesmanCommission: 200.0, overrideCommission: 40.0, corpCommission: 160.0 },
  { service: "Room Additions/New Construction", baseCost: 400.0, salesmanCommission: 200.0, overrideCommission: 40.0, corpCommission: 160.0 },
  { service: "Shutters/Shades/Blinds", baseCost: 200.0, salesmanCommission: 100.0, overrideCommission: 20.0, corpCommission: 80.0 },
  { service: "Siding", baseCost: 150.0, salesmanCommission: 75.0, overrideCommission: 15.0, corpCommission: 60.0 },
  { service: "Swimming Pools", baseCost: 300.0, salesmanCommission: 150.0, overrideCommission: 30.0, corpCommission: 120.0 },
  { service: "Tree Service", baseCost: 150.0, salesmanCommission: 75.0, overrideCommission: 15.0, corpCommission: 60.0 },
  { service: "Walk-in Tubs", baseCost: 400.0, salesmanCommission: 200.0, overrideCommission: 40.0, corpCommission: 160.0 },
  { service: "Windows & Doors", baseCost: 300.0, salesmanCommission: 150.0, overrideCommission: 30.0, corpCommission: 120.0 },
  { service: "Wood Refinishing", baseCost: 150.0, salesmanCommission: 75.0, overrideCommission: 15.0, corpCommission: 60.0 },
  { service: "Pool service", baseCost: 155.0, salesmanCommission: 77.5, overrideCommission: 15.5, corpCommission: 62.0 },
  { service: "concrete patio/drive walk", baseCost: 155.0, salesmanCommission: 77.5, overrideCommission: 15.5, corpCommission: 62.0 },
  { service: "remodel", baseCost: 444.0, salesmanCommission: 222.0, overrideCommission: 44.4, corpCommission: 177.6 },
  { service: "House cleaning", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "Block wall/ fence", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "landscaping", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "vet services", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "interior design", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "low voltage", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "HVAC", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "Turf", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "handy man service", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "sheet rock", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "general contracting remodel", baseCost: 444.0, salesmanCommission: 222.0, overrideCommission: 44.4, corpCommission: 177.6 },
  { service: "garbage haul off", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "solar", baseCost: 444.0, salesmanCommission: 222.0, overrideCommission: 44.4, corpCommission: 177.6 },
  { service: "excavation", baseCost: 166.0, salesmanCommission: 83.0, overrideCommission: 16.6, corpCommission: 66.4 },
  { service: "stone and masonry", baseCost: 222.0, salesmanCommission: 111.0, overrideCommission: 22.2, corpCommission: 88.8 },
  { service: "window and door install", baseCost: 333.0, salesmanCommission: 166.5, overrideCommission: 33.3, corpCommission: 133.2 },
  { service: "trim carpentry", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "countertops", baseCost: 222.0, salesmanCommission: 111.0, overrideCommission: 22.2, corpCommission: 88.8 },
  { service: "fireplace", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "smart home automation", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "generator install", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "home security and surveillance", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "tile", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "carpet", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "concrete polishing", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "appliances", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "home inspection", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "landscape design", baseCost: 222.0, salesmanCommission: 111.0, overrideCommission: 22.2, corpCommission: 88.8 },
  { service: "outdoor kitchens", baseCost: 333.0, salesmanCommission: 166.5, overrideCommission: 33.3, corpCommission: 133.2 },
  { service: "blinds and shutters", baseCost: 111.0, salesmanCommission: 55.5, overrideCommission: 11.1, corpCommission: 44.4 },
  { service: "property management", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "hvac maintenance", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "water softeners and filtration", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "window washing", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 },
  { service: "garage door", baseCost: 77.0, salesmanCommission: 38.5, overrideCommission: 7.7, corpCommission: 30.8 }
];

export async function seedCommissionData() {
  console.log("Updating service categories with commission data...");
  
  for (const commissionInfo of commissionData) {
    try {
      const categories = await storage.getAllServiceCategories();
      const category = categories.find(cat => 
        cat.name.toLowerCase().includes(commissionInfo.service.toLowerCase()) ||
        commissionInfo.service.toLowerCase().includes(cat.name.toLowerCase())
      );

      if (category) {
        await storage.updateServiceCategory(category.id, {
          baseCost: commissionInfo.baseCost,
          salesmanCommission: commissionInfo.salesmanCommission,
          overrideCommission: commissionInfo.overrideCommission,
          corpCommission: commissionInfo.corpCommission
        });
        console.log(`Updated commission data for: ${category.name}`);
      } else {
        // Create new service category if it doesn't exist
        await storage.createServiceCategory({
          name: commissionInfo.service,
          description: `${commissionInfo.service} services`,
          isActive: true,
          baseCost: commissionInfo.baseCost,
          salesmanCommission: commissionInfo.salesmanCommission,
          overrideCommission: commissionInfo.overrideCommission,
          corpCommission: commissionInfo.corpCommission
        });
        console.log(`Created new service category: ${commissionInfo.service}`);
      }
    } catch (error) {
      console.error(`Error updating commission data for ${commissionInfo.service}:`, error);
    }
  }
  
  console.log("Commission data seeding completed!");
}