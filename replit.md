# Global Home Solutions Platform

## Overview

This project is a comprehensive home services platform connecting homeowners with contractors via a sales representative network. Its core purpose is to streamline lead attribution using QR codes, track commissions, and provide role-based portals for administrators, contractors, salespeople, and homeowners. The platform aims to revolutionize the home services market by providing an efficient, transparent, and scalable solution for lead generation, service delivery, and payment processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, using Vite for building.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server-side data.
- **UI/UX**: Shadcn/ui built on Radix UI primitives, styled with Tailwind CSS, featuring custom Apple-inspired design tokens. The design emphasizes clean white backgrounds with blue focus indicators, eliminating all yellow styling.
- **Authentication**: Session-based, managed via a React context provider.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL, managed with Drizzle ORM.
- **Authentication**: Passport.js with local strategy and bcrypt for password hashing.
- **Session Management**: express-session with PostgreSQL store.

### Key Features & Design Patterns
- **Multi-role User Management**: Supports Admin, Contractor, Salesperson, and Homeowner roles with robust access control.
- **Commission Tracking**: Implemented via QR code attribution for sales leads, with a comprehensive, dynamic commission structure (including base costs and split percentages) linked to service categories. Commission payments are automatically charged to contractors via Stripe upon bid requests and distributed to salespersons and admins. Commission eligibility is tied to salesperson ID in the URL.
- **Service Categories**: Over 45 categories, each with specific commission structures and dynamic pricing.
- **File Management**: Leverages AWS S3 for scalable media storage (images and videos), supporting direct client-to-S3 uploads with progressive progress tracking.
- **Payment Processing**: Integrated Stripe for subscription management and automated commission charging to contractors.
- **Email Services**: Utilizes SendGrid for transactional emails.
- **Yellow Styling Removal**: Comprehensive elimination of yellow UI elements completed across all components including bid request forms, login modals, star ratings, and admin portal dialogs. Applied nuclear CSS tactics with 18+ targeting strategies including CSS variable overrides, webkit autofill fixes, dialog-specific rules, and inline style objects. All yellow borders, backgrounds, and outlines replaced with neutral alternatives while maintaining accessibility and dialog visibility.

### Data Flow Highlights
- **Lead Generation**: QR code scans attribute leads to salespeople using ?ref={profileUrl} parameter, all directing to homepage with unique tracking. Customers submit bid requests, and contractors are assigned based on service type and availability. The bid progresses through a defined status pipeline, automatically creating commission records.
- **Authentication**: Secure session creation and persistence, with role-based access to features.
- **Commission Calculation**: Based on service category and conversion, with automated distribution and comprehensive audit trails including source contractor, bid request, service type, and Stripe payment intent IDs.

### Recent Changes (January 2025)
- **QR Code System Redesign**: Modified QR code generation to direct all salespeople to homepage with unique ?ref={profileUrl} tracking parameter instead of individual landing pages (/sales/{profileUrl}). This maintains lead attribution while providing a unified customer experience. Updated Sales Portal UI to reflect "Tracking URL" terminology and improved instructions for QR code usage.

### Recent Changes (August 2025)
- **Contact Customer Workflow Enhancement**: Fixed the contractor portal's "Contact Customer" functionality to properly redirect users to the email tab with auto-composed emails before marking customers as contacted. The system now switches from the bid request tab to the email tab, automatically composes an email with customer details pre-filled, and only marks the bid request as "contacted" after the email is actually sent. Removed duplicate contractor-dashboard.tsx file - system now uses ContractorPortalEnhanced.tsx exclusively for contractor portal functionality.
- **Bid Response Time Analytics**: Added comprehensive bid response time tracking chart to the contractor portal Dashboard tab, replacing the bid status distribution pie chart. The new chart displays response time breakdown in categories ("< 24h", "24-48h", "2-3 days", "3-7 days", "> 7 days") based on actual database timestamps between bid request creation and contractor first response. Includes average response time calculation and professional chart styling with rotated labels and enhanced tooltips. Analytics tab remains unchanged as requested.
- **Revenue Analytics Enhancement**: Updated revenue calculations throughout the platform to use actual commission data from the database. Revenue now includes $100/month subscription fees from active contractors plus Override + Corp commission amounts from actual bid request commission records. Replaced "Commission Records" card with "Conversions %" card showing bid requests divided by salesperson-attributed page visits.
- **Page Visit Tracking Fix**: Fixed page visit tracking for ?ref=username URL parameter visits to the homepage. Added comprehensive tracking logic to HomePageNew.tsx that calls /api/track-visit endpoint when users visit with salesperson attribution, enabling accurate conversion percentage calculations.

## External Dependencies

- **Payment Gateway**: Stripe (for subscriptions, payment processing, webhooks, and automated commission charging).
- **Database Hosting**: Neon PostgreSQL (primary database hosting, connection pooling, session storage).
- **Cloud Storage**: AWS S3 (for media files, with IAM-based security and direct uploads).
- **Email Service**: SendGrid (for transactional email delivery and templates).
```