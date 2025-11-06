import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Settings, Users, User, LogOut } from "lucide-react";

interface UserProfile {
  mood: string;
  intent: string;
  interests: string[];
  username: string;
  region: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      navigate("/onboarding");
    }
  }, [navigate]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border glass-morphism">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            VibeCast
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/friends")}>
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => {
              localStorage.removeItem("userProfile");
              navigate("/");
            }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="glass-morphism p-6 shadow-elevated lg:col-span-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profile.username}</h3>
                <p className="text-sm text-muted-foreground">{profile.region}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Mood</label>
                <Badge className="mt-1 capitalize">{profile.mood}</Badge>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Intent</label>
                <Badge className="mt-1 capitalize">{profile.intent}</Badge>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Interests</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full mt-6"
              onClick={() => navigate("/onboarding")}
            >
              Edit Profile
            </Button>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Match Card */}
            <Card className="glass-morphism p-8 shadow-elevated text-center">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 pulse-glow">
                <Video className="w-10 h-10" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Ready to Connect?</h2>
              <p className="text-muted-foreground mb-8">
                Start a micro video call with someone who matches your vibe
              </p>
              
              <Button
                size="xl"
                variant="gradient"
                className="shadow-glow"
                onClick={() => navigate("/match")}
              >
                <Video className="w-5 h-5" />
                Start Matching
              </Button>
            </Card>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard label="Total Calls" value="0" />
              <StatCard label="Friends" value="0" />
              <StatCard label="Streak" value="0 days" />
            </div>

            {/* Quick Tips */}
            <Card className="glass-morphism p-6 shadow-elevated">
              <h3 className="font-semibold mb-4">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Calls start blurred for safety—both must unblur to see each other</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>30-60 second micro calls keep things fast and engaging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Add friends after a great call to stay connected</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <Card className="glass-morphism p-6 shadow-elevated text-center">
      <div className="text-2xl font-bold text-primary mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Card>
  );
};

export default Dashboard;
