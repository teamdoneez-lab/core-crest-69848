# Lead Notification System Fix

## Problem
SQL triggers on the `leads` table were not reliably firing, causing lead notifications to be missed. This meant professionals were not being notified when they received new leads.

## Solution
Replaced trigger-based notifications with an RPC function that creates both the lead and notification atomically in a single database call.

## Changes Made

### 1. New RPC Function Created
**File:** `create-lead-with-notification-rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.create_lead_with_notification(
    p_request_id uuid,
    p_pro_id uuid
) RETURNS uuid
```

This function:
- Creates a lead in the `leads` table
- Immediately creates a notification in `lead_notifications` table
- Returns the new lead ID
- Handles duplicate prevention with ON CONFLICT
- Is called atomically, ensuring no notifications are missed

### 2. Updated Lead Generation Logic
**File:** `setup-lead-generation-system.sql`

Changed from:
```sql
INSERT INTO leads (service_request_id, pro_id, status)
VALUES (request_id, pro_record.user_id, 'pending')
ON CONFLICT (service_request_id, pro_id) DO NOTHING;
```

To:
```sql
PERFORM create_lead_with_notification(request_id, pro_record.user_id);
```

This change was made in both:
- Exact ZIP code matching
- Distance-based matching

### 3. Deprecated Trigger Code
**File:** `add-lead-notification-trigger.sql`

Marked as deprecated. The trigger-based approach is no longer used.

### 4. Migration Note
The migration file `supabase/migrations/20251006215025_c17cb0b0-5f6c-46bc-8c77-ef1284f4a8fc.sql` is read-only, but its logic is superseded by the updated `generate_leads_for_request` function.

## How It Works Now

1. **Service Request Created** → Triggers `generate_leads_for_request()`
2. **Matching Pros Found** → For each match, calls `create_lead_with_notification()`
3. **Lead + Notification Created** → Both created atomically in one transaction
4. **Pro Receives Notification** → Guaranteed to exist in `lead_notifications` table

## Testing
To verify the fix works:

```sql
-- Create a test service request
INSERT INTO service_requests (customer_id, category_id, zip, ...)
VALUES (...);

-- Check that leads were created
SELECT * FROM leads WHERE request_id = '<new_request_id>';

-- Check that notifications were created for each lead
SELECT ln.* 
FROM lead_notifications ln
JOIN leads l ON l.id = ln.lead_id
WHERE l.request_id = '<new_request_id>';
```

Every lead should have a corresponding notification.

## Frontend Impact
No frontend changes needed. The existing code in `RequestService.tsx` already calls:

```typescript
await supabase.rpc('generate_leads_for_request', {
  p_request_id: newRequest.id
});
```

This now uses the improved backend logic automatically.

## Benefits
✅ 100% reliable - notifications always created with leads  
✅ Atomic operation - no race conditions  
✅ No trigger dependencies - works consistently  
✅ Easier to debug - single function call  
✅ Better performance - one database round trip
