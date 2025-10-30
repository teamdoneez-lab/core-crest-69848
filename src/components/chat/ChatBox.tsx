import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be less than 2000 characters")
});

interface ChatBoxProps {
  requestId: string;
  otherUserName: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export const ChatBox = ({ requestId, otherUserName }: ChatBoxProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Load initial messages
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate message
    const validation = messageSchema.safeParse({ message: newMessage });
    if (!validation.success) {
      toast({
        title: "Invalid Message",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        request_id: requestId,
        sender_id: user.id,
        message: validation.data.message
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } else {
      setNewMessage("");
    }
    setLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chat with {otherUserName}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.message}
                timestamp={msg.created_at}
                isOwnMessage={msg.sender_id === user?.id}
                senderName={msg.sender_id === user?.id ? "You" : otherUserName}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={sendMessage} className="flex w-full gap-2">
          <div className="flex-1 space-y-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
              maxLength={2000}
            />
            {newMessage.length > 1800 && (
              <p className="text-xs text-muted-foreground">
                {2000 - newMessage.length} characters remaining
              </p>
            )}
          </div>
          <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};