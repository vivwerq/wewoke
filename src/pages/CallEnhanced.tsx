import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Video as VideoIcon, VideoOff, Phone, Eye, EyeOff, Circle, Flag, UserPlus, MessageSquare, Loader2 } from "lucide-react";
import { webrtcService } from "@/lib/webrtc";
import { videoRecorder } from "@/lib/videoRecorder";
import { reportsAPI, friendsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PermissionErrorDialog } from "@/components/PermissionErrorDialog";
import { InCallChat } from "@/components/InCallChat";

const CallEnhanced = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [peerIsRecording, setPeerIsRecording] = useState(false);
  const [showEndOptions, setShowEndOptions] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [permissionError, setPermissionError] = useState<{message: string; details: string} | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [showSaveRecordingDialog, setShowSaveRecordingDialog] = useState(false);
  // Pre-call state: user must click "Start Call" to initiate getUserMedia (user-initiated gesture)
  const [callStarted, setCallStarted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const callId = searchParams.get('callId') || 'demo-call';
  const peerId = searchParams.get('peerId') || 'demo-peer';
  
  // TODO: Replace with actual authentication context
  // Example: const { user } = useAuth();
  // const currentUserId = user?.id || '';
  const currentUserId = "current-user-id"; // Get from auth context

  const handleEndCall = useCallback(() => {
    if (isRecording) {
      videoRecorder.stopRecording().then((blob) => {
        videoRecorder.downloadRecording(blob, `call-${callId}.webm`);
      }).catch(console.error);
    }
    webrtcService.leaveCall();
    webrtcService.disconnect();
  }, [isRecording, callId]);

  // Cleanup function for component unmount (doesn't download recording, just disconnects)
  const cleanup = useCallback(() => {
    webrtcService.leaveCall();
    webrtcService.disconnect();
  }, []);

  // Initialize WebRTC signaling only (no getUserMedia yet - that requires user gesture)
  const initializeSignaling = useCallback(async () => {
    try {
      // Initialize WebRTC service (connects to signaling server only)
      await webrtcService.initialize(currentUserId);
      
      // Set up event handlers
      webrtcService.onRemoteStream = (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };
      
      webrtcService.onPeerLeft = () => {
        toast({
          title: "Call ended",
          description: "The other user left the call"
        });
        navigate("/dashboard");
      };
      
      // Handle peer recording status changes
      webrtcService.onPeerRecordingStatus = (isRecording: boolean) => {
        setPeerIsRecording(isRecording);
        if (isRecording) {
          toast({
            title: "Peer started recording",
            description: "The other participant is recording this call"
          });
        }
      };
      
    } catch (error: unknown) {
      console.error("Error initializing signaling:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to signaling server.",
        variant: "destructive"
      });
    }
  }, [currentUserId, navigate, toast]);

  // Start the actual call - this requires user gesture and calls getUserMedia
  const startCall = useCallback(async () => {
    setIsInitializing(true);
    try {
      // Start local stream - this is the getUserMedia call that requires user permission
      const stream = await webrtcService.startLocalStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection (in real app, determine who's initiator based on user IDs)
      await webrtcService.createPeerConnection(peerId, currentUserId < peerId);
      
      // Mark call as started and begin timer
      setCallStarted(true);
      
    } catch (error: unknown) {
      console.error("Error starting call:", error);

      // Show detailed permission error if available (from MediaDeviceError)
      // Use a safe runtime check for the `details` property rather than relying on instanceof across bundles
      if (error && typeof error === 'object' && 'details' in (error as any)) {
        setPermissionError({
          message: (error as any).message || 'Failed to access media devices',
          details: (error as any).details || ''
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to start call. Please check camera/mic permissions.",
          variant: "destructive"
        });
      }
    } finally {
      setIsInitializing(false);
    }
  }, [peerId, currentUserId, toast]);

  useEffect(() => {
    // Initialize signaling only (no getUserMedia until user clicks Start Call)
    initializeSignaling();
    
    return () => {
      // Clean up on unmount - just disconnect without downloading recording
      cleanup();
    };
  }, [initializeSignaling, cleanup]);

  // Timer only starts after call has been started by user
  useEffect(() => {
    if (!callStarted) return;

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

    return () => {
      clearInterval(timer);
    };
  }, [callStarted]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webrtcService.toggleAudio(!newMuted);
  };

  const toggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    webrtcService.toggleVideo(!newVideoOff);
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      // Stop recording
      try {
        const blob = await videoRecorder.stopRecording();
        setIsRecording(false);
        
        // Notify other participant that recording stopped
        webrtcService.sendRecordingStatus(false);
        
        // Store blob and show dialog to ask user what to do
        setRecordingBlob(blob);
        setShowSaveRecordingDialog(true);
      } catch (error) {
        console.error("Error stopping recording:", error);
        toast({
          title: "Error",
          description: "Failed to stop recording",
          variant: "destructive"
        });
      }
    } else {
      // Start recording
      try {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          await videoRecorder.startRecording(localVideoRef.current.srcObject as MediaStream);
          setIsRecording(true);
          
          // Notify other participant that recording started
          webrtcService.sendRecordingStatus(true);
          
          toast({
            title: "Recording started",
            description: "Your video is being recorded. Other participants can see the recording indicator."
          });
        }
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          title: "Error",
          description: "Failed to start recording",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddFriend = async () => {
    try {
      await friendsAPI.sendFriendRequest(currentUserId, peerId);
      toast({
        title: "Friend request sent",
        description: "You've sent a friend request to this user"
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive"
      });
    }
  };

  const handleReport = async () => {
    if (!reportCategory) return;
    
    try {
      await reportsAPI.createReport(
        currentUserId,
        peerId,
        reportCategory,
        reportDescription,
        callId
      );
      
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe"
      });
      
      setShowReportDialog(false);
      setReportCategory("");
      setReportDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive"
      });
    }
  };

  const handleSaveRecording = () => {
    if (recordingBlob) {
      videoRecorder.downloadRecording(recordingBlob, `call-${callId}-${Date.now()}.webm`);
      toast({
        title: "Recording saved",
        description: "Your recording has been downloaded"
      });
    }
    setShowSaveRecordingDialog(false);
    setRecordingBlob(null);
  };

  const handleDiscardRecording = () => {
    setShowSaveRecordingDialog(false);
    setRecordingBlob(null);
  };

  const handleRetryPermissions = () => {
    setPermissionError(null);
    startCall(); // Retry starting the call (user-initiated)
  };

  // Pre-call UI: Show "Start Call" button before getUserMedia is called
  if (!callStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="fixed inset-0 gradient-mesh opacity-40 pointer-events-none" />
        
        <Card className="glass-morphism p-12 shadow-elevated max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 pulse-glow">
            <VideoIcon className="w-10 h-10" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to Connect?</h2>
            <p className="text-muted-foreground">
              Click below to start your video call. You'll be asked to allow camera and microphone access.
            </p>
          </div>
          
          <Button
            size="xl"
            variant="gradient"
            className="w-full shadow-glow"
            onClick={startCall}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <VideoIcon className="w-5 h-5 mr-2" />
                Start Call
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/dashboard")}
            disabled={isInitializing}
          >
            Cancel
          </Button>
        </Card>

        {/* Permission Error Dialog */}
        {permissionError && (
          <PermissionErrorDialog
            open={!!permissionError}
            onOpenChange={(open) => !open && setPermissionError(null)}
            errorMessage={permissionError.message}
            errorDetails={permissionError.details}
            onRetry={handleRetryPermissions}
          />
        )}
      </div>
    );
  }

  if (showEndOptions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="fixed inset-0 gradient-mesh opacity-40 pointer-events-none" />
        
        <Card className="glass-morphism p-12 shadow-elevated max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold">Time's up!</h2>
          <p className="text-muted-foreground">Want to continue talking?</p>
          
          <div className="space-y-3">
            <Button variant="gradient" size="lg" className="w-full" onClick={() => {
              setTimeLeft(30);
              setShowEndOptions(false);
            }}>
              Continue (30s)
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={handleAddFriend}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={() => {
              handleEndCall();
              navigate("/dashboard");
            }}>
              End Call
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${isBlurred ? 'blur-3xl' : ''}`}
      />
      
      {/* Local Video (Picture-in-Picture) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white/20 z-10"
      />

      {isBlurred && (
        <div className="absolute inset-0 flex items-center justify-center z-5">
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
              <Eye className="w-4 h-4 mr-2" />
              Unblur
            </Button>
          </Card>
        </div>
      )}

      {/* Timer */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <Card className="glass-morphism px-6 py-3 shadow-elevated">
          <div className="text-2xl font-bold text-primary">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </Card>
      </div>

      {/* Recording Indicator - Shows when you or peer is recording */}
      {(isRecording || peerIsRecording) && (
        <div className="absolute top-8 right-8 z-10">
          <Card className="glass-morphism px-3 py-2 flex items-center gap-2">
            <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
            <span className="text-sm">
              {isRecording && peerIsRecording 
                ? "Both Recording" 
                : isRecording 
                ? "You're Recording" 
                : "Peer Recording"}
            </span>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <Card className="glass-morphism p-4 shadow-elevated">
          <div className="flex items-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "glass"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              variant={isVideoOff ? "destructive" : "glass"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="w-14 h-14 rounded-full shadow-glow"
              onClick={() => {
                handleEndCall();
                navigate("/dashboard");
              }}
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

            {/* Text chat button - always enabled once in-call, clickable and focusable */}
            <Button
              variant={showChat ? "gradient" : "glass"}
              size="icon"
              className="w-12 h-12 rounded-full cursor-pointer"
              onClick={() => setShowChat(!showChat)}
              title="Toggle in-call chat"
              aria-label="Toggle in-call chat"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>

            <Button
              variant={isRecording ? "destructive" : "ghost"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={handleRecordingToggle}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              <Circle className={`w-5 h-5 ${isRecording ? 'fill-white' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => setShowReportDialog(true)}
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

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate behavior
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="nudity">Nudity</SelectItem>
                  <SelectItem value="violence">Violence</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional details..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReportDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReport}
                disabled={!reportCategory}
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Error Dialog */}
      {permissionError && (
        <PermissionErrorDialog
          open={!!permissionError}
          onOpenChange={(open) => !open && setPermissionError(null)}
          errorMessage={permissionError.message}
          errorDetails={permissionError.details}
          onRetry={handleRetryPermissions}
        />
      )}

      {/* Save Recording Dialog */}
      <Dialog open={showSaveRecordingDialog} onOpenChange={setShowSaveRecordingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Recording</DialogTitle>
            <DialogDescription>
              Would you like to download your recording?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDiscardRecording}
            >
              Discard
            </Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={handleSaveRecording}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* In-Call Chat */}
      <InCallChat
        open={showChat}
        onOpenChange={setShowChat}
        currentUserId={currentUserId}
        peerId={peerId}
        callId={callId}
      />
    </div>
  );
};

export default CallEnhanced;
