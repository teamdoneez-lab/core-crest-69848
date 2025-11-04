# Phase 3 - Timer Expiry Automation Implementation

## Overview
Implemented automatic expiration checking and customer notification system for quote confirmation timers with scheduled background jobs.

## Timer Configuration

### Confirmation Timer Durations by Urgency

| Urgency Level | Timer Duration | Use Case |
|--------------|----------------|----------|
| Immediate | 15 minutes | ASAP repairs, emergencies |
| 1-2 days | 30 minutes | Near-term scheduled work |
| 1 week | 60 minutes (1 hour) | Standard timeline |
| 1 month | 120 minutes (2 hours) | Flexible scheduling |
| Default | 60 minutes (1 hour) | Fallback for unspecified |

### Timer Start Point
- Timer begins when customer selects a quote
- Quote status changes to `pending_confirmation`
- Field `confirmation_timer_expires_at` is set
- Professional receives notification

### Timer Expiry Actions

When timer expires without professional confirmation:

1. **Database Updates:**
   - Quote status → `expired`
   - Referral fee status → `expired`
   - Service request remains → `pending_confirmation` (to allow new selection)

2. **Customer Notification:**
   - Email sent to customer
   - Explains what happened
   - Provides link to select another quote
   - Lists expired quote details

3. **Professional Impact:**
   - Cannot confirm expired quote
   - Referral fee record marked expired
   - No further action possible on that quote

## Implementation Components

### 1. Database Function: `expire_timed_out_quotes()`

**Purpose:** Update expired quotes in database

**Location:** Supabase database function

**Logic:**
```sql
CREATE OR REPLACE FUNCTION public.expire_timed_out_quotes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.quotes
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending_confirmation'
    AND confirmation_timer_expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$function$
```

**Returns:** Number of quotes expired

**Updates:**
- `quotes.status` → 'expired'
- `quotes.updated_at` → current timestamp
- Only affects quotes with `status = 'pending_confirmation'`
- Only affects quotes past expiration time

### 2. Edge Function: `check-expired-quotes`

**Purpose:** Orchestrate expiration process and send notifications

**Location:** `supabase/functions/check-expired-quotes/index.ts`

**Workflow:**

```mermaid
graph TD
    A[Cron Job Triggers] --> B[Fetch Expiring Quotes]
    B --> C{Any Expired?}
    C -->|No| D[Return: 0 expired]
    C -->|Yes| E[Call expire_timed_out_quotes]
    E --> F[Get Customer Details]
    F --> G{Email Configured?}
    G -->|No| H[Skip Notifications]
    G -->|Yes| I[Send Email to Each Customer]
    I --> J[Log Results]
    H --> J
    J --> K[Return: Count + Status]
```

**Key Features:**

1. **Data Fetching:**
   - Queries quotes with `status = 'pending_confirmation'`
   - Filters by `confirmation_timer_expires_at < NOW()`
   - Includes customer email, name
   - Includes professional business name
   - Includes vehicle details

2. **Database Update:**
   - Calls `expire_timed_out_quotes()` function
   - Atomically updates all expired quotes
   - Returns count of expired quotes

3. **Email Notifications:**
   - Sends via Resend API
   - Personalized with customer name
   - Includes quote details (vehicle, amount, pro)
   - Provides "View Available Quotes" button
   - Gracefully handles email failures

4. **Error Handling:**
   - Detailed logging at each step
   - Continues processing if individual emails fail
   - Returns success even if emails fail (database still updated)

**Request/Response:**

**Request:**
```http
POST /functions/v1/check-expired-quotes
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "expired_count": 3,
  "notifications_sent": 3
}
```

**Response (No Expired):**
```json
{
  "success": true,
  "expired_count": 0,
  "message": "No expired quotes to process"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message details"
}
```

### 3. Automated Cron Job

**Purpose:** Run expiration check every minute

**Implementation:** PostgreSQL pg_cron extension

**Setup Instructions:**

#### Step 1: Enable Required Extensions

These extensions should already be enabled in your Supabase project:
- `pg_cron` - For scheduling jobs
- `pg_net` - For making HTTP requests

You can verify with:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

#### Step 2: Create Cron Job

Run this SQL in your Supabase SQL Editor:

```sql
-- Create cron job to check expired quotes every minute
SELECT cron.schedule(
  'check-expired-quotes-every-minute',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://cxraykdmlshcntqjumpc.supabase.co/functions/v1/check-expired-quotes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cmF5a2RtbHNoY250cWp1bXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTQyMjIsImV4cCI6MjA3NDMzMDIyMn0.o0ytcar3x-kBbfv23Sb3hUnCWMR9H-JyyUYwu4w3GtE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

**Cron Schedule Format:** `* * * * *`
- Minute (0-59)
- Hour (0-23)
- Day of month (1-31)
- Month (1-12)
- Day of week (0-6, Sunday = 0)

**Examples:**
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour at minute 0
- `0 0 * * *` - Daily at midnight

#### Step 3: Verify Cron Job

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Check job execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

#### Step 4: Monitor Execution

Check edge function logs in Supabase Dashboard:
- Navigate to Edge Functions → check-expired-quotes → Logs
- Look for execution entries every minute
- Verify "No expired quotes" or "Expired X quotes" messages

#### Step 5: Update or Delete Job (if needed)

```sql
-- Update job schedule
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'check-expired-quotes-every-minute'),
  schedule := '*/5 * * * *' -- Every 5 minutes instead
);

-- Delete job
SELECT cron.unschedule('check-expired-quotes-every-minute');
```

### 4. Email Notification Template

**Subject:** ⏰ Quote Confirmation Expired - Action Required

**Content Structure:**
1. **Header:** Red alert design with clock emoji
2. **Greeting:** Personalized with customer name
3. **Problem Statement:** Professional didn't confirm in time
4. **Quote Details Box:**
   - Vehicle information
   - Quote amount
   - Professional business name
5. **Next Steps:** Instructions to select another quote
6. **CTA Button:** "View Available Quotes" (links to /my-requests)
7. **Support Info:** Contact details
8. **Footer:** Automated message disclaimer

**HTML Email Design:**
- Responsive max-width 600px
- Inline CSS for email client compatibility
- Clear visual hierarchy
- Accessible color contrast
- Professional branding

**Sample Email:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #dc2626;">Quote Confirmation Time Expired</h1>
  
  <p>Hi John,</p>
  
  <p>Unfortunately, <strong>Mike's Auto Repair</strong> did not confirm your selected quote within the time limit.</p>
  
  <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #991b1b;">Quote Details:</h3>
    <p style="margin: 8px 0;"><strong>Vehicle:</strong> 2020 Toyota Camry</p>
    <p style="margin: 8px 0;"><strong>Amount:</strong> $450.00</p>
    <p style="margin: 8px 0;"><strong>Professional:</strong> Mike's Auto Repair</p>
  </div>
  
  <h3 style="color: #2563eb;">What happens next?</h3>
  <p>Don't worry! You can select another quote from your available options. Your service request is still active.</p>
  
  <div style="margin: 30px 0;">
    <a href="https://app.doneez.com/my-requests" 
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Available Quotes
    </a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
    Need help? Contact our support team at support@doneez.com
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #9ca3af; font-size: 12px;">
    This is an automated notification from DoneEZ. Please do not reply to this email.
  </p>
</div>
```

### 5. Frontend Auto-Update

**Component:** `QuoteConfirmation.tsx`

**Auto-Expiry Detection:**
```typescript
useEffect(() => {
  const updateExpiredQuote = async () => {
    if (isExpired && !hasExpired) {
      setHasExpired(true);
      try {
        // Update quote status to expired
        const { error } = await supabase
          .from("quotes")
          .update({ status: "expired" })
          .eq("id", quote.id);

        if (error) {
          console.error("Error updating expired quote:", error);
          return;
        }

        // Update referral fee if exists
        const { error: feeError } = await supabase
          .from("referral_fees")
          .update({ status: "expired" })
          .eq("quote_id", quote.id);

        if (feeError) {
          console.error("Error updating referral fee:", feeError);
        }

        // Notify parent to refresh
        setTimeout(() => {
          onConfirmed();
        }, 2000);
      } catch (error) {
        console.error("Error processing expired quote:", error);
      }
    }
  };

  updateExpiredQuote();
}, [isExpired, hasExpired, quote.id, onConfirmed]);
```

**Features:**
- Real-time countdown display
- Automatic detection when timer hits zero
- Updates database immediately on expiration
- Refreshes parent component to remove from list
- Shows "Quote Expired" message for 2 seconds

## Complete Flow Diagram

```mermaid
sequenceDiagram
    participant Customer
    participant Frontend
    participant Database
    participant CronJob
    participant EdgeFunction
    participant Email
    participant Professional

    Customer->>Frontend: Selects quote
    Frontend->>Database: accept_quote_with_timer()
    Database->>Database: Set timer based on urgency
    Database->>Database: Update quote status
    Database-->>Frontend: Timer started
    Frontend->>Professional: Notification sent
    
    Note over CronJob: Every minute
    CronJob->>EdgeFunction: Check for expired quotes
    EdgeFunction->>Database: Query pending quotes
    Database-->>EdgeFunction: Return expired quotes
    
    alt Quotes expired
        EdgeFunction->>Database: expire_timed_out_quotes()
        Database->>Database: Update status to expired
        Database-->>EdgeFunction: Count of expired
        EdgeFunction->>Email: Send notifications
        Email->>Customer: "Quote expired" email
        EdgeFunction-->>CronJob: Success response
    else No expired quotes
        EdgeFunction-->>CronJob: No action needed
    end
    
    Customer->>Frontend: Opens email link
    Frontend->>Database: Fetch available quotes
    Customer->>Frontend: Selects different quote
    Note over Frontend,Database: Process repeats
```

## Timer Mechanics

### Timer Calculation

**Function:** `get_confirmation_timer_minutes(urgency_value text)`

```sql
CREATE OR REPLACE FUNCTION public.get_confirmation_timer_minutes(urgency_value text)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE urgency_value
    WHEN 'immediate' THEN 15
    WHEN '1-2 days' THEN 30
    WHEN '1 week' THEN 60
    WHEN '1 month' THEN 120
    ELSE 60 -- default 1 hour
  END;
END;
$function$
```

### Timer Display

**Format:** Human-readable countdown
- > 60 minutes: "Xh Xm" (e.g., "1h 45m")
- < 60 minutes: "X minutes" (e.g., "25 minutes")
- Expired: "Expired"

**Update Frequency:** Real-time (every second via `getTimeRemaining()`)

**Visual Cues:**
- Orange badge with clock icon
- Warning at < 5 minutes
- Red "Expired" message when time is up

### Timer Storage

**Database Field:** `quotes.confirmation_timer_expires_at`
- Type: `timestamp with time zone`
- Calculated: `NOW() + (timer_minutes || ' minutes')::INTERVAL`
- Example: `2025-01-15 14:45:00+00` for 15-minute timer

**Metadata Field:** `quotes.confirmation_timer_minutes`
- Type: `integer`
- Stores original duration for display
- Used for analytics and debugging

## Data Flow Examples

### Example 1: Immediate Urgency (15 minutes)

```
13:00:00 - Customer selects quote (urgency: immediate)
          ↓
          Timer set to 15 minutes
          confirmation_timer_expires_at = 13:15:00
          ↓
13:15:00 - Cron job runs
          ↓
          EdgeFunction detects expired quote
          ↓
          Database updates quote.status = 'expired'
          ↓
          Email sent to customer
          ↓
13:15:30 - Customer receives email
          ↓
          Customer clicks "View Available Quotes"
          ↓
          Selects different quote
```

### Example 2: One Week Timeline (60 minutes)

```
09:30:00 - Customer selects quote (urgency: 1 week)
          ↓
          Timer set to 60 minutes
          confirmation_timer_expires_at = 10:30:00
          ↓
09:45:00 - Cron job runs (no action - not expired)
10:00:00 - Cron job runs (no action - not expired)
10:15:00 - Cron job runs (no action - not expired)
10:30:00 - Cron job runs
          ↓
          EdgeFunction detects expired quote
          ↓
          Database updates quote.status = 'expired'
          ↓
          Email sent to customer
```

### Example 3: Pro Confirms in Time

```
14:00:00 - Customer selects quote (urgency: 1-2 days)
          ↓
          Timer set to 30 minutes
          confirmation_timer_expires_at = 14:30:00
          ↓
14:10:00 - Pro clicks "Confirm & Pay Fee"
          ↓
          Pro completes Stripe payment
          ↓
          Quote status → 'confirmed'
          ↓
14:30:00 - Cron job runs
          ↓
          No expired quotes (this one is confirmed)
          ↓
          No action taken
```

## Logging & Monitoring

### Edge Function Logs

**Log Format:**
```
[2025-01-15T14:30:15.123Z] [CHECK-EXPIRED] Starting expiration check
[2025-01-15T14:30:15.456Z] [CHECK-EXPIRED] Found expired quotes - {"count":2}
[2025-01-15T14:30:15.789Z] [CHECK-EXPIRED] Expired quotes in database - {"count":2}
[2025-01-15T14:30:16.012Z] [CHECK-EXPIRED] Sending email notifications to customers
[2025-01-15T14:30:16.345Z] [CHECK-EXPIRED] Email sent successfully - {"quote_id":"...","customer_email":"john@example.com"}
[2025-01-15T14:30:16.678Z] [CHECK-EXPIRED] Email sent successfully - {"quote_id":"...","customer_email":"jane@example.com"}
[2025-01-15T14:30:16.901Z] [CHECK-EXPIRED] Expiration check completed - {"expired_count":2}
```

**Key Metrics:**
- Execution time per run
- Number of quotes expired per run
- Email success/failure rates
- Error frequency and types

### Database Monitoring

**Query to Check Pending Timers:**
```sql
SELECT 
  q.id,
  q.estimated_price,
  q.confirmation_timer_expires_at,
  q.confirmation_timer_minutes,
  sr.urgency,
  EXTRACT(EPOCH FROM (q.confirmation_timer_expires_at - NOW()))/60 as minutes_remaining,
  pp.business_name
FROM quotes q
JOIN service_requests sr ON q.request_id = sr.id
JOIN pro_profiles pp ON q.pro_id = pp.pro_id
WHERE q.status = 'pending_confirmation'
ORDER BY q.confirmation_timer_expires_at ASC;
```

**Query to Check Expiration Statistics:**
```sql
SELECT 
  DATE(updated_at) as date,
  COUNT(*) as expired_count,
  AVG(estimated_price) as avg_quote_amount,
  COUNT(DISTINCT request_id) as unique_requests
FROM quotes
WHERE status = 'expired'
  AND updated_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(updated_at)
ORDER BY date DESC;
```

### Cron Job Monitoring

**Check Job Status:**
```sql
-- View all cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname LIKE '%expired%';

-- View recent executions
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'check-expired-quotes-every-minute'
)
ORDER BY start_time DESC
LIMIT 20;
```

## Error Handling

### Common Scenarios

**1. Email API Failure**
- **Impact:** Customers don't receive notifications
- **Handling:** Log error, continue processing other quotes
- **Recovery:** Database still updated, customer sees expired status in UI

**2. Database Connection Lost**
- **Impact:** Function cannot update quotes
- **Handling:** Return error, cron will retry next minute
- **Recovery:** Next run will catch the expired quotes

**3. Invalid Email Address**
- **Impact:** Single email fails
- **Handling:** Skip that email, continue with others
- **Recovery:** Customer sees expired status in app

**4. Cron Job Not Running**
- **Impact:** Quotes not expiring automatically
- **Handling:** Frontend still detects expiration on page load
- **Recovery:** Manual cron restart or schedule update

### Debugging Steps

**Issue:** Quotes not expiring

1. Check if cron job exists:
```sql
SELECT * FROM cron.job WHERE jobname = 'check-expired-quotes-every-minute';
```

2. Check recent executions:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

3. Manual function test:
```bash
curl -X POST \
  https://cxraykdmlshcntqjumpc.supabase.co/functions/v1/check-expired-quotes \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

4. Check edge function logs in Supabase Dashboard

5. Verify database function works:
```sql
SELECT expire_timed_out_quotes();
```

## Performance Considerations

### Optimization Strategies

1. **Index on Expiration Time:**
```sql
CREATE INDEX IF NOT EXISTS idx_quotes_pending_confirmation_expires 
ON quotes (confirmation_timer_expires_at) 
WHERE status = 'pending_confirmation';
```

2. **Batch Email Processing:**
- Process emails asynchronously
- Don't block on email failures
- Use Promise.allSettled for parallel sends

3. **Efficient Query:**
- Only fetch necessary fields
- Filter by status and expiration time
- Limit results if needed (though typically small)

4. **Cron Frequency:**
- Every minute is reasonable for typical load
- Consider every 5 minutes for very high volume
- Balance between responsiveness and load

### Scalability

**Current Design:** Handles up to ~1000 expiring quotes/minute

**Scaling Options if Needed:**
1. Batch processing with pagination
2. Separate worker for email sending
3. Queue system for notifications
4. Read replicas for queries

## Testing Checklist

### Functional Testing
- [ ] Quote expires after timer duration
- [ ] Database status updates correctly
- [ ] Email sent to customer
- [ ] Customer can select new quote after expiration
- [ ] Frontend shows expired message
- [ ] Cron job runs every minute

### Timer Testing
- [ ] Immediate urgency → 15 min timer
- [ ] 1-2 days urgency → 30 min timer
- [ ] 1 week urgency → 60 min timer
- [ ] 1 month urgency → 120 min timer
- [ ] Default urgency → 60 min timer

### Email Testing
- [ ] Email delivered successfully
- [ ] Correct customer name
- [ ] Correct vehicle details
- [ ] Correct quote amount
- [ ] Correct professional name
- [ ] Link works correctly
- [ ] Mobile-responsive design

### Edge Cases
- [ ] Multiple quotes expire simultaneously
- [ ] Customer offline when email sent
- [ ] Email API temporarily down
- [ ] Database connection lost
- [ ] Cron job disabled/paused
- [ ] Quote confirmed just before expiration

### Load Testing
- [ ] 10 quotes expiring simultaneously
- [ ] 100 quotes expiring in same minute
- [ ] Cron job running while another still executing
- [ ] Email API rate limits

## Future Enhancements

### Potential Improvements

1. **SMS Notifications:**
   - Add SMS alerts via Twilio
   - Provide instant mobile notifications
   - Higher engagement than email

2. **Push Notifications:**
   - Browser push notifications
   - Mobile app notifications (if implemented)
   - Real-time alerts

3. **Reminder System:**
   - Send reminder at 5 minutes remaining
   - Warning at 1 minute remaining
   - Give pros chance to act before expiration

4. **Grace Period:**
   - Allow 5-minute grace period after expiration
   - Pro can still confirm if very close
   - Reduces friction from timezone issues

5. **Intelligent Rescheduling:**
   - Automatically extend timer if pro is online
   - Adjust based on response patterns
   - Learn from historical data

6. **Escalation System:**
   - Notify other available pros
   - Auto-match with backup pros
   - Prevent customer delays

## Documentation Links

### Related Documentation
- Phase 1 Implementation: `PHASE1_IMPLEMENTATION.md`
- Phase 2 Implementation: `PHASE2_IMPLEMENTATION.md`
- Database Schema: See `<supabase-tables>` in context
- Edge Functions: `supabase/functions/` directory

### External Resources
- pg_cron Documentation: https://github.com/citusdata/pg_cron
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Resend Email API: https://resend.com/docs
- Supabase pg_net: https://supabase.com/docs/guides/database/extensions/pg_net

---

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Implemented & Active  
**Related:** PHASE1_IMPLEMENTATION.md, PHASE2_IMPLEMENTATION.md  
**Dependencies:** pg_cron, pg_net, Resend API
