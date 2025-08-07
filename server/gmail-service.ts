import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './database-storage';

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  body: string;
  htmlBody?: string;
  sentAt: Date;
  attachments?: { name: string; url: string; size: number }[];
  labels?: string[];
}

interface EmailToSend {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
}

export class GmailService {
  private static oauth2Client: OAuth2Client;

  static {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.REPLIT_DEV_DOMAIN}/api/gmail/callback`
    );
  }

  /**
   * Get OAuth authorization URL for contractors to connect Gmail
   */
  static getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens and save to database
   */
  static async exchangeCodeForTokens(code: string, contractorId: number): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to obtain valid tokens');
      }

      // Save tokens to contractor record
      await storage.updateContractor(contractorId, {
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token,
        gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmailConnected: true
      });

      console.log(`Gmail connected for contractor ${contractorId}`);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Get authenticated Gmail client for contractor
   */
  static async getGmailClient(contractorId: number) {
    const contractor = await storage.getContractor(contractorId);
    if (!contractor || !contractor.gmailAccessToken || !contractor.gmailRefreshToken) {
      throw new Error('Gmail not connected for this contractor');
    }

    this.oauth2Client.setCredentials({
      access_token: contractor.gmailAccessToken,
      refresh_token: contractor.gmailRefreshToken,
      expiry_date: contractor.gmailTokenExpiry?.getTime()
    });

    // Refresh token if needed
    if (contractor.gmailTokenExpiry && contractor.gmailTokenExpiry < new Date()) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Update stored tokens
        await storage.updateContractor(contractorId, {
          gmailAccessToken: credentials.access_token!,
          gmailTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
        });

        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error refreshing tokens:', error);
        throw new Error('Failed to refresh Gmail tokens. Please reconnect Gmail.');
      }
    }

    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Send email via Gmail API
   */
  static async sendEmail(contractorId: number, emailData: EmailToSend): Promise<void> {
    try {
      const gmail = await this.getGmailClient(contractorId);
      
      // Build email message
      const emailLines = [
        `To: ${emailData.to}`,
        emailData.cc ? `Cc: ${emailData.cc.join(', ')}` : null,
        emailData.bcc ? `Bcc: ${emailData.bcc.join(', ')}` : null,
        `Subject: ${emailData.subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        emailData.htmlBody || emailData.body
      ].filter(Boolean).join('\n');

      const encodedMessage = Buffer.from(emailLines).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      // Save email to database
      await storage.createEmailCommunication({
        contractorId,
        messageId: response.data.id!,
        threadId: response.data.threadId!,
        subject: emailData.subject,
        fromEmail: await this.getContractorEmail(contractorId),
        toEmail: emailData.to,
        ccEmails: emailData.cc || undefined,
        bccEmails: emailData.bcc || undefined,
        body: emailData.body,
        htmlBody: emailData.htmlBody || undefined,
        direction: 'sent',
        status: 'delivered',
        sentAt: new Date()
      });

      console.log(`Email sent successfully from contractor ${contractorId} to ${emailData.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get recent emails for contractor
   */
  static async getRecentEmails(contractorId: number, maxResults: number = 10): Promise<GmailMessage[]> {
    try {
      const gmail = await this.getGmailClient(contractorId);
      
      // Get list of messages
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox OR in:sent'
      });

      const messages = messagesResponse.data.messages || [];
      const emailMessages: GmailMessage[] = [];

      // Get details for each message
      for (const message of messages) {
        try {
          const messageDetails = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!
          });

          const headers = messageDetails.data.payload?.headers || [];
          const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          // Extract email body
          let body = '';
          let htmlBody = '';
          
          if (messageDetails.data.payload?.body?.data) {
            body = Buffer.from(messageDetails.data.payload.body.data, 'base64').toString();
          } else if (messageDetails.data.payload?.parts) {
            for (const part of messageDetails.data.payload.parts) {
              if (part.mimeType === 'text/plain' && part.body?.data) {
                body = Buffer.from(part.body.data, 'base64').toString();
              } else if (part.mimeType === 'text/html' && part.body?.data) {
                htmlBody = Buffer.from(part.body.data, 'base64').toString();
              }
            }
          }

          emailMessages.push({
            id: messageDetails.data.id!,
            threadId: messageDetails.data.threadId!,
            subject: getHeader('subject'),
            from: getHeader('from'),
            to: getHeader('to'),
            cc: getHeader('cc') ? getHeader('cc').split(',').map(e => e.trim()) : undefined,
            bcc: getHeader('bcc') ? getHeader('bcc').split(',').map(e => e.trim()) : undefined,
            body: body || htmlBody,
            htmlBody,
            sentAt: new Date(parseInt(messageDetails.data.internalDate!) || Date.now()),
            labels: messageDetails.data.labelIds || undefined
          });
        } catch (error) {
          console.error(`Error getting message ${message.id}:`, error);
        }
      }

      return emailMessages;
    } catch (error) {
      console.error('Error getting recent emails:', error);
      throw error;
    }
  }

  /**
   * Get contractor's email address
   */
  private static async getContractorEmail(contractorId: number): Promise<string> {
    const contractor = await storage.getContractor(contractorId);
    if (!contractor) {
      throw new Error('Contractor not found');
    }
    
    const user = await storage.getUser(contractor.userId);
    return user?.email || 'unknown@contractor.com';
  }

  /**
   * Check if contractor has Gmail connected
   */
  static async isGmailConnected(contractorId: number): Promise<boolean> {
    const contractor = await storage.getContractor(contractorId);
    return contractor?.gmailConnected === true && 
           !!contractor.gmailAccessToken && 
           !!contractor.gmailRefreshToken;
  }

  /**
   * Disconnect Gmail for contractor
   */
  static async disconnectGmail(contractorId: number): Promise<void> {
    await storage.updateContractor(contractorId, {
      gmailAccessToken: null,
      gmailRefreshToken: null,
      gmailTokenExpiry: null,
      gmailConnected: false
    });

    console.log(`Gmail disconnected for contractor ${contractorId}`);
  }
}