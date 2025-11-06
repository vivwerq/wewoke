import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Smile, Meh, Frown, Zap, MessageCircle, Music, BookOpen, Globe, MapPin } from "lucide-react";

const moods = [
  { id: "chill", label: "Chill", icon: Smile, color: "bg-blue-500/20 text-blue-400" },
  { id: "excited", label: "Excited", icon: Zap, color: "bg-yellow-500/20 text-yellow-400" },
  { id: "bored", label: "Bored", icon: Meh, color: "bg-gray-500/20 text-gray-400" },
  { id: "stressed", label: "Stressed", icon: Frown, color: "bg-red-500/20 text-red-400" },
  { id: "talkative", label: "Talkative", icon: MessageCircle, color: "bg-green-500/20 text-green-400" },
  { id: "silent", label: "Silent", icon: BookOpen, color: "bg-purple-500/20 text-purple-400" },
];

const intents = [
  { id: "fun", label: "Fun Chat", description: "Just hanging out" },
  { id: "study", label: "Study Partner", description: "Focus together" },
  { id: "music", label: "Music Talk", description: "Share the vibe" },
  { id: "venting", label: "Venting", description: "Need to talk" },
  { id: "random", label: "Random", description: "Whatever happens" },
];

const interests = [
  "Gaming", "Music", "Movies", "Sports", "Art", "Tech", 
  "Fitness", "Travel", "Food", "Books", "Anime", "Fashion"
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedIntent, setSelectedIntent] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [region, setRegion] = useState("");

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Save to localStorage for demo
      localStorage.setItem("userProfile", JSON.stringify({
        mood: selectedMood,
        intent: selectedIntent,
        interests: selectedInterests,
        username: username || `User${Math.floor(Math.random() * 10000)}`,
        region: region || "Global"
      }));
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedMood !== "";
      case 2: return selectedIntent !== "";
      case 3: return selectedInterests.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      <div className="container max-w-2xl mx-auto relative">
        <Card className="glass-morphism p-8 md:p-12 shadow-elevated">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-smooth ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Mood */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">What's your mood?</h2>
                <p className="text-muted-foreground">Pick the vibe you're feeling right now</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {moods.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`p-6 rounded-xl transition-smooth flex flex-col items-center gap-3 ${
                        selectedMood === mood.id
                          ? "bg-primary/20 border-2 border-primary shadow-glow"
                          : "glass-morphism hover:bg-white/5"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full ${mood.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-medium">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Intent */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">What's your intent?</h2>
                <p className="text-muted-foreground">What are you looking to do?</p>
              </div>
              
              <div className="space-y-3">
                {intents.map((intent) => (
                  <button
                    key={intent.id}
                    onClick={() => setSelectedIntent(intent.id)}
                    className={`w-full p-4 rounded-xl transition-smooth text-left ${
                      selectedIntent === intent.id
                        ? "bg-primary/20 border-2 border-primary shadow-glow"
                        : "glass-morphism hover:bg-white/5"
                    }`}
                  >
                    <div className="font-medium">{intent.label}</div>
                    <div className="text-sm text-muted-foreground">{intent.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Your interests</h2>
                <p className="text-muted-foreground">Select at least one (or more!)</p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm transition-smooth hover:shadow-glow"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Profile Details */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Almost there!</h2>
                <p className="text-muted-foreground">Optional profile details</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Username (optional)
                  </label>
                  <Input
                    placeholder="Or we'll generate one for you"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="glass-morphism"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Region (optional)
                  </label>
                  <Input
                    placeholder="Global"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="glass-morphism"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a city or area, or leave blank for global matching
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={handleNext}
              disabled={!canProceed()}
              className={`${step === 1 ? 'w-full' : 'flex-1'}`}
            >
              {step === 4 ? "Complete Setup" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
