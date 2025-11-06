import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, User, MessageSquare, UserPlus, Check, X, ArrowLeft } from "lucide-react";
import { friendsAPI, messagesAPI } from "@/lib/api";

interface Friend {
  id: string;
  requester: { id: string; username: string; avatar_url?: string };
  addressee: { id: string; username: string; avatar_url?: string };
  status: string;
}

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  
  // TODO: Replace with actual authentication context
  // Example: const { user } = useAuth();
  // const currentUserId = user?.id || '';
  const currentUserId = "current-user-id"; // Get from auth context

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const data = await friendsAPI.getFriends(currentUserId);
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await friendsAPI.getPendingRequests(currentUserId);
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await friendsAPI.acceptFriendRequest(friendshipId, currentUserId);
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      await friendsAPI.rejectFriendRequest(friendshipId, currentUserId);
      loadPendingRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      await friendsAPI.removeFriend(friendshipId);
      loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const openChat = (friendId: string) => {
    navigate(`/chat/${friendId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      <header className="relative border-b border-border glass-morphism">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Friends</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="friends">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserPlus className="w-4 h-4 mr-2" />
              Requests ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 mt-6">
            {loading ? (
              <Card className="glass-morphism p-8 text-center">
                <p className="text-muted-foreground">Loading friends...</p>
              </Card>
            ) : friends.length === 0 ? (
              <Card className="glass-morphism p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add friends after great calls to stay connected
                </p>
              </Card>
            ) : (
              friends.map((friendship) => {
                const friend = friendship.requester.id === currentUserId
                  ? friendship.addressee
                  : friendship.requester;
                
                return (
                  <Card key={friendship.id} className="glass-morphism p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{friend.username}</h3>
                          <Badge variant="outline" className="text-xs">Friend</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="gradient"
                          size="sm"
                          onClick={() => openChat(friend.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(friendship.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-6">
            {pendingRequests.length === 0 ? (
              <Card className="glass-morphism p-8 text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending requests</p>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="glass-morphism p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{request.requester.username}</h3>
                        <p className="text-sm text-muted-foreground">Friend request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Friends;
