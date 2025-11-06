import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, Shield, Users, Zap, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh opacity-50 pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="container max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Anonymous & Safe</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Connect by
            <span className="block gradient-primary bg-clip-text text-transparent mt-2">
              Vibe, Not Profile
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lightning-fast 30-second micro video calls matched by mood, interests, and intent. 
            No signups. No profiles. Just real connections.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="xl" variant="gradient" className="group" asChild>
              <Link to="/onboarding">
                Start Matching
                <Zap className="w-5 h-5 group-hover:animate-pulse-scale" />
              </Link>
            </Button>
            <Button size="xl" variant="glass" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 pt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Blur-first safety
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              30-60 sec calls
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Make friends
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Simple, safe, and lightning fast
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Set Your Vibe"
              description="Choose your mood, interests, and what you're looking for—study partner, fun chat, or just vibing."
            />
            <FeatureCard
              icon={<Video className="w-8 h-8" />}
              title="Instant Match"
              description="Get matched with someone who shares your vibe. Calls start blurred for safety until both unblur."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Connect & Befriend"
              description="If the vibe is right, add them as a friend. Chat privately and stay connected internally."
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="container max-w-4xl mx-auto text-center glass-morphism rounded-3xl p-12 shadow-elevated">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Find Your Vibe?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands discovering real connections through micro video calls
          </p>
          <Button size="xl" variant="gradient" className="pulse-glow" asChild>
            <Link to="/onboarding">
              Get Started Now
              <Sparkles className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-border">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 VibeCast. Safe, anonymous, and always free.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="glass-morphism p-8 rounded-2xl hover:bg-white/10 transition-smooth group">
      <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-smooth">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
