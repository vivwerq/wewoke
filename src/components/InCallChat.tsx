import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, X } from "lucide-react";
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

interface InCallChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  peerId: string;
  callId: string;
}

export const InCallChat = ({
  open,
  onOpenChange,
  currentUserId,
  peerId,
  callId,
}: InCallChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!peerId) return;

    setLoading(true);
    try {
      const data = await messagesAPI.getMessages(currentUserId, peerId);
      setMessages(data.messages || []);

      // Mark messages as read
      await messagesAPI.markAsRead(currentUserId, peerId);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, peerId]);

  const subscribeToMessages = useCallback(() => {
    if (!peerId) return;

    const channel = supabase
      .channel(`call-chat-${callId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${peerId},receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [peerId, currentUserId, callId, scrollToBottom]);

  useEffect(() => {
    if (open && peerId) {
      loadMessages();
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    }
  }, [open, peerId, loadMessages, subscribeToMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !peerId) return;

    try {
      const data = await messagesAPI.sendMessage(
        currentUserId,
        peerId,
        newMessage
      );
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      scrollToBottom();
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] p-0 flex flex-col bg-background/95 backdrop-blur-sm"
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle>In-Call Chat</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Card className="glass-morphism p-6 text-center">
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Start chatting during your call!
                  </p>
                </Card>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <Card
                        className={`max-w-[85%] p-3 ${
                          isOwn
                            ? "gradient-primary text-white"
                            : "glass-morphism"
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="px-6 py-4 border-t border-border">
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
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
