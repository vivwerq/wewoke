import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Video, X } from "lucide-react";

const Match = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"searching" | "found" | "connecting">("searching");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate matching process
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setStatus("found");
          setTimeout(() => {
            setStatus("connecting");
            setTimeout(() => {
              navigate("/call");
            }, 2000);
          }, 1500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 gradient-mesh opacity-40 pointer-events-none" />
      
      <Card className="glass-morphism p-12 shadow-elevated max-w-md w-full relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={() => navigate("/dashboard")}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="text-center space-y-8">
          {/* Animated Circle */}
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 gradient-primary rounded-full animate-pulse-scale opacity-50" />
            <div className="absolute inset-0 gradient-primary rounded-full pulse-glow flex items-center justify-center">
              {status === "searching" && <Loader2 className="w-12 h-12 animate-spin" />}
              {status === "found" && <Video className="w-12 h-12" />}
              {status === "connecting" && <Video className="w-12 h-12 animate-pulse-scale" />}
            </div>
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {status === "searching" && "Finding your match..."}
              {status === "found" && "Match found!"}
              {status === "connecting" && "Connecting..."}
            </h2>
            <p className="text-muted-foreground">
              {status === "searching" && "Scanning for users with similar vibes"}
              {status === "found" && "Someone with your vibe is ready to connect"}
              {status === "connecting" && "Preparing your micro call"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Matching Criteria */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Mood match</span>
              <span className={progress > 30 ? "text-primary" : ""}>
                {progress > 30 ? "✓" : "..."}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Interest match</span>
              <span className={progress > 60 ? "text-primary" : ""}>
                {progress > 60 ? "✓" : "..."}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Region match</span>
              <span className={progress > 90 ? "text-primary" : ""}>
                {progress > 90 ? "✓" : "..."}
              </span>
            </div>
          </div>

          {status === "searching" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Cancel Search
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Match;
