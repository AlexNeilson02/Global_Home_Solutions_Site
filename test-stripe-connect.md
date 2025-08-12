# Testing Stripe Connect Integration

## How to Test the Commission System

### Step 1: Access Sales Portal
1. Go to your app: https://workspace.alexneilson02.repl.co
2. Click "Portal Access" 
3. Login as a salesperson:
   - Username: `sales123`
   - Password: Use the password from your system

### Step 2: Test Stripe Connect Account Creation
1. In Sales Portal, click the "Payments" tab (desktop) or payments icon (mobile)
2. Click "Create Stripe Account" button
3. System will create a Connect account and show the status

### Step 3: Complete Onboarding
1. Click "Complete Setup" to get onboarding link
2. Complete Stripe Connect onboarding process
3. Return to see updated account status

### Step 4: Test Commission Flow
1. Create a bid request with salesperson attribution (?ref=sales123)
2. Have contractor pay commission fee
3. Verify 50/50 split: 50% to salesperson, 50% to platform

## API Endpoints Available for Testing

- **GET** `/api/stripe-connect/accounts/status` - Check account status
- **POST** `/api/stripe-connect/accounts/create` - Create Connect account
- **POST** `/api/stripe-connect/accounts/onboarding` - Get onboarding link
- **GET** `/api/stripe-connect/accounts/dashboard` - Get Stripe dashboard link

## Webhook Testing

Your webhook endpoint is configured at:
`https://workspace.alexneilson02.repl.co/api/stripe-connect/webhook`

Webhook will process these events:
- `account.updated` - Updates account verification status
- `payment_intent.succeeded` - Logs commission payments
- `transfer.created` - Tracks payouts to salesperson

## Expected Results

✅ **Account Creation**: Creates Express Connect account
✅ **Onboarding**: Redirects to Stripe onboarding flow  
✅ **Status Updates**: Real-time webhook updates
✅ **Commission Split**: Automatic 50/50 payment distribution
✅ **Dashboard Access**: Direct link to Stripe dashboard for salesperson