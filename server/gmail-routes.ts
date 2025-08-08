import express, { Request, Response } from 'express';
import { GmailService } from './gmail-service';
import { isAuthenticated } from './auth';
import { storage } from './database-storage';
import { z } from 'zod';

const router = express.Router();

// Email sending schema validation
const sendEmailSchema = z.object({
  to: z.string().email(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
  bidRequestId: z.number().optional()
});

// Gmail OAuth authorization endpoint
router.get('/auth/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    
    if (isNaN(contractorId)) {
      return res.status(400).json({ error: 'Invalid contractor ID' });
    }

    // Verify contractor exists and user has access
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Check if user has access to this contractor
    const user = (req as any).user;
    if (user.role !== 'admin' && contractor.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to contractor' });
    }

    const authUrl = GmailService.getAuthUrl();
    
    // Store contractor ID in session for the callback
    (req.session as any).gmailContractorId = contractorId;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Gmail auth error:', error);
    res.status(500).json({ error: 'Failed to initiate Gmail authorization' });
  }
});

// Gmail OAuth callback endpoint
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, error, state } = req.query;
    
    if (error) {
      return res.status(400).json({ error: `Gmail authorization failed: ${error}` });
    }
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code received' });
    }

    const contractorId = (req.session as any)?.gmailContractorId;
    if (!contractorId) {
      return res.status(400).json({ error: 'No contractor ID found in session' });
    }

    await GmailService.exchangeCodeForTokens(code as string, contractorId);
    
    // Clear the contractor ID from session
    delete (req.session as any).gmailContractorId;
    
    // Redirect to contractor portal with success message
    res.redirect(`https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/contractor-portal-enhanced?gmail_connected=true`);
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.status(500).json({ error: 'Failed to connect Gmail account' });
  }
});

// Check Gmail connection status
router.get('/status/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    
    if (isNaN(contractorId)) {
      return res.status(400).json({ error: 'Invalid contractor ID' });
    }

    const isConnected = await GmailService.isGmailConnected(contractorId);
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Gmail status check error:', error);
    res.status(500).json({ error: 'Failed to check Gmail status' });
  }
});

// Send email via Gmail
router.post('/send/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    
    if (isNaN(contractorId)) {
      return res.status(400).json({ error: 'Invalid contractor ID' });
    }

    // Validate request body
    const emailData = sendEmailSchema.parse(req.body);

    // Verify contractor exists and user has access
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Check if user has access to this contractor
    const user = (req as any).user;
    if (user.role !== 'admin' && contractor.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to contractor' });
    }

    // Check if Gmail is connected
    const isConnected = await GmailService.isGmailConnected(contractorId);
    if (!isConnected) {
      return res.status(400).json({ error: 'Gmail not connected for this contractor' });
    }

    await GmailService.sendEmail(contractorId, emailData);
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid email data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get recent emails for contractor
router.get('/emails/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    const maxResults = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(contractorId)) {
      return res.status(400).json({ error: 'Invalid contractor ID' });
    }

    // Verify contractor exists and user has access
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Check if user has access to this contractor
    const user = (req as any).user;
    if (user.role !== 'admin' && contractor.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to contractor' });
    }

    // Check if Gmail is connected
    const isConnected = await GmailService.isGmailConnected(contractorId);
    if (!isConnected) {
      return res.status(400).json({ error: 'Gmail not connected for this contractor' });
    }

    const emails = await GmailService.getRecentEmails(contractorId, maxResults);
    
    res.json({ emails });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get stored email communications from database
router.get('/communications/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(contractorId)) {
      return res.status(400).json({ error: 'Invalid contractor ID' });
    }

    // Verify contractor exists and user has access
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Check if user has access to this contractor
    const user = (req as any).user;
    if (user.role !== 'admin' && contractor.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to contractor' });
    }

    const communications = await storage.getEmailCommunicationsByContractorId(contractorId, limit);
    
    res.json({ communications });
  } catch (error) {
    console.error('Get communications error:', error);
    res.status(500).json({ error: 'Failed to fetch email communications' });
  }
});

// Disconnect Gmail
router.post('/disconnect/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.contractorId);
    
    if (isNaN(contractorId)) {
      return res.status(400).json({ error: 'Invalid contractor ID' });
    }

    // Verify contractor exists and user has access
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Check if user has access to this contractor
    const user = (req as any).user;
    if (user.role !== 'admin' && contractor.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to contractor' });
    }

    await GmailService.disconnectGmail(contractorId);
    
    res.json({ success: true, message: 'Gmail disconnected successfully' });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
});

export default router;