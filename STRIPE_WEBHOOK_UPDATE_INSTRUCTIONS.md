# Update Stripe Webhook Endpoint URL

## Current Issue
Your Stripe webhook needs to point to your production domain for proper functionality.

## Steps to Fix

### 1. Go to Stripe Dashboard
- Visit: https://dashboard.stripe.com
- Navigate to: **Developers** → **Webhooks**

### 2. Update Existing Webhook
Find your existing webhook endpoint and update it to:

**Production Endpoint URL:**
```
https://global-home-solutions.com/api/stripe-connect/webhook
```

### 3. Fix Event Payload Configuration
**IMPORTANT:** Change the event payload setting:
- Look for **"Event payload"** dropdown
- Change from "Snapshot" to **"Thin"**
- This fixes the "thin event types when event_payload is snapshot" error

### 4. Select These Events
After changing to "Thin" payload, select:
- `account.updated`
- `application_fee.created`
- `capability.updated`
- `charge.succeeded`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `person.created`
- `person.updated`
- `transfer.created`

### 4. Get New Webhook Secret
After updating, you'll get a new webhook signing secret that starts with `whsec_`

### 5. Update Secret in Replit
You'll need to provide the new webhook secret so I can update it in your environment variables.

## Why This Matters
- ✅ Real-time account status updates when salesperson completes onboarding
- ✅ Automatic commission payment logging
- ✅ Proper webhook event processing
- ✅ Complete audit trail for all transactions

Once updated, the Stripe Connect integration will work seamlessly with your deployed application.