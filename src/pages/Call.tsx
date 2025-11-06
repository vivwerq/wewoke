import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, Phone, Eye, EyeOff, MessageSquare, Flag } from "lucide-react";

const Call = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showEndOptions, setShowEndOptions] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowEndOptions(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEndCall = () => {
    navigate("/dashboard");
  };

  if (showEndOptions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="fixed inset-0 gradient-mesh opacity-40 pointer-events-none" />
        
        <Card className="glass-morphism p-12 shadow-elevated max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold">Time's up!</h2>
          <p className="text-muted-foreground">Want to continue talking?</p>
          
          <div className="space-y-3">
            <Button variant="gradient" size="lg" className="w-full" onClick={() => setShowEndOptions(false)}>
              Continue (30s)
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              Add Friend
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={handleEndCall}>
              End Call
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Mock Video Feed */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50">
        {isBlurred && (
          <div className="absolute inset-0 backdrop-blur-3xl flex items-center justify-center">
            <Card className="glass-morphism p-6 text-center space-y-4">
              <Eye className="w-12 h-12 mx-auto text-primary" />
              <div>
                <h3 className="font-semibold mb-2">Call is blurred</h3>
                <p className="text-sm text-muted-foreground">
                  Both users must unblur to see each other
                </p>
              </div>
              <Button
                variant="gradient"
                onClick={() => setIsBlurred(false)}
                className="shadow-glow"
              >
                <Eye className="w-4 h-4" />
                Unblur
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <Card className="glass-morphism px-6 py-3 shadow-elevated">
          <div className="text-2xl font-bold text-primary">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <Card className="glass-morphism p-4 shadow-elevated">
          <div className="flex items-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "glass"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              variant={isVideoOff ? "destructive" : "glass"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="w-14 h-14 rounded-full shadow-glow"
              onClick={handleEndCall}
            >
              <Phone className="w-6 h-6 rotate-135" />
            </Button>

            <Button
              variant={isBlurred ? "glass" : "gradient"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => setIsBlurred(!isBlurred)}
            >
              {isBlurred ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full"
            >
              <Flag className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Network Quality */}
      <div className="absolute top-8 right-8 z-10">
        <Card className="glass-morphism px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-green-500 rounded" />
              <div className="w-1 h-3 bg-green-500 rounded" />
              <div className="w-1 h-3 bg-green-500 rounded" />
            </div>
            <span className="text-muted-foreground">HD</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Call;
