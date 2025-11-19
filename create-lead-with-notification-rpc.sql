-- ============================================================================
-- RPC FUNCTION: Create Lead with Notification
-- ============================================================================
-- This function creates a lead and immediately creates a notification for it.
-- This replaces the unreliable trigger-based approach.
-- Returns the new lead_id for reference.

CREATE OR REPLACE FUNCTION public.create_lead_with_notification(
    p_request_id uuid,
    p_pro_id uuid
) RETURNS uuid AS $$
DECLARE
    new_lead_id uuid;
    lead_link TEXT;
BEGIN
    -- Insert the lead record
    INSERT INTO public.leads (request_id, pro_id, status)
    VALUES (p_request_id, p_pro_id, 'pending')
    ON CONFLICT (request_id, pro_id) DO NOTHING
    RETURNING id INTO new_lead_id;

    -- Only create notification if a new lead was created (not a duplicate)
    IF new_lead_id IS NOT NULL THEN
        -- Create the lead link
        lead_link := 'https://doneez.com/pro-dashboard';

        -- Insert notification record
        INSERT INTO public.lead_notifications (lead_id, pro_id, message, created_at)
        VALUES (
            new_lead_id,
            p_pro_id,
            'You have a new lead! View it in your dashboard: ' || lead_link,
            NOW()
        );
    END IF;

    RETURN new_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_lead_with_notification TO postgres, service_role, authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This function should be called instead of direct INSERT INTO leads
-- Usage from Supabase client:
--   const { data, error } = await supabase.rpc('create_lead_with_notification', {
--     p_request_id: requestId,
--     p_pro_id: proId
--   });
--
-- Returns: new lead_id (uuid) or null if duplicate
