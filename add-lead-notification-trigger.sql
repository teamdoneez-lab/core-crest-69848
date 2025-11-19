-- Create a function to send lead notifications via edge function
-- This function will be triggered automatically when a new lead is inserted
CREATE OR REPLACE FUNCTION notify_pro_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-lead-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'leadId', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to fire after lead insertion
DROP TRIGGER IF EXISTS trigger_notify_pro_new_lead ON leads;
CREATE TRIGGER trigger_notify_pro_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_pro_new_lead();

-- Note: Make sure you have the pg_net extension enabled and configured with your Supabase settings
-- You can enable it with: CREATE EXTENSION IF NOT EXISTS pg_net;
-- And configure the settings in your Supabase dashboard
