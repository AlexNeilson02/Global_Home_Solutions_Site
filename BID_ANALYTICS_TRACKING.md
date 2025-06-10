# Bid Request Analytics & Tracking System

## Complete Data Tracking Specification

### 1. Bid Request Lifecycle Tracking
**Initial Creation:**
- Customer details (name, email, phone, address)
- Project specifications (service type, description, timeline, budget)
- Sales rep attribution (QR code source tracking)
- Contractor assignment
- Submission timestamp

**Status Progression:**
1. `pending` → Initial submission, awaiting contractor response
2. `contacted` → Contractor reached out to customer
3. `bid_sent` → Formal bid submitted, moves to Projects tab
4. `won` → Customer accepted, project awarded
5. `lost` → Customer declined or chose competitor
6. `declined` → Contractor declined to bid

### 2. Analytics Data for Admin Dashboard
**Conversion Funnel Metrics:**
- Total requests by time period
- Conversion rates at each stage
- Average time spent in each status
- Drop-off analysis and bottlenecks

**Sales Rep Performance:**
- QR code scan attribution
- Leads generated per rep
- Conversion rates (scan → request → win)
- Commission-eligible revenue
- Performance rankings and trends

**Contractor Efficiency:**
- Response time (pending → contacted)
- Bid conversion time (contacted → bid_sent)
- Win rate percentage (bid_sent → won)
- Revenue generated per contractor
- Customer interaction quality

**Revenue Analytics:**
- Pipeline value by status
- Won project revenue tracking
- Average project values
- Geographic performance
- Service type demand analysis

### 3. Analytics Data for Sales Rep Dashboard
**Personal Attribution:**
- QR codes scanned from their codes
- Bid requests attributed to them
- Success rate through conversion funnel

**Commission Tracking:**
- Projects won from their leads
- Pending commission opportunities
- Historical commission statements

**Performance Insights:**
- Rank compared to other reps
- Territory performance data
- Customer type conversion rates
- Time-based performance trends

### 4. Data Implementation Details
**Database Tracking:**
- All status changes logged with timestamps
- Actor tracking (who made each change)
- Duration analysis for each stage
- Full audit trail for analytics

**API Endpoints:**
- Admin analytics dashboard data
- Sales rep individual performance
- Contractor efficiency metrics
- Real-time conversion funnel data

**Privacy Compliance:**
- Customer data anonymized in reports
- Individual performance visible only to relevant users
- Aggregated data for system optimization
- GDPR-compliant data retention