import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Conversation {
  request_id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { profile } = useRole();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConversation) return;
    loadMessages(selectedConversation.request_id);
    markMessagesAsRead(selectedConversation.request_id);
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${selectedConversation.request_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `request_id=eq.${selectedConversation.request_id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const markMessagesAsRead = async (requestId: string) => {
    if (!user) return;
    
    // Mark all messages in this conversation as read (except user's own messages)
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .neq('sender_id', user.id)
      .is('read_at', null);
    
    // Update local state to hide badge immediately
    setConversations(prev => prev.map(conv => 
      conv.request_id === requestId 
        ? { ...conv, unread_count: 0 }
        : conv
    ));
  };

  const loadConversations = async () => {
    if (!user) return;

    // Get all service requests where user is either customer or accepted pro
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        customer_id,
        accepted_pro_id,
        created_at
      `)
      .or(`customer_id.eq.${user.id},accepted_pro_id.eq.${user.id}`)
      .not('accepted_pro_id', 'is', null);

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    // Get last message for each conversation
    const conversationPromises = (requests || []).map(async (request: any) => {
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('message, created_at')
        .eq('request_id', request.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const isCustomer = request.customer_id === user.id;
      const otherUserId = isCustomer ? request.accepted_pro_id : request.customer_id;
      
      // Fetch other user's name separately
      let otherUserName = 'User';
      if (isCustomer) {
        const { data: proProfile } = await supabase
          .from('pro_profiles')
          .select('business_name')
          .eq('pro_id', otherUserId)
          .single();
        otherUserName = proProfile?.business_name || 'Professional';
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', otherUserId)
          .single();
        otherUserName = profile?.name || 'Customer';
      }

      // Get unread count for this conversation
      const { count: unreadCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', request.id)
        .neq('sender_id', user.id)
        .is('read_at', null);

      return {
        request_id: request.id,
        other_user_id: otherUserId,
        other_user_name: otherUserName,
        last_message: lastMsg?.message || 'No messages yet',
        last_message_time: lastMsg?.created_at || request.created_at,
        unread_count: unreadCount || 0
      };
    });

    const convos = await Promise.all(conversationPromises);
    setConversations(convos.sort((a, b) => 
      new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    ));
  };

  const loadMessages = async (requestId: string) => {
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
    if (!newMessage.trim() || !user || !selectedConversation) return;

    setLoading(true);
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        request_id: selectedConversation.request_id,
        sender_id: user.id,
        message: newMessage.trim()
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
      loadConversations(); // Update last message
    }
    setLoading(false);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-160px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="divide-y">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">
                      Messages will appear here when you have contracted jobs
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.request_id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-muted/50 transition-colors relative",
                        selectedConversation?.request_id === conv.request_id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conv.other_user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className="font-medium truncate">{conv.other_user_name}</h3>
                              {conv.unread_count > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className="h-5 min-w-5 flex items-center justify-center rounded-full p-0 px-1.5 text-xs"
                                >
                                  {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(conv.last_message_time), 'MMM d')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedConversation.other_user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold">{selectedConversation.other_user_name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {profile?.role === 'customer' ? 'Professional' : 'Customer'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOwnMessage ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg px-4 py-2",
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className={cn(
                              "text-xs mt-1",
                              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.created_at), 'p')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={loading || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
