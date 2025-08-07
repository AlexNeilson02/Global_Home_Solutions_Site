# Global Home Solutions Platform

## Overview

This is a comprehensive home services platform that connects homeowners with contractors through a sales representative network. The platform features QR code-based lead attribution, commission tracking, and role-based portals for different user types.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query for server state
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom Apple-inspired design tokens
- **Authentication**: Session-based with context provider

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and bcrypt
- **Session Management**: express-session with PostgreSQL store
- **File Uploads**: Multer with memory storage
- **Payment Processing**: Stripe integration
- **Email**: SendGrid integration

## Key Components

### User Management System
- **Multi-role authentication**: Admin, Contractor, Salesperson, Homeowner
- **Session-based authentication** with PostgreSQL session store
- **Role-based access control** for different portal areas
- **Password hashing** with bcrypt for security

### Commission Tracking System
- **QR code attribution** for sales rep lead tracking
- **Comprehensive commission structure** with base costs and split percentages
- **Analytics dashboard** for performance tracking
- **Commission records** with payment status tracking

### Service Categories
- **45+ service categories** with individual commission structures
- **Dynamic pricing** based on service type complexity
- **Geographic service area** mapping
- **Contractor specialty** matching

### File Management
- **AWS S3 cloud storage** for scalable media hosting
- **Video upload system** with 100MB size limit and cloud optimization
- **Image handling** with S3 URLs for faster loading
- **Multer-S3 integration** for direct cloud uploads
- **Progressive upload** with progress tracking

## Data Flow

### Lead Generation Flow
1. QR code scan triggers visit tracking with salesperson attribution
2. Customer submits bid request through service-specific forms
3. System assigns contractors based on service type and availability
4. Bid request progresses through status pipeline: pending → contacted → bid_sent → won/lost
5. Commission records created automatically when bids are sent

### User Authentication Flow
1. Login credentials validated against bcrypt-hashed passwords
2. Session created and stored in PostgreSQL sessions table
3. User role determines portal access and available features
4. Session persistence across browser sessions with secure cookies

### Commission Calculation Flow
1. Service category determines base commission structure
2. Salesperson receives percentage-based commission on successful conversions
3. Override manager and corporate percentages calculated automatically
4. Commission records track payment status and adjustment history

## External Dependencies

### Payment Processing
- **Stripe** for subscription management and payment processing
- **Webhook handling** for payment status updates
- **Customer and subscription** management integration

### Database Hosting
- **Neon PostgreSQL** for primary database hosting
- **Connection pooling** with retry logic for reliability
- **Session storage** in dedicated sessions table

### Cloud Storage
- **AWS S3** for media file storage and delivery
- **IAM-based security** with dedicated bucket access
- **Direct upload** from client to S3 for optimal performance
- **Organized folder structure** by file type and user

### Email Services
- **SendGrid** for transactional email delivery
- **Email templates** for bid notifications and communications

### Development Tools
- **Drizzle Kit** for database migrations and schema management
- **ESBuild** for production bundle optimization
- **TypeScript** for type safety across the stack

## Deployment Strategy

### Build Process
- **Vite build** for optimized frontend assets
- **ESBuild** for server-side bundle creation
- **Static asset** serving through Express

### Environment Configuration
- **Development**: Hot reloading with Vite dev server
- **Production**: Single-process Express server with static file serving
- **Database**: Environment-specific connection strings

### Hosting Platform
- **Replit deployment** with autoscale configuration
- **Port mapping**: Internal 5000 to external 80
- **Module dependencies**: Node.js 20, PostgreSQL 16, Web module

## Changelog

- June 26, 2025. Initial setup
- June 26, 2025. Integrated AWS S3 cloud storage for media files - significantly improved performance by replacing local file storage with scalable cloud infrastructure
- June 26, 2025. Reset database to clean slate - removed all test data, keeping only admin user for fresh start
- June 26, 2025. Removed project tracking functionality from contractor portal - transformed "Projects" tab to "Sent Bids" to focus on bid management rather than project lifecycle tracking
- June 26, 2025. Fixed contractor creation functionality in admin portal - replaced direct fetch calls with proper TanStack Query mutations for automatic cache invalidation and improved UI consistency
- June 26, 2025. Resolved critical routing conflict preventing contractor creation - fixed server route imports from routes-clean.ts to routes.ts, enabling proper JSON API responses and database persistence
- June 27, 2025. Created "Find Electricians" card - replaced first contractor profile card with electrical service search functionality, featuring blue gradient background with professional stock photo of electrician working on electrical panel and category-based search integration
- August 5, 2025. Connected home page contractor tiles to individual profiles - updated Continental Concrete (ID 19), Vault Pest Control (ID 20), and Watermelon Window Washing (ID 18) tiles to navigate directly to their respective contractor profile pages with proper database integration
- August 5, 2025. Fixed QR code commission tracking system - implemented comprehensive solution for salesperson attribution including retry logic, enhanced error handling, visual feedback in bid forms, improved database lookup with case-insensitive matching, and detailed debugging logs to ensure sales reps receive proper commission credit when customers scan QR codes and submit bid requests
- August 6, 2025. Enhanced commission security with mandatory QR/NFC verification - implemented strict commission eligibility system that only pays sales representatives when users arrive via verified QR codes or NFC tags. Added session tracking IDs, page visit verification flags, and commission eligibility checks to prevent unauthorized commission attribution. This ensures fair compensation tied directly to sales rep marketing efforts.
- August 6, 2025. Simplified commission tracking system - reset logic to use straightforward URL parameter approach instead of complex session tracking. Commission attribution now only occurs when salesperson_id is present in URL (e.g., site.com/contractor/123?salesperson_id=456). Removed all complex verification systems, session tracking IDs, and fallback logic. System now strictly follows: URL parameter present = commission assigned, no parameter = no commission. This eliminates unauthorized commission attribution while providing simple, reliable tracking.
- August 6, 2025. Fixed contractor portal specialties dropdown runtime error - replaced problematic Shadcn Select component with native HTML select element. The Shadcn Select was causing unknown runtime errors when clicked, preventing contractors from selecting specialties from service categories. Native HTML select provides the same functionality with better reliability, proper error handling, and seamless integration with the existing form system. Specialties can now be selected from dropdown and managed as removable badges without crashes.
- August 6, 2025. Fixed Portfolio Media upload persistence issue - added missing mediaFiles JSON column to contractors database schema and successfully pushed changes using drizzle-kit. Media files now persist correctly after upload and profile save, resolving issue where uploaded files disappeared on page refresh.
- August 6, 2025. Enhanced contractor profile page with image enlargement functionality - added clickable images with hover effects, full-screen modal viewer with navigation arrows, close button, image counter, and filename display. Images can now be clicked to view in enlarged format with smooth transitions and professional gallery-style navigation for better user experience.
- August 7, 2025. Integrated embedded Stripe payment system into ContractorPortalEnhanced - replaced redirect-based subscription flow with inline payment forms using Stripe Elements. Added dynamic subscription status detection, secure payment processing, subscription management with cancel functionality, and clean UI showing payment status and subscription benefits. Contractors can now subscribe to $100/month premium plans directly within the portal without page redirects.
- August 7, 2025. Removed unused ContractorPortal.tsx file - cleaned up codebase by removing the old contractor portal component that was replaced by ContractorPortalEnhanced.tsx. All contractor functionality now uses the enhanced portal with better UI and integrated Stripe payments.
- August 7, 2025. Fixed Stripe subscription payment processing - resolved issues with client secret generation by implementing proper setup intent handling for incomplete subscriptions. Added fallback setup intent creation when payment intent isn't available, enhanced subscription creation with payment settings, and improved payment form to handle both payment and setup confirmations. Added test card information display (4242 4242 4242 4242) for seamless testing in development environment. The embedded payment system now properly displays card input fields and processes $100/month subscription payments successfully.
- August 7, 2025. Implemented automatic commission charging for bid requests - contractors are now automatically charged when they receive bid requests from customers. Added real Stripe payment method integration that fetches and stores actual card details (brand, last 4 digits, expiry) from Stripe customer accounts. Commission amounts are calculated based on service category base costs (15% rate). Payment method details persist across sessions and display with proper brand styling. System includes comprehensive error handling, payment tracking, and commission record creation for full audit trail.

## User Preferences

Preferred communication style: Simple, everyday language.