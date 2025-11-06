import { AlertCircle, Video, Mic, Shield, Settings } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";

interface PermissionErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage: string;
  errorDetails: string;
  onRetry?: () => void;
}

export const PermissionErrorDialog = ({
  open,
  onOpenChange,
  errorMessage,
  errorDetails,
  onRetry,
}: PermissionErrorDialogProps) => {
  const isPermissionDenied = errorMessage.includes('Permission Denied');
  const isHTTPSRequired = errorMessage.includes('HTTPS Required');
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-left">{errorMessage}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4">
            <p>{errorDetails}</p>
            
            {isPermissionDenied && (
              <Card className="glass-morphism p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  How to enable permissions:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Video className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Click the camera/lock icon in your browser's address bar</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mic className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Allow access to camera and microphone</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Refresh the page and try again</p>
                  </div>
                </div>
              </Card>
            )}
            
            {isHTTPSRequired && (
              <Card className="glass-morphism p-4">
                <p className="text-sm">
                  <strong>Note:</strong> For security reasons, browsers require a secure HTTPS 
                  connection to access camera and microphone. Please ensure you're accessing 
                  this site via HTTPS (look for the padlock icon in your address bar).
                </p>
              </Card>
            )}
            
            {!isPermissionDenied && !isHTTPSRequired && (
              <Card className="glass-morphism p-4">
                <p className="text-sm">
                  <strong>Troubleshooting tips:</strong>
                </p>
                <ul className="text-sm space-y-1 mt-2 list-disc list-inside">
                  <li>Make sure your camera and microphone are connected</li>
                  <li>Close other applications that might be using your camera/mic</li>
                  <li>Check your browser's site settings for camera/microphone access</li>
                  <li>Try refreshing the page</li>
                </ul>
              </Card>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          {onRetry && (
            <AlertDialogAction 
              onClick={onRetry}
              className="bg-primary hover:bg-primary/90"
            >
              Try Again
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            {onRetry ? 'Cancel' : 'Close'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
