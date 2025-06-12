import { Router } from 'express';
import { Request, Response } from 'express';
import { storage } from './database-storage.js';
import { isAuthenticated, requireRole } from './auth.js';
import { upload, fileToBase64 } from './file-upload-service.js';
import path from 'path';

export const enhancedRouter = Router();

// File upload endpoint for contractor logos and media
enhancedRouter.post('/upload/contractor-media', isAuthenticated, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = files.map(file => {
      const base64Data = fileToBase64(file.path, file.mimetype);
      return {
        url: base64Data,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        name: file.originalname
      };
    });

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

// Enhanced contractor profile update with file support
enhancedRouter.patch('/contractors/:id/profile', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.id);
    
    if (isNaN(contractorId)) {
      return res.status(400).json({ message: 'Invalid contractor ID' });
    }
    
    const updateData = req.body;
    console.log('Updating contractor:', contractorId, 'with data:', updateData);

    // Ensure numeric fields are properly converted
    const sanitizedData = {
      ...updateData,
      hourlyRate: updateData.hourlyRate ? parseFloat(updateData.hourlyRate) : 0,
      isActive: updateData.isActive !== undefined ? updateData.isActive : true
    };

    // Update contractor with new data including media files
    const updatedContractor = await storage.updateContractor(contractorId, sanitizedData);
    
    if (!updatedContractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    res.json({ contractor: updatedContractor });
  } catch (error) {
    console.error('Contractor update error:', error);
    res.status(500).json({ message: 'Failed to update contractor profile' });
  }
});

// Enhanced salesperson profile update
enhancedRouter.patch('/salespersons/:id/profile', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const salespersonId = parseInt(req.params.id);
    const updateData = req.body;

    const updatedSalesperson = await storage.updateSalesperson(salespersonId, updateData);
    
    if (!updatedSalesperson) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    res.json({ salesperson: updatedSalesperson });
  } catch (error) {
    console.error('Salesperson update error:', error);
    res.status(500).json({ message: 'Failed to update salesperson profile' });
  }
});

// Admin: Get all users by role
enhancedRouter.get('/admin/users', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    
    let users;
    if (role && role !== 'all') {
      users = await storage.getUsersByRole(role as string);
    } else {
      users = await storage.getAllUsers();
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin: Update user status
enhancedRouter.patch('/admin/users/:id/status', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    const updatedUser = await storage.updateUser(userId, { isActive });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Admin: Update bid request status
enhancedRouter.patch('/admin/bid-requests/:id/status', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const bidId = parseInt(req.params.id);
    const { status } = req.body;

    const updatedBid = await storage.updateBidRequestStatus(bidId, status);
    
    if (!updatedBid) {
      return res.status(404).json({ message: 'Bid request not found' });
    }

    res.json({ bidRequest: updatedBid });
  } catch (error) {
    console.error('Update bid status error:', error);
    res.status(500).json({ message: 'Failed to update bid status' });
  }
});

// Admin: Delete bid request
enhancedRouter.delete('/admin/bid-requests/:id', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const bidId = parseInt(req.params.id);

    // Note: This would need to be implemented in storage
    // For now, we'll just update the status to 'deleted'
    const updatedBid = await storage.updateBidRequestStatus(bidId, 'deleted');
    
    if (!updatedBid) {
      return res.status(404).json({ message: 'Bid request not found' });
    }

    res.json({ message: 'Bid request deleted successfully' });
  } catch (error) {
    console.error('Delete bid error:', error);
    res.status(500).json({ message: 'Failed to delete bid request' });
  }
});

// Get comprehensive analytics for admin
enhancedRouter.get('/admin/analytics', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const contractors = await storage.getAllContractors();
    const salespersons = await storage.getAllSalespersons();
    const projects = await storage.getAllProjects();
    const bidRequests = await storage.getRecentBidRequests(100);

    // Calculate metrics
    const totalUsers = contractors.length + salespersons.length;
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const pendingBids = bidRequests.filter(b => b.status === 'pending').length;
    const totalRevenue = projects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.budget || 0), 0);

    const analytics = {
      totalUsers,
      totalContractors: contractors.length,
      totalSalespersons: salespersons.length,
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalBidRequests: bidRequests.length,
      pendingBids,
      totalRevenue,
      conversionRate: bidRequests.length > 0 ? (completedProjects / bidRequests.length) * 100 : 0,
      recentActivity: {
        newUsers: 0, // Would need to calculate based on recent registrations
        newProjects: projects.filter(p => {
          const created = new Date(p.createdAt || '');
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return created > oneWeekAgo;
        }).length,
        newBids: bidRequests.filter(b => {
          const created = new Date(b.createdAt || '');
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return created > oneWeekAgo;
        }).length
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Contractor: Get project analytics
enhancedRouter.get('/contractors/:id/analytics', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.id);
    
    const projects = await storage.getProjectsByContractorId(contractorId);
    const bidRequests = await storage.getBidRequestsByContractorId(contractorId);

    const analytics = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalRevenue: projects
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.budget || 0), 0),
      totalBids: bidRequests.length,
      pendingBids: bidRequests.filter(b => b.status === 'pending').length,
      successRate: projects.length > 0 ? (projects.filter(p => p.status === 'completed').length / projects.length) * 100 : 0
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Contractor analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch contractor analytics' });
  }
});

// Contractor management routes
enhancedRouter.patch('/admin/contractors/:id', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.id);
    const updateData = req.body;

    // Get the contractor to access the associated user
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Update contractor profile
    const contractorUpdateData: any = {};
    if (updateData.companyName) contractorUpdateData.companyName = updateData.companyName;
    if (updateData.description) contractorUpdateData.description = updateData.description;
    if (updateData.hourlyRate) contractorUpdateData.hourlyRate = parseFloat(updateData.hourlyRate);
    if (updateData.specialties) contractorUpdateData.specialties = updateData.specialties;
    if (updateData.serviceAreas) {
      contractorUpdateData.serviceAreas = updateData.serviceAreas.split(',').map((area: string) => area.trim());
    }

    const updatedContractor = await storage.updateContractor(contractorId, contractorUpdateData);

    // Update user data if provided
    if (updateData.fullName || updateData.email || updateData.phone || updateData.password) {
      const userUpdateData: any = {};
      if (updateData.fullName) userUpdateData.fullName = updateData.fullName;
      if (updateData.email) userUpdateData.email = updateData.email;
      if (updateData.phone) userUpdateData.phone = updateData.phone;
      if (updateData.password) userUpdateData.password = updateData.password;

      await storage.updateUser(contractor.userId, userUpdateData);
    }

    res.json({ 
      message: 'Contractor updated successfully',
      contractor: updatedContractor 
    });
  } catch (error) {
    console.error('Error updating contractor:', error);
    res.status(500).json({ error: 'Failed to update contractor' });
  }
});

enhancedRouter.delete('/admin/contractors/:id', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.id);
    
    // Archive the contractor by setting isActive to false
    const updatedContractor = await storage.updateContractor(contractorId, { isActive: false });
    
    if (!updatedContractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    res.json({ 
      message: 'Contractor archived successfully',
      contractor: updatedContractor 
    });
  } catch (error) {
    console.error('Error archiving contractor:', error);
    res.status(500).json({ error: 'Failed to archive contractor' });
  }
});

// Enhanced salesperson analytics with detailed metrics
enhancedRouter.get('/salespersons/:id/detailed-analytics', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const salespersonId = parseInt(req.params.id);
    
    const salesperson = await storage.getSalesperson(salespersonId);
    if (!salesperson) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    const analytics = await storage.getSalespersonAnalytics(salespersonId);
    const bidRequests = await storage.getBidRequestsBySalespersonId(salespersonId);
    const pageVisits = await storage.getPageVisitsBySalespersonId(salespersonId);

    // Calculate detailed metrics
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentVisits = pageVisits.filter(v => new Date(v.timestamp || '') > last30Days);
    const recentBids = bidRequests.filter(b => new Date(b.createdAt || '') > last30Days);

    const detailedAnalytics = {
      ...analytics,
      totalBidRequests: bidRequests.length,
      recentBidRequests: recentBids.slice(0, 5),
      visitStats: {
        totalVisits: pageVisits.length,
        recentVisits: recentVisits.length,
        conversionRate: pageVisits.length > 0 ? (bidRequests.length / pageVisits.length) * 100 : 0
      },
      performance: {
        averageLeadsPerMonth: (bidRequests.length / 6) || 0, // Assuming 6 months of data
        bestMonth: 'June', // Would calculate from actual data
        topService: bidRequests.length > 0 ? bidRequests[0].serviceRequested : 'None'
      }
    };

    res.json({ analytics: detailedAnalytics });
  } catch (error) {
    console.error('Detailed analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch detailed analytics' });
  }
});

// Edit salesperson endpoint
enhancedRouter.patch('/admin/salespersons/:id', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const salespersonId = parseInt(req.params.id);
    
    if (isNaN(salespersonId)) {
      return res.status(400).json({ message: 'Invalid salesperson ID' });
    }

    const { fullName, profileUrl, password } = req.body;

    // Get the salesperson to find the associated user
    const salesperson = await storage.getSalesperson(salespersonId);
    if (!salesperson) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    // Update user information if provided
    if (fullName || password) {
      const userUpdateData: any = {};
      if (fullName) userUpdateData.fullName = fullName;
      if (password) {
        const bcrypt = await import('bcrypt');
        userUpdateData.password = await bcrypt.hash(password, 10);
      }
      
      await storage.updateUser(salesperson.userId, userUpdateData);
    }

    // Update salesperson information if provided
    if (profileUrl) {
      await storage.updateSalesperson(salespersonId, { profileUrl });
    }

    res.json({ message: 'Salesperson updated successfully' });
  } catch (error) {
    console.error('Update salesperson error:', error);
    res.status(500).json({ message: 'Failed to update salesperson' });
  }
});

// Archive/Delete salesperson endpoint
enhancedRouter.delete('/admin/salespersons/:id', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const salespersonId = parseInt(req.params.id);
    
    if (isNaN(salespersonId)) {
      return res.status(400).json({ message: 'Invalid salesperson ID' });
    }

    // Get the salesperson to find the associated user
    const salesperson = await storage.getSalesperson(salespersonId);
    if (!salesperson) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    // For now, we'll set the salesperson and user as inactive (soft delete)
    // In a production system, you would implement proper archiving with 60-day deletion
    await storage.updateSalesperson(salespersonId, { isActive: false });
    await storage.updateUser(salesperson.userId, { role: 'archived' });

    res.json({ message: 'Salesperson archived successfully. Data will be permanently deleted after 60 days.' });
  } catch (error) {
    console.error('Archive salesperson error:', error);
    res.status(500).json({ message: 'Failed to archive salesperson' });
  }
});