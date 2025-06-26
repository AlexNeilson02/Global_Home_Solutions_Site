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

## User Preferences

Preferred communication style: Simple, everyday language.