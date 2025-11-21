# Phase 1 - Core Booking Workflow Implementation

## Overview

This document describes the implemented Phase 1 booking workflow for the DoneEZ service marketplace platform.

## Entities

### 1. Customer

- Uses the platform to request automotive services
- Can view quotes and select preferred professional
- Simplified status view in UI

### 2. Mechanic (Professional/Pro)

- Receives service request leads
- Submits quotes for jobs
- Must confirm and pay referral fee to secure jobs
- Sees detailed fee status

### 3. ServiceRequest

Database table: `service_requests`

### 4. Quote

Database table: `quotes`

### 5. Appointment

Database table: `appointments`

### 6. ReferralFee

Database table: `referral_fees`

## Data Models

### ServiceRequest

**Fields:**

- `id` (UUID) - Primary key
- `customer_id` (UUID) - References auth user
- `vehicle_info` - Make, model, year, trim, mileage
- `description` - Service details
- `urgency` - Timeline preference
- `status` - Current state
- `created_at`, `updated_at` - Timestamps

**Status Values:**

- `quote_requested` - Initial state when customer submits request
- `pending_confirmation` - Customer selected a quote, waiting for pro confirmation
- `confirmed` - Pro confirmed and paid referral fee
- `declined` - Pro declined the selected quote
- `expired` - Confirmation timer expired
- `cancelled_by_customer` - Customer cancelled before work started
- `cancelled_after_requote` - Customer declined revised quote
- `cancelled_off_platform` - Job completed outside platform
- `no_show` - Customer no-show
- `completed` - Job successfully completed

### Quote

**Fields:**

- `id` (UUID) - Primary key
- `mechanic_id` (UUID) - Professional who submitted quote
- `service_request_id` (UUID) - Related service request
- `quote_amount` (numeric) - Estimated price
- `notes` - Additional details
- `status` - Current state
- `confirmation_timer_expires_at` - Deadline for pro confirmation
- `confirmation_timer_minutes` - Duration based on urgency
- `created_at`, `updated_at` - Timestamps

**Status Values:**

- `pending` - Submitted by pro, awaiting customer selection
- `pending_confirmation` - Selected by customer, awaiting pro confirmation
- `confirmed` - Pro confirmed and paid
- `declined` - Declined by pro or not selected
- `expired` - Confirmation timer ran out

### Appointment

**Fields:**

- `id` (UUID) - Primary key
- `quote_id` (UUID) - Related quote
- `mechanic_id` (UUID) - Assigned professional
- `customer_id` (UUID) - Customer
- `appointment_date` - Scheduled time
- `referral_fee` (numeric) - Fee amount (10% of quote)
- `referral_fee_status` - Payment status
- `status` - Mirrors ServiceRequest status
- `created_at`, `updated_at` - Timestamps

**Status Values:**
Same as ServiceRequest statuses

## Flow Logic

### 1. Customer Submits Service Request

```
Customer fills form → ServiceRequest created
Initial status: "quote_requested"
System generates leads for eligible mechanics in area
```

**Implementation:**

- Sets `status: 'quote_requested'` on insert
- Database function `handle_new_service_request` trigger creates leads

### 2. Request Becomes Visible to Eligible Mechanics

```
Mechanics receive lead notifications
Can view: vehicle info, location (zip only), urgency, service type
Cannot see: customer contact info, full address
```

**Implementation:**

- File: `src/pages/ProDashboard.tsx`
- Leads tab shows new requests
- RLS policies restrict sensitive data

### 3. Mechanics Submit Quotes

```
Mechanic reviews request → Submits quote
Quote status: "pending"
Customer receives email notification
```

**Implementation:**

- File: `src/components/pro/QuoteForm.tsx`
- Creates quote with `status: 'pending'`
- Edge function `send-quote-email` notifies customer

### 4. Customer Selects One Quote

```
Customer reviews quotes → Selects preferred pro
Selected quote status: "pending_confirmation"
Other quotes status: "declined"
ServiceRequest status: "pending_confirmation"
Confirmation timer starts (based on urgency):
  - Immediate: 15 minutes
  - 1-2 days: 30 minutes
  - 1 week: 60 minutes
  - 1 month: 120 minutes
ReferralFee record created (amount = 10% of quote)
```

**Implementation:**

- File: `src/components/customer/QuotesList.tsx`
- Calls database function `accept_quote_with_timer`
- Function updates statuses and creates referral fee record

### 5. Mechanic is Notified and Must Confirm

```
Mechanic receives notification
Sees timer countdown
Options: Confirm & Pay Fee OR Decline
If timer expires:
  - Quote status: "expired"
  - ServiceRequest status: "expired"
  - Customer must select another quote
```

**Implementation:**

- File: `src/components/pro/QuoteConfirmation.tsx`
- Shows timer and action buttons
- Database function `expire_timed_out_quotes` handles expirations

### 6. Mechanic Confirms and Pays Referral Fee

```
Mechanic clicks "Confirm & Pay Fee"
Redirected to Stripe checkout
Payment completed →
  - Quote status: "confirmed"
  - ServiceRequest status: "in_progress"
  - ReferralFee status: "paid"
  - Appointment record created with status: "confirmed"
  - Mechanic gains access to customer contact info
```

**Implementation:**

- Files:
  - `src/components/pro/QuoteConfirmation.tsx` - Initiates payment
  - Edge function `create-referral-checkout` - Creates Stripe session
  - Edge function `verify-referral-payment` - Processes payment callback
- Payment flow:
  1. Create Stripe checkout session
  2. Customer pays via Stripe
  3. Webhook verifies payment
  4. Updates all related records

### 7. Alternative Flows

#### Mechanic Declines

```
Mechanic clicks "Decline"
Quote status: "declined"
ReferralFee status: "declined"
Customer notified to select another quote
```

#### Quote Expires

```
Timer reaches zero
Quote status: "expired"
ReferralFee status: "expired"
Customer must select another quote
```

## UI/UX Behavior

### Customer View

**Simplified Status Display:**

- "Awaiting Quotes" - `quote_requested`
- "Pending Confirmation" - `pending_confirmation`
- "Confirmed" - `confirmed`
- "Expired - Choose Another" - `expired`
- "Cancelled" - Any cancellation status

**Customer Can See:**

- All received quotes with pro details
- Business name, verification badge
- Service categories offered
- Pro description/bio
- Quote amount and details
- Status of each quote

**Customer Cannot See:**

- Referral fee details
- Payment processing details
- Pro's financial information

**Implementation:**

- File: `src/pages/MyRequests.tsx`
- File: `src/components/customer/QuotesList.tsx`

### Mechanic View

**Detailed Status Display:**

- All standard statuses shown
- Referral fee status visible
- Payment status tracked

**Mechanic Can See:**

- Lead details (limited info initially)
- Quote confirmation requirements
- Referral fee amount (10% of quote)
- Payment deadline/timer
- Full customer contact info (after payment)

**Mechanic Cannot See:**

- Customer contact info before payment
- Other mechanics' quotes

**Implementation:**

- File: `src/pages/ProDashboard.tsx`
- File: `src/components/pro/QuoteConfirmation.tsx`

### Violation Warnings

**Off-Platform Cancellation:**

- If job cancelled as `cancelled_off_platform`
- Both customer and mechanic profiles flagged
- Warning displayed in UI
- Referral fee NOT refunded

**Implementation:**

- Database function `cancel_appointment_with_validation`
- Tracks `violation_flags` in profiles table

## Status Transition Rules

### Valid Transitions

**From `quote_requested`:**

- → `pending_confirmation` (customer selects quote)
- → `cancelled_by_customer` (customer cancels)

**From `pending_confirmation`:**

- → `confirmed` (pro pays referral fee)
- → `declined` (pro declines)
- → `expired` (timer expires)
- → `cancelled_by_customer` (customer cancels)

**From `confirmed`:**

- → `in_progress` (after payment verified)
- → `completed` (job finished)
- → `cancelled_after_requote` (customer declines revised quote)
- → `cancelled_off_platform` (done outside platform)
- → `no_show` (customer doesn't show)

**From `expired`:**

- → `pending_confirmation` (customer selects different quote)

## Key Database Functions

### 1. `accept_quote_with_timer(quote_id)`

- Updates selected quote to `pending_confirmation`
- Declines other quotes
- Creates referral fee record
- Sets confirmation timer based on urgency
- Returns timer expiration time

### 2. `expire_timed_out_quotes()`

- Runs periodically to check for expired timers
- Updates quotes past deadline to `expired`
- Updates referral fees to `expired`

### 3. `cancel_appointment_with_validation(appointment_id, cancellation_reason)`

- Validates cancellation reason
- Prevents customer cancellations without valid reason
- Handles refund logic based on reason
- Flags accounts for off-platform violations

### 4. `handle_new_service_request()`

- Trigger on new service request
- Generates leads for matching pros
- Based on service area and categories

## Edge Functions

### 1. `create-referral-checkout`

**Purpose:** Create Stripe checkout session for referral fee payment

**Input:**

```json
{
  "quote_id": "uuid"
}
```

**Output:**

```json
{
  "url": "stripe_checkout_url",
  "session_id": "stripe_session_id"
}
```

### 2. `verify-referral-payment`

**Purpose:** Verify Stripe payment and update records

**Input:**

```json
{
  "session_id": "stripe_session_id",
  "request_id": "uuid"
}
```

**Output:**

```json
{
  "success": true,
  "paid": true
}
```

**Actions:**

- Updates referral fee status to `paid`
- Updates quote status to `confirmed`
- Updates service request status to `in_progress`
- Updates appointment status to `confirmed`
- Sets `accepted_pro_id` on service request

### 3. `send-quote-email`

**Purpose:** Notify customer when quote received

**Input:**

```json
{
  "quoteId": "uuid"
}
```

## Security & RLS Policies

### Service Requests

- Customers can view only their own requests
- Pros can view requests in their service area + categories
- Full customer contact info only visible after pro pays fee

### Quotes

- Customers can view quotes for their requests
- Pros can view only their own quotes
- Customers can update status to `accepted`
- Pros can update status to `declined`

### Appointments

- Customers can view appointments for their requests
- Pros can view only their own appointments
- Pros can create appointments for accepted requests

### Referral Fees

- Pros can view their own fees
- Customers can view fees for their requests
- Only admins can update fee status manually

## Payment Flow Details

### Referral Fee Calculation

```
Referral Fee = Quote Amount × 10%
```

### Payment Process

1. Pro clicks "Confirm & Pay Fee"
2. System creates Stripe checkout session
3. Session metadata includes:
   - `quote_id`
   - `request_id`
   - `pro_id`
   - `fee_amount`
4. Pro completes payment on Stripe
5. Stripe redirects back with session_id
6. Frontend calls `verify-referral-payment`
7. System verifies payment with Stripe API
8. Updates all records atomically

### Refund Logic

**Full Refund Scenarios:**

- `cancelled_by_customer` (before work starts)
- `cancelled_after_requote` (declined revised quote)
- `no_show` (customer doesn't show)

**No Refund Scenarios:**

- `cancelled_off_platform` (completed outside platform)
- `completed` (job successfully finished)

**Implementation:**

- Function `cancel_appointment_with_validation` handles refund logic
- Edge function `refund-referral-fee` processes Stripe refunds

## Confirmation Timer Logic

### Timer Duration by Urgency

```javascript
function getConfirmationTimer(urgency) {
  switch (urgency) {
    case 'immediate': return 15; // minutes
    case '1-2 days': return 30;
    case '1 week': return 60;
    case '1 month': return 120;
    default: return 60; // 1 hour default
  }
}
```

### Timer Display

- Shows remaining time in format: "Xh Xm" or "X minutes"
- Updates in real-time
- Warning when < 5 minutes remaining
- Auto-expires when timer reaches zero

**Implementation:**

- File: `src/components/pro/QuoteConfirmation.tsx`
- Function `getTimeRemaining()` calculates remaining time
- useEffect hook monitors expiration

## Testing Checklist

### Customer Flow

- [ ] Submit service request → status = `quote_requested`
- [ ] Receive multiple quotes
- [ ] Select preferred quote
- [ ] See "Pending Confirmation" status
- [ ] Pro confirms → status = `confirmed`
- [ ] View appointment details
- [ ] Complete job → status = `completed`

### Mechanic Flow

- [ ] Receive lead notification
- [ ] Submit quote → status = `pending`
- [ ] Customer selects quote
- [ ] See confirmation timer
- [ ] Confirm and pay fee
- [ ] Gain access to customer contact
- [ ] Complete appointment

### Edge Cases

- [ ] Timer expires → quote becomes `expired`
- [ ] Pro declines → customer can select another
- [ ] Customer cancels before confirmation
- [ ] Customer cancels after confirmation (with revised quote)
- [ ] Off-platform cancellation flags accounts

## Next Steps (Future Phases)

### Phase 2 - Enhanced Features

- Review and rating system
- Multi-image upload
- Real-time chat
- Push notifications
- Calendar integration

### Phase 3 - Advanced Workflows

- Recurring maintenance schedules
- Fleet management
- Multi-vehicle quotes
- Parts ordering integration
- Insurance claim support

## File Structure

```
src/
├── pages/
│   ├── RequestService.tsx          # Customer creates request
│   ├── MyRequests.tsx               # Customer views requests
│   ├── ProDashboard.tsx            # Pro views leads/jobs
│   └── Appointments.tsx            # Both view appointments
├── components/
│   ├── customer/
│   │   ├── QuotesList.tsx          # Customer sees quotes
│   │   └── AppointmentCancellation.tsx  # Cancel logic
│   └── pro/
│       ├── QuoteForm.tsx           # Pro submits quote
│       ├── QuoteConfirmation.tsx   # Pro confirms job
│       └── EarningsTab.tsx         # Pro views earnings
└── supabase/
    └── functions/
        ├── create-referral-checkout/    # Payment session
        ├── verify-referral-payment/     # Payment verification
        ├── send-quote-email/            # Email notifications
        └── refund-referral-fee/         # Process refunds
```

## Database Schema Summary

```sql
-- Core tables
service_requests (
  id, customer_id, vehicle_info,
  status, urgency, created_at, ...
)

quotes (
  id, request_id, pro_id,
  estimated_price, status,
  confirmation_timer_expires_at, ...
)

appointments (
  id, request_id, pro_id,
  starts_at, status, ...
)

referral_fees (
  id, quote_id, pro_id, request_id,
  amount, status, paid_at, ...
)

-- Supporting tables
leads (id, request_id, pro_id, status)
pro_profiles (pro_id, business_name, is_verified, ...)
profiles (id, role, violation_flags, ...)
```

## Monitoring & Alerts

### Key Metrics to Track

1. Average time from request to first quote
2. Quote acceptance rate
3. Pro confirmation rate (vs. declines/expires)
4. Cancellation rate by type
5. Referral fee collection rate
6. Violation flag frequency

### Automated Jobs

1. Expire timed-out quotes (every 1 minute)
2. Send reminder emails (5 min before expiry)
3. Release expired job locks
4. Calculate pro earnings
5. Generate platform reports

## Support & Troubleshooting

### Common Issues

**Pro can't see customer contact info:**

- Verify referral fee status is `paid`
- Check appointment status is `confirmed`
- Verify RLS policies allow access

**Quote expired before pro could confirm:**

- Review timer settings by urgency
- Consider extending timers
- Check notification delivery

**Payment failed but quote marked confirmed:**

- Review Stripe webhook logs
- Check `verify-referral-payment` function logs
- Manual reconciliation may be needed

**Customer cancelled but fee not refunded:**

- Verify cancellation reason
- Check refund eligibility rules
- Process manual refund if warranted

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
**Status:** Implemented & Active
