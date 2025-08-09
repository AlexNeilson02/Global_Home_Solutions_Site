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

### Recent Changes (August 2025)
- **Commission System Attribution Fix (August 9, 2025)**: Overhauled commission logic to ensure salespeople receive commissions whenever they are attributed to leads, regardless of QR/NFC verification status. Removed complex QR verification requirements for commission eligibility - now any salesperson attribution automatically qualifies for commission payment. Updated existing commission records and salesperson totals. Alex Neilson (sales123) now correctly earns $125 commission from attributed Rain Gutters lead. Both QR code and NFC scan attribution work identically for commission payments through the unified /api/track-visit endpoint.
- **Analytics Dashboard Commission Integration (August 9, 2025)**: Connected Top Performers analytics to display actual commission earnings instead of estimated project revenue. Updated frontend to show real commission amounts from salesperson.commissions field. Fixed Badge component styling in analytics dashboard to use consistent black text styling. Performance metrics now accurately reflect that Alex Neilson has earned $125.00 in actual commissions, providing precise financial tracking for salesperson performance evaluation.
- **Global White Rectangle Elimination (August 9, 2025)**: Extended white rectangle removal solution site-wide after user reported the overlay appearing throughout the entire platform. Created comprehensive global-white-rectangle-killer.css with nuclear-level CSS targeting all potential white overlay sources including: fixed/absolute positioned elements, toast notifications, status messages, bottom-right corner overlays, Replit development UI, and common framework patterns. Applied aggressive transparency rules and element hiding strategies across all pages. Successfully eliminated white rectangular overlays from homepage, contractor portal, sales portal, admin portal, and all other site sections.
- **Contact Customer Email Workflow Enhancement (August 9, 2025)**: Successfully implemented new email-first customer contact workflow in contractor portal. Modified "Contact Customer" button to navigate users to email tab with pre-filled professional email template containing customer details, project information, and company branding. Email sending now automatically marks bid requests as "contacted" only after successful email delivery, ensuring proper status tracking. Enhanced Gmail integration component to accept pending email data and auto-compose emails for seamless contractor communication workflow.
- **Sales Portal Commission Analytics Enhancement (August 9, 2025)**: Updated commission analytics to properly count all attributed bid requests as "deals made" rather than just commission records. Modified getCommissionSummaryBySalesperson to include all bid requests where salespersonId is attributed, providing accurate deal count metrics. Commission dashboard now shows real deal volume (all attributed leads) and accurate average commission calculations. "Deals Made" metric now reflects total lead attribution impact, not just processed commission payments, giving salespeople complete visibility into their lead generation performance.
- **Sales Portal Analytics Tab Removal (August 9, 2025)**: Completely removed the standalone Analytics tab from Sales Portal navigation per user request. Updated both desktop and mobile navigation to display 4 tabs instead of 5: Dashboard, Lead Management, Commissions, and Profile. Analytics data still powers dashboard metrics like conversions and performance indicators, but no longer exists as a separate tab section. This streamlines the sales portal interface while maintaining essential performance tracking within the dashboard.

### Previous Changes (January 2025)
- **QR Code System Redesign**: Modified QR code generation to direct all salespeople to homepage with unique ?ref={profileUrl} tracking parameter instead of individual landing pages (/sales/{profileUrl}). This maintains lead attribution while providing a unified customer experience. Updated Sales Portal UI to reflect "Tracking URL" terminology and improved instructions for QR code usage.

## External Dependencies

- **Payment Gateway**: Stripe (for subscriptions, payment processing, webhooks, and automated commission charging).
- **Database Hosting**: Neon PostgreSQL (primary database hosting, connection pooling, session storage).
- **Cloud Storage**: AWS S3 (for media files, with IAM-based security and direct uploads).
- **Email Service**: SendGrid (for transactional email delivery and templates).
```