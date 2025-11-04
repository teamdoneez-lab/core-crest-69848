# Phase 5 - Stripe Connect Referral Fee Payment & Refunds

## Overview
This phase integrates Stripe payment processing for referral fees when mechanics confirm appointments, and automatically processes refunds for legitimate cancellations. The system uses Stripe Checkout for payment collection and the Stripe Refunds API for automated refunds.

## Payment Flow

### 1. Customer Selects Quote
```
Customer reviews quotes → Selects preferred mechanic → Status: pending_confirmation
```

### 2. Mechanic Confirmation & Payment
When mechanic clicks "Confirm Appointment":

1. **Calculate Referral Fee** (Tiered Pricing from Phase 2):
   - Under $1,000: MAX($5, 5%)
   - $1,000-$4,999: 3%
   - $5,000-$9,999: 2%
   - $10,000+: 1%

2. **Create Stripe Checkout Session**:
   - Edge Function: `create-referral-checkout`
   - Mode: `payment` (one-time charge)
   - Metadata includes: quote_id, request_id, pro_id, fee_amount

3. **Redirect to Stripe Checkout**:
   - Mechanic completes payment securely on Stripe
   - Success URL: Returns to confirmation page
   - Cancel URL: Returns to pending confirmation state

4. **Payment Verification**:
   - Edge Function: `verify-referral-payment`
   - Verifies payment_status === 'paid'
   - Updates database records

### 3. Database Updates on Successful Payment

```sql
-- referral_fees table
UPDATE referral_fees SET
  status = 'paid',
  paid_at = NOW(),
  stripe_payment_intent = 'pi_xxx'
WHERE request_id = ?;

-- quotes table
UPDATE quotes SET
  status = 'confirmed'
WHERE id = ?;

-- service_requests table
UPDATE service_requests SET
  status = 'in_progress',
  accepted_pro_id = ?
WHERE id = ?;

-- appointments table
UPDATE appointments SET
  status = 'confirmed'
WHERE request_id = ?;
```

### 4. Payment Failure Handling

If payment fails or is cancelled:
- Status remains: `pending_confirmation`
- Timer continues counting down
- Mechanic can retry payment
- If timer expires: Status becomes `expired`

## Refund Flow

### Automatic Refund Triggers

Refunds are processed automatically for these cancellation reasons:

| Cancellation Reason | Refund? | Stripe API Called? | Account Flagged? |
|---------------------|---------|-------------------|------------------|
| `cancelled_by_customer` | ✅ Yes | ✅ Yes | ❌ No |
| `cancelled_after_requote` | ✅ Yes | ✅ Yes | ❌ No |
| `no_show` | ✅ Yes | ✅ Yes | ❌ No |
| `cancelled_off_platform` | ❌ No | ❌ No | ✅ Yes (both parties) |
| `completed` | ❌ No | ❌ No | ❌ No |

### Refund Process

1. **Cancellation Request**:
   - Customer/Admin initiates cancellation
   - Edge Function: `process-appointment-cancellation`

2. **Validation** (via DB function `cancel_appointment_with_validation`):
   - Verify user permissions
   - Check if revised quote was declined (Phase 4 rules)
   - Validate cancellation is allowed

3. **Database Status Update**:
   ```sql
   UPDATE referral_fees SET
     status = 'refunded',
     cancellation_reason = ?,
     updated_at = NOW()
   WHERE request_id = ? AND status = 'paid';
   
   UPDATE appointments SET
     status = ?
   WHERE id = ?;
   ```

4. **Stripe Refund Processing**:
   ```typescript
   const refund = await stripe.refunds.create({
     payment_intent: referralFee.stripe_payment_intent,
     reason: 'requested_by_customer',
     metadata: {
       appointment_id,
       request_id,
       cancellation_reason
     }
   });
   ```

5. **Record Refund ID**:
   ```sql
   UPDATE referral_fees SET
     stripe_refund_id = ?
   WHERE id = ?;
   ```

## Implementation Files

### Edge Functions

1. **`create-referral-checkout/index.ts`**
   - Creates Stripe Checkout session for referral fee payment
   - Calculates tiered fee amount
   - Stores session_id in database
   - Returns checkout URL to frontend

2. **`verify-referral-payment/index.ts`**
   - Verifies Stripe payment was successful
   - Updates all related database tables
   - Confirms appointment status

3. **`process-appointment-cancellation/index.ts`** ⭐ NEW
   - Validates cancellation request
   - Processes automatic Stripe refunds
   - Updates appointment and fee status
   - Handles error cases gracefully

4. **`refund-referral-fee/index.ts`**
   - Admin-triggered manual refund function
   - Used for edge cases or support requests
   - Requires admin authentication

### Frontend Components

1. **`QuoteConfirmation.tsx`**
   - Displays quote details to mechanic
   - Shows calculated referral fee
   - "Confirm & Pay Fee" button
   - Redirects to Stripe Checkout

2. **`AppointmentCancellation.tsx`**
   - Customer cancellation interface
   - Enforces Phase 4 anti-bypass rules
   - Calls `process-appointment-cancellation`
   - Shows refund confirmation message

### Database Schema

**`referral_fees` table:**
```sql
CREATE TABLE referral_fees (
  id uuid PRIMARY KEY,
  quote_id uuid REFERENCES quotes(id),
  pro_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES service_requests(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'owed',
  stripe_session_id text,
  stripe_payment_intent text,
  stripe_refund_id text,  -- NEW: Tracks refund transactions
  paid_at timestamptz,
  cancellation_reason text,
  refundable boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Complete Status Flow Diagram

```
Service Request Created
         ↓
    quote_requested
         ↓
Customer Selects Quote
         ↓
  pending_confirmation
  (Timer starts based on urgency)
         ↓
    ┌────┴────┐
    ↓         ↓
Mechanic   Timer
Confirms   Expires
& Pays        ↓
    ↓      expired
confirmed     ↓
    ↓      no_show
    ↓
┌───┴───┐
↓       ↓
Customer   Work
Cancels    Continues
(w/ revised    ↓
 quote)    completed
    ↓
cancelled_after_requote
    ↓
Refund Processed
```

## Payment & Refund States

### Referral Fee Status States:
- `owed`: Fee calculated, awaiting payment
- `paid`: Payment successful, appointment confirmed
- `refunded`: Payment returned to mechanic
- `failed`: Payment attempt failed

### Appointment Status States:
- `pending_inspection`: Awaiting initial vehicle inspection
- `confirmed`: Payment received, work can proceed
- `in_progress`: Service work ongoing
- `completed`: Job finished successfully
- `cancelled_by_customer`: Customer cancelled (inspection phase)
- `cancelled_after_requote`: Revised quote declined
- `cancelled_off_platform`: Off-platform bypass attempt
- `no_show`: Customer didn't show up

## Error Handling

### Payment Errors
```typescript
try {
  const session = await stripe.checkout.sessions.create({...});
} catch (error) {
  // Log error
  // Notify mechanic: "Payment processing unavailable, please try again"
  // Keep status as pending_confirmation
  // Allow retry
}
```

### Refund Errors
```typescript
try {
  const refund = await stripe.refunds.create({...});
} catch (stripeError) {
  // Log error for admin review
  // Database status still updated to 'refunded'
  // Admin can manually process refund in Stripe dashboard
  // Customer sees cancellation success
}
```

## Testing Scenarios

### Test Case 1: Successful Payment Flow
1. Customer selects quote → Status: `pending_confirmation`
2. Mechanic clicks "Confirm & Pay" → Redirects to Stripe
3. Mechanic completes payment → Payment verified
4. Status updates: Quote: `confirmed`, Appointment: `confirmed`, Fee: `paid`
5. **Expected:** ✅ All statuses correct, work can proceed

### Test Case 2: Payment Failure
1. Customer selects quote → Status: `pending_confirmation`
2. Mechanic clicks "Confirm & Pay" → Redirects to Stripe
3. Payment fails or cancelled
4. Returns to confirmation page → Status still `pending_confirmation`
5. **Expected:** ✅ Mechanic can retry, timer continues

### Test Case 3: Legitimate Cancellation with Refund
1. Job status: `confirmed`, Fee: `paid`
2. Mechanic inspects vehicle → Submits revised quote
3. Customer declines revised quote
4. Customer clicks "Cancel Appointment"
5. Cancellation processed → Stripe refund initiated
6. **Expected:** ✅ Refund processed, both parties notified

### Test Case 4: Invalid Cancellation Blocked
1. Job status: `confirmed`, Fee: `paid`
2. No revised quote submitted
3. Customer tries to cancel
4. **Expected:** ❌ Error: "Cancellations are only allowed if the mechanic has submitted a revised quote that you declined."

### Test Case 5: Off-Platform Cancellation
1. Job status: `confirmed`, Fee: `paid`
2. Admin detects off-platform arrangement
3. Admin marks as `cancelled_off_platform`
4. **Expected:** ✅ Both accounts flagged, NO refund processed, fee kept

## Monitoring & Admin Tools

### View Payment Status
```sql
SELECT 
  rf.id,
  rf.amount,
  rf.status,
  rf.stripe_payment_intent,
  rf.stripe_refund_id,
  rf.paid_at,
  rf.cancellation_reason,
  p.name as mechanic_name,
  sr.id as request_id
FROM referral_fees rf
JOIN profiles p ON rf.pro_id = p.id
JOIN service_requests sr ON rf.request_id = sr.id
WHERE rf.status = 'paid'
ORDER BY rf.paid_at DESC;
```

### View Refund History
```sql
SELECT 
  rf.id,
  rf.amount,
  rf.cancellation_reason,
  rf.stripe_refund_id,
  rf.updated_at as refunded_at,
  p.name as mechanic_name
FROM referral_fees rf
JOIN profiles p ON rf.pro_id = p.id
WHERE rf.status = 'refunded'
ORDER BY rf.updated_at DESC;
```

### Check Failed Refunds (Manual Review Needed)
```sql
SELECT 
  rf.id,
  rf.amount,
  rf.stripe_payment_intent,
  rf.cancellation_reason,
  p.name as mechanic_name,
  p.email as mechanic_email
FROM referral_fees rf
JOIN profiles p ON rf.pro_id = p.id
WHERE rf.status = 'refunded' 
  AND rf.stripe_refund_id IS NULL
ORDER BY rf.updated_at DESC;
```

## Security Considerations

1. **Payment Intent Validation**: Always verify payment_status before confirming appointments
2. **Refund Authorization**: Only authorized users/admins can trigger cancellations
3. **Idempotency**: Stripe operations use idempotency keys to prevent duplicate charges/refunds
4. **CORS Headers**: All edge functions include proper CORS for secure frontend communication
5. **Metadata Tracking**: All Stripe transactions include metadata for audit trails
6. **Error Logging**: All payment/refund errors logged for admin review

## Financial Reconciliation

### Daily Reconciliation
- Total fees collected: Sum of `status = 'paid'`
- Total refunds issued: Sum of `status = 'refunded'`
- Net revenue: Collected - Refunded

### Stripe Dashboard
- All transactions viewable in Stripe dashboard
- Filter by metadata: appointment_id, request_id
- Export reports for accounting

## Integration with Other Phases

- **Phase 1:** Basic booking workflow foundation
- **Phase 2:** Tiered fee calculation (used in payment amount)
- **Phase 3:** Timer expiry automation (payment deadline)
- **Phase 4:** Anti-bypass cancellation rules (refund eligibility)
- **Phase 5:** Payment & refund automation (this phase)

## Related Documentation
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Refunds API](https://stripe.com/docs/refunds)
- [Phase 2 - Tiered Pricing](./PHASE2_IMPLEMENTATION.md)
- [Phase 4 - Cancellation Rules](./PHASE4_IMPLEMENTATION.md)
