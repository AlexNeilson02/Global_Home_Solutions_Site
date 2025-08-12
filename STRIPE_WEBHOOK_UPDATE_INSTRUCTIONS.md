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

### 3. Select Snapshot-Compatible Events
Since you're using "Snapshot" payload, select these events:
- `account.updated`
- `capability.updated`
- `charge.succeeded`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.paid`
- `transfer.failed`
- `payout.created`
- `payout.paid`
- `payout.failed`

**Note:** Avoid the "thin" events like `eo_money_engagement.*` when using snapshot mode.

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