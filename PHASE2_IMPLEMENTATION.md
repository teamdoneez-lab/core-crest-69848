# Phase 2 - Referral Fee Calculation Implementation

## Overview
Implemented tiered referral fee calculation based on job total to provide fair pricing for both professionals and the platform.

## Referral Fee Tiers

### Tier Structure

| Job Total Range | Fee Rate | Minimum Fee |
|----------------|----------|-------------|
| Under $1,000 | 5% | $5.00 |
| $1,000 - $4,999 | 3% | N/A |
| $5,000 - $9,999 | 2% | N/A |
| $10,000+ | 1% | N/A |

### Calculation Logic

```javascript
function calculateReferralFee(jobTotal) {
  if (jobTotal < 1000) {
    return Math.max(5, jobTotal * 0.05);
  }
  if (jobTotal < 5000) {
    return jobTotal * 0.03;
  }
  if (jobTotal < 10000) {
    return jobTotal * 0.02;
  }
  return jobTotal * 0.01;
}
```

### Examples

| Quote Amount | Calculation | Referral Fee | Effective Rate |
|-------------|-------------|--------------|----------------|
| $50 | max($5, $2.50) | $5.00 | 10% |
| $200 | max($5, $10) | $10.00 | 5% |
| $500 | max($5, $25) | $25.00 | 5% |
| $1,500 | $1,500 × 3% | $45.00 | 3% |
| $3,000 | $3,000 × 3% | $90.00 | 3% |
| $7,500 | $7,500 × 2% | $150.00 | 2% |
| $15,000 | $15,000 × 1% | $150.00 | 1% |

## Implementation Details

### 1. Database Function Update

**Function:** `accept_quote_with_timer(quote_id_input uuid)`

**Location:** Database function in Supabase

**Changes:**
- Added `calculated_fee NUMERIC` variable
- Implemented tiered calculation logic
- Applied minimum $5 fee for jobs under $1,000
- Rounds result to 2 decimal places
- Returns calculated fee in result JSON

**SQL Implementation:**
```sql
-- Calculate tiered referral fee
IF quote_record.estimated_price < 1000 THEN
  calculated_fee := GREATEST(5.00, quote_record.estimated_price * 0.05);
ELSIF quote_record.estimated_price < 5000 THEN
  calculated_fee := quote_record.estimated_price * 0.03;
ELSIF quote_record.estimated_price < 10000 THEN
  calculated_fee := quote_record.estimated_price * 0.02;
ELSE
  calculated_fee := quote_record.estimated_price * 0.01;
END IF;

-- Round to 2 decimal places
calculated_fee := ROUND(calculated_fee, 2);
```

**Updates:**
- Creates/updates `referral_fees` record with calculated amount
- Sets `status = 'owed'` for pending payment
- Returns fee amount in response JSON

### 2. Edge Function Update

**Function:** `create-referral-checkout`

**Location:** `supabase/functions/create-referral-checkout/index.ts`

**Changes:**
- Added tiered fee calculation when creating new referral fee records
- Implemented JavaScript version of calculation logic
- Added detailed logging for fee calculation
- Uses calculated fee for Stripe checkout session

**Implementation:**
```typescript
// Calculate tiered referral fee
let calculatedFee;
const estimatedPrice = quote.estimated_price;

if (estimatedPrice < 1000) {
  calculatedFee = Math.max(5.00, estimatedPrice * 0.05);
} else if (estimatedPrice < 5000) {
  calculatedFee = estimatedPrice * 0.03;
} else if (estimatedPrice < 10000) {
  calculatedFee = estimatedPrice * 0.02;
} else {
  calculatedFee = estimatedPrice * 0.01;
}

// Round to 2 decimal places
calculatedFee = Math.round(calculatedFee * 100) / 100;
```

**Stripe Integration:**
- Uses `calculatedFee` for Stripe checkout line item
- Stores fee amount in Stripe session metadata
- Maintains accurate fee tracking

### 3. Frontend Component Update

**Component:** `QuoteConfirmation`

**Location:** `src/components/pro/QuoteConfirmation.tsx`

**Changes:**
- Added `getReferralFeeDisplay()` helper function
- Displays both fee amount and percentage rate
- Shows tiered pricing to professionals before payment

**Implementation:**
```typescript
const getReferralFeeDisplay = (jobTotal: number) => {
  let fee;
  let rate;
  
  if (jobTotal < 1000) {
    fee = Math.max(5.00, jobTotal * 0.05);
    rate = "5%";
  } else if (jobTotal < 5000) {
    fee = jobTotal * 0.03;
    rate = "3%";
  } else if (jobTotal < 10000) {
    fee = jobTotal * 0.02;
    rate = "2%";
  } else {
    fee = jobTotal * 0.01;
    rate = "1%";
  }
  
  return `$${fee.toFixed(2)} (${rate})`;
};
```

**UI Updates:**
- Quote confirmation dialog shows: "Referral fee: $25.00 (5%)"
- Timer countdown display includes calculated fee
- Alert dialog description updated with fee details

## Data Flow

### 1. Customer Selects Quote

```
Customer clicks "Select This Quote"
  ↓
Frontend calls accept_quote_with_timer(quote_id)
  ↓
Database function:
  - Retrieves quote amount
  - Calculates tiered fee
  - Creates/updates referral_fees record
  - Returns fee amount
  ↓
Quote status → "pending_confirmation"
Timer starts
```

### 2. Professional Confirms

```
Pro sees quote selected notification
Pro views: "$25.00 (5%) referral fee"
  ↓
Pro clicks "Confirm & Pay Fee"
  ↓
Frontend calls create-referral-checkout
  ↓
Edge function:
  - Retrieves or creates referral fee record
  - Uses tiered calculation if creating
  - Creates Stripe checkout session
  - Line item amount = calculated fee
  ↓
Pro redirected to Stripe payment
  ↓
Payment completed → Fee marked "paid"
```

### 3. Payment Verification

```
Stripe payment completes
  ↓
Frontend calls verify-referral-payment
  ↓
Edge function:
  - Verifies payment with Stripe
  - Updates referral_fees.status = "paid"
  - Updates quote.status = "confirmed"
  - Updates appointment.status = "confirmed"
  - Grants pro access to customer contact info
```

## Benefits of Tiered Pricing

### For Professionals
1. **Lower fees on large jobs**: 1-2% on jobs over $5k
2. **Fair small job pricing**: Minimum $5 ensures viability
3. **Transparent rates**: Clear fee structure shown upfront
4. **Predictable costs**: Know exact fee before accepting

### For Platform
1. **Competitive pricing**: More attractive to professionals
2. **Volume incentive**: Encourages larger projects
3. **Fair baseline**: Minimum fee maintains sustainability
4. **Market alignment**: Industry-standard tier structure

### For Customers
1. **Better pro participation**: Lower fees = more pros join
2. **Quality professionals**: Fair pricing attracts skilled pros
3. **Indirect savings**: Competition among pros benefits customers
4. **No direct impact**: Customers don't pay referral fees

## Fee Calculation Test Cases

### Edge Cases

**Case 1: Very Small Job**
- Quote: $20
- Calculation: max($5, $1) = $5.00
- Result: $5.00 (25% effective rate)
- Ensures platform sustainability

**Case 2: Minimum Threshold**
- Quote: $100
- Calculation: max($5, $5) = $5.00
- Result: $5.00 (5% rate)
- Exactly at threshold

**Case 3: Just Under Tier Change**
- Quote: $999
- Calculation: max($5, $49.95) = $49.95
- Result: $49.95 (5% rate)
- Stays in tier 1

**Case 4: Tier Boundary**
- Quote: $1,000
- Calculation: $1,000 × 3% = $30.00
- Result: $30.00 (3% rate)
- Drops to tier 2

**Case 5: Mid-Range Job**
- Quote: $2,500
- Calculation: $2,500 × 3% = $75.00
- Result: $75.00 (3% rate)
- Standard tier 2

**Case 6: Large Job**
- Quote: $8,000
- Calculation: $8,000 × 2% = $160.00
- Result: $160.00 (2% rate)
- Tier 3 pricing

**Case 7: Premium Job**
- Quote: $20,000
- Calculation: $20,000 × 1% = $200.00
- Result: $200.00 (1% rate)
- Best rate for large projects

## Database Schema

### referral_fees Table

**Key Fields:**
- `amount` (numeric): Calculated referral fee
- `status` (text): Payment status
  - `owed`: Pending payment
  - `paid`: Payment completed
  - `refunded`: Fee refunded to pro
  - `declined`: Quote declined
  - `expired`: Timer expired

**Status Transitions:**
```
owed → paid (payment completed)
owed → declined (pro declined quote)
owed → expired (timer ran out)
paid → refunded (job cancelled)
```

## Logging & Debugging

### Database Function Logs
- Quote amount retrieved
- Tier determined
- Fee calculated
- Record created/updated
- Fee amount in return JSON

### Edge Function Logs
```
[REFERRAL-CHECKOUT] Processing quote: <quote_id>
[REFERRAL-CHECKOUT] No fee found, calculating tiered fee...
[REFERRAL-CHECKOUT] Calculated fee: $25.00 for job total: $500
[REFERRAL-CHECKOUT] Fee amount: 25.00
```

### Frontend Console Logs
- Quote confirmation initiated
- Fee calculation displayed
- Checkout session created
- Payment window opened

## Monitoring Metrics

### Key Metrics to Track

1. **Average Fee by Tier**
   - Under $1k jobs: Avg fee amount
   - $1k-$5k jobs: Avg fee amount
   - $5k-$10k jobs: Avg fee amount
   - $10k+ jobs: Avg fee amount

2. **Fee Distribution**
   - % of jobs in each tier
   - Revenue per tier
   - Most common tier

3. **Minimum Fee Impact**
   - # of jobs hitting $5 minimum
   - Avg quote amount for minimum fee jobs
   - Effective rate for small jobs

4. **Professional Response**
   - Acceptance rate by tier
   - Decline rate by tier
   - Time to confirm by tier

## Future Enhancements

### Potential Improvements

1. **Dynamic Tiers**
   - Adjust rates based on market conditions
   - Region-specific pricing
   - Service category variations

2. **Volume Discounts**
   - Loyalty program for frequent pros
   - Bulk job discounts
   - Annual subscription options

3. **Promotional Pricing**
   - Temporary rate reductions
   - New professional incentives
   - Peak/off-peak pricing

4. **Custom Negotiations**
   - Platform-approved custom rates
   - Partnership programs
   - Enterprise pricing

## Testing Checklist

### Calculation Testing
- [ ] Jobs under $100 get $5 minimum
- [ ] Jobs $100-$999 get 5% rate
- [ ] Jobs $1,000-$4,999 get 3% rate
- [ ] Jobs $5,000-$9,999 get 2% rate
- [ ] Jobs $10,000+ get 1% rate
- [ ] Tier boundaries work correctly
- [ ] Decimal precision maintained

### Integration Testing
- [ ] Fee calculated on quote selection
- [ ] Fee stored in database correctly
- [ ] Stripe checkout uses correct amount
- [ ] Payment verification updates status
- [ ] UI displays correct fee and rate
- [ ] Email notifications show correct fee

### Edge Case Testing
- [ ] $0 quote handling (should error)
- [ ] Very large quotes ($100k+)
- [ ] Decimal quote amounts
- [ ] Recalculation on quote change
- [ ] Multiple fee records prevented

## Troubleshooting

### Common Issues

**Issue 1: Wrong fee calculated**
- Check quote amount in database
- Verify tier boundaries in code
- Review rounding logic
- Check for decimal precision issues

**Issue 2: Minimum fee not applied**
- Verify GREATEST() function in SQL
- Check Math.max() in JavaScript
- Ensure $5 constant is correct

**Issue 3: Stripe amount mismatch**
- Compare referral_fees.amount to Stripe line item
- Check currency conversion (cents vs dollars)
- Verify Stripe session metadata

**Issue 4: Fee not updating on recalculation**
- Check if UPDATE query executed
- Verify WHERE clause conditions
- Review transaction isolation

## Documentation Links

### Internal Documentation
- Phase 1 Implementation: `PHASE1_IMPLEMENTATION.md`
- Database Schema: See `<supabase-tables>` section
- Edge Functions: `supabase/functions/` directory

### External Resources
- Stripe Checkout: https://stripe.com/docs/payments/checkout
- Supabase Functions: https://supabase.com/docs/guides/functions
- PostgreSQL GREATEST: https://www.postgresql.org/docs/current/functions-conditional.html

---

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Implemented & Active  
**Related:** PHASE1_IMPLEMENTATION.md
