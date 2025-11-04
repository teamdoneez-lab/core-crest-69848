# Phase 4 - Anti-Bypass Cancellation Rules

## Overview
This phase implements strict cancellation rules to prevent off-platform job completion and ensure platform integrity. The system enforces that customers cannot cancel confirmed appointments unless they have legitimately declined a revised quote from the mechanic.

## Cancellation Rules

### Customer Cancellation Rules
1. **During `pending_inspection` status:**
   - ✅ Customer CAN cancel freely
   - ✅ Referral fee is refunded to the mechanic

2. **During `confirmed` status:**
   - ❌ Customer CANNOT cancel UNLESS:
     - Mechanic submitted a revised quote AND
     - Customer declined that revised quote
   - ✅ If above conditions met: Referral fee is refunded

3. **Error Message:**
   ```
   "Cancellations are only allowed if the mechanic has submitted a revised quote that you declined."
   ```

### Professional (Mechanic) Cancellation Rules
1. **During `confirmed` status:**
   - ❌ Pro CANNOT cancel directly
   - ✅ Pro MUST submit a revised quote if work scope changes
   - ✅ If customer declines revised quote, job can be cancelled

### Off-Platform Cancellation Detection
If the system detects an attempt to bypass these rules:
1. Appointment marked as `cancelled_off_platform`
2. Referral fee is KEPT (not refunded)
3. Both customer AND mechanic accounts are flagged with:
   - `violation_flags` incremented by 1
   - `last_violation_at` timestamp updated

## Implementation Details

### Database Function: `cancel_appointment_with_validation`

```sql
CREATE OR REPLACE FUNCTION public.cancel_appointment_with_validation(
  appointment_id_input uuid, 
  cancellation_reason_input text
)
RETURNS json
```

#### Anti-Bypass Logic Flow:
1. **Verify User Identity:**
   - Check if caller is customer or pro
   - Verify they have rights to this appointment

2. **Check Revised Quote Status:**
   ```sql
   SELECT EXISTS(
     SELECT 1 FROM public.quotes 
     WHERE request_id = appointment_record.request_id 
       AND is_revised = true
       AND status = 'declined'
   ) INTO revised_quote_declined;
   ```

3. **Enforce Confirmed Status Rules:**
   - If `status = 'confirmed'`:
     - Customer can only cancel if `revised_quote_declined = true`
     - Pro cannot cancel (must use revised quote flow)
     - Otherwise: Return error, block cancellation

4. **Handle Refunds:**
   - `cancelled_after_requote`: Refund mechanic's fee
   - `no_show`: Refund mechanic's fee
   - `cancelled_off_platform`: NO refund, flag accounts

### Frontend Component: `AppointmentCancellation.tsx`

#### UI Logic:
```typescript
// Only allow cancellation during inspection or after declining revised quote
const canCancel = status === "pending_inspection" || 
                  (status === "confirmed" && hasRevisedQuote);
```

#### User Experience:
1. **Can Cancel:**
   - Shows "Cancel Appointment" button
   - Displays confirmation dialog explaining consequences

2. **Cannot Cancel:**
   - Shows warning Alert with error message
   - No cancel button available
   - Explains that revised quote must be declined first

## Cancellation Reasons

| Reason | Refund? | Flags Accounts? | Description |
|--------|---------|-----------------|-------------|
| `cancelled_by_customer` | ✅ Yes | ❌ No | Legitimate customer cancellation during inspection |
| `cancelled_after_requote` | ✅ Yes | ❌ No | Customer declined revised quote |
| `no_show` | ✅ Yes | ❌ No | Customer didn't show up for appointment |
| `cancelled_off_platform` | ❌ No | ✅ Yes | Attempt to bypass platform rules |

## Data Flow

```
Customer Tries to Cancel Confirmed Job
           ↓
    Check Status & Revised Quote
           ↓
    ┌──────┴──────┐
    ↓             ↓
Revised Quote   No Revised Quote
 Declined          ↓
    ↓         Return Error
Refund Fee    "Must decline revised quote"
Cancel Job         ↓
    ↓         Cancellation Blocked
  Success
```

## Revised Quote Flow

```
Job Confirmed
     ↓
Mechanic Inspects Vehicle
     ↓
Work Scope Changes
     ↓
Mechanic Submits Revised Quote
     ↓
Customer Reviews
     ↓
  ┌──┴──┐
  ↓     ↓
Accept  Decline
  ↓     ↓
New   Cancel Job
Price  Refund Fee
Job    Customer Can
Continues  Request New Service
```

## Testing Scenarios

### Test Case 1: Valid Cancellation (Revised Quote Declined)
1. Job status: `confirmed`
2. Mechanic submits revised quote
3. Customer declines revised quote
4. Customer clicks "Cancel Appointment"
5. **Expected:** ✅ Cancellation succeeds, fee refunded

### Test Case 2: Invalid Cancellation (No Revised Quote)
1. Job status: `confirmed`
2. No revised quote submitted
3. Customer tries to cancel
4. **Expected:** ❌ Error message shown, cancellation blocked

### Test Case 3: Valid Cancellation (Inspection Phase)
1. Job status: `pending_inspection`
2. Customer clicks "Cancel Appointment"
3. **Expected:** ✅ Cancellation succeeds, fee refunded

### Test Case 4: Off-Platform Cancellation Detection
1. Job status: `confirmed`
2. Admin marks as `cancelled_off_platform`
3. **Expected:** ✅ Both accounts flagged, fee kept

## Monitoring & Admin Tools

Admins can monitor violations via:
```sql
SELECT 
  p.name,
  p.email,
  p.violation_flags,
  p.last_violation_at
FROM profiles p
WHERE violation_flags > 0
ORDER BY last_violation_at DESC;
```

## Security Considerations

1. **Function is SECURITY DEFINER:** Runs with elevated privileges to update fees and profiles
2. **User Authentication:** Uses `auth.uid()` to verify caller identity
3. **Status Validation:** Checks appointment status before allowing cancellation
4. **Referral Fee Protection:** Prevents unauthorized refunds
5. **Account Flagging:** Automatic detection of policy violations

## Related Files
- `supabase/migrations/20251104214440_c7bdb08d-d904-48cc-879e-e0cb4e342fa0.sql` - Database function
- `src/components/customer/AppointmentCancellation.tsx` - Customer UI
- `src/components/pro/RevisedQuoteForm.tsx` - Pro revised quote submission

## Integration with Other Phases
- **Phase 1:** Uses quote selection and appointment confirmation flow
- **Phase 2:** Protects tiered referral fee revenue
- **Phase 3:** Works with timer expiry system for quote confirmations
