import QRCode from 'qrcode';

export class QRCodeService {
  /**
   * Generate a QR code as a data URL for a given landing page URL
   */
  static async generateQRCode(landingPageUrl: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(landingPageUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#003366', // Company blue color
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate a landing page URL for a salesperson
   */
  static generateLandingPageUrl(baseUrl: string, profileUrl: string): string {
    return `${baseUrl}/sales/${profileUrl}`;
  }

  /**
   * Create a unique profile URL from username
   */
  static createProfileUrl(username: string): string {
    // Convert username to a clean URL-friendly format
    return username.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Generate NFC ID for a salesperson
   */
  static generateNfcId(): string {
    return 'nfc_' + Math.random().toString(36).substr(2, 9);
  }
}