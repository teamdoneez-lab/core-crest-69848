-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_request_id ON public.chat_messages(request_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Customers can view messages for their requests
CREATE POLICY "Customers can view messages for their requests"
ON public.chat_messages
FOR SELECT
USING (
  request_id IN (
    SELECT id FROM public.service_requests WHERE customer_id = auth.uid()
  )
);

-- Accepted pros can view messages for their jobs
CREATE POLICY "Accepted pros can view messages for their jobs"
ON public.chat_messages
FOR SELECT
USING (
  request_id IN (
    SELECT id FROM public.service_requests 
    WHERE accepted_pro_id = auth.uid()
    AND (accept_expires_at IS NULL OR accept_expires_at > NOW())
  )
);

-- Customers can send messages for their requests
CREATE POLICY "Customers can send messages for their requests"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  request_id IN (
    SELECT id FROM public.service_requests WHERE customer_id = auth.uid()
  )
);

-- Accepted pros can send messages for their jobs
CREATE POLICY "Accepted pros can send messages for their jobs"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  request_id IN (
    SELECT id FROM public.service_requests 
    WHERE accepted_pro_id = auth.uid()
    AND (accept_expires_at IS NULL OR accept_expires_at > NOW())
  )
);

-- Users can mark their own messages as read
CREATE POLICY "Users can update read status"
ON public.chat_messages
FOR UPDATE
USING (
  request_id IN (
    SELECT id FROM public.service_requests 
    WHERE customer_id = auth.uid() OR accepted_pro_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;