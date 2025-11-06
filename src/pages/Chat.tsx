import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, User } from "lucide-react";
import { messagesAPI } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const { friendId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendName, setFriendName] = useState("Friend");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // TODO: Replace with actual authentication context
  // Example: const { user } = useAuth();
  // const currentUserId = user?.id || '';
  const currentUserId = "current-user-id"; // Get from auth context

  const loadMessages = useCallback(async () => {
    if (!friendId) return;
    
    setLoading(true);
    try {
      const data = await messagesAPI.getMessages(currentUserId, friendId);
      setMessages(data.messages || []);
      
      // Mark messages as read
      await messagesAPI.markAsRead(currentUserId, friendId);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, [friendId, currentUserId]);

  const loadFriendProfile = useCallback(async () => {
    if (!friendId) return;
    
    try {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", friendId)
        .single();
      
      if (data) {
        setFriendName(data.username);
      }
    } catch (error) {
      console.error("Error loading friend profile:", error);
    }
  }, [friendId]);

  const subscribeToMessages = useCallback(() => {
    if (!friendId) return;
    
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${friendId},receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [friendId, currentUserId]);

  useEffect(() => {
    if (friendId) {
      loadMessages();
      loadFriendProfile();
      subscribeToMessages();
    }
  }, [friendId, loadMessages, loadFriendProfile, subscribeToMessages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !friendId) return;
    
    try {
      const data = await messagesAPI.sendMessage(currentUserId, friendId, newMessage);
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      <header className="relative border-b border-border glass-morphism z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/friends")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">{friendName}</h2>
            <p className="text-xs text-muted-foreground">Friend</p>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <div className="container max-w-4xl mx-auto h-full flex flex-col px-4 py-6">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Card className="glass-morphism p-8 text-center">
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start the conversation!
                  </p>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <Card
                        className={`max-w-[70%] p-3 ${
                          isOwn
                            ? "gradient-primary text-white"
                            : "glass-morphism"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? "text-white/70" : "text-muted-foreground"
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="mt-4 relative">
            <Card className="glass-morphism p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  variant="gradient"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
