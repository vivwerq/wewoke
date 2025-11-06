import { io, Socket } from 'socket.io-client';

// Custom error class for media device errors
export class MediaDeviceError extends Error {
  public details: string;
  public originalError: Error | DOMException;

  constructor(message: string, details: string, originalError: Error | DOMException) {
    super(message);
    this.name = 'MediaDeviceError';
    this.details = details;
    this.originalError = originalError;
  }
}

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private userId: string | null = null;
  private callId: string | null = null;
  private config: RTCConfiguration | null = null;
  
  // Event callbacks
  public onRemoteStream: ((stream: MediaStream) => void) | null = null;
  public onPeerLeft: (() => void) | null = null;
  public onMatchReady: ((data: { callId: string; peerId: string }) => void) | null = null;
  public onRecordingApproved: (() => void) | null = null;
  public onPeerRecordingStatus: ((isRecording: boolean) => void) | null = null;
  
  // Initialize WebRTC signaling connection (does NOT request camera/mic permissions)
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    
    // Fetch WebRTC configuration
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const response = await fetch(`${socketUrl}/api/webrtc/config`);
    this.config = await response.json();
    
    if (!this.config) {
      throw new Error('Failed to load WebRTC configuration');
    }
    
    // Connect to Socket.IO server and wait for a successful connection.
    this.socket = io(socketUrl, { transports: ['websocket'], timeout: 7000 });

    await new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket initialization failed'));

      const onConnect = () => {
        console.log('Connected to signaling server');
        this.socket?.emit('join', userId);
        cleanup();
        resolve();
      };

      const onError = (err: any) => {
        console.error('Failed to connect to signaling server', err);
        cleanup();
        reject(err);
      };

      const onDisconnect = (reason: string) => {
        console.warn('Socket disconnected:', reason);
      };

      const timeout = setTimeout(() => onError(new Error('Socket connection timed out')), 7000);

      const cleanup = () => {
        clearTimeout(timeout);
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
        this.socket?.off('disconnect', onDisconnect);
      };

      this.socket.on('connect', onConnect);
      this.socket.on('connect_error', onError);
      this.socket.on('disconnect', onDisconnect);
    });

    this.socket.on('match-ready', (data: { callId: string; peerId: string }) => {
      console.log('Match ready:', data);
      this.callId = data.callId;
      if (this.onMatchReady) {
        this.onMatchReady(data);
      }
    });
    
    this.socket.on('signal', async (message: { type: string; data: RTCSessionDescriptionInit | RTCIceCandidateInit; from: string }) => {
      await this.handleSignal(message);
    });
    
    this.socket.on('peer-left', () => {
      console.log('Peer left the call');
      if (this.onPeerLeft) {
        this.onPeerLeft();
      }
      this.cleanup();
    });
    
    this.socket.on('recording-approved', () => {
      if (this.onRecordingApproved) {
        this.onRecordingApproved();
      }
    });
    
    this.socket.on('peer-recording-status', (data: { isRecording: boolean }) => {
      if (this.onPeerRecordingStatus) {
        this.onPeerRecordingStatus(data.isRecording);
      }
    });
  }
  
  // Start local media stream - REQUIRES user gesture/interaction (e.g., button click)
  // This calls getUserMedia and triggers browser permission prompts
  async startLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Create a detailed error message based on the error type
      let errorMessage = 'Failed to access camera/microphone';
      let errorDetails = '';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage = 'Camera/Microphone Permission Denied';
            errorDetails = 'Please grant camera and microphone permissions to use video calls. Check your browser settings.';
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            errorMessage = 'No Camera/Microphone Found';
            errorDetails = 'Please connect a camera and microphone to use video calls.';
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            errorMessage = 'Camera/Microphone In Use';
            errorDetails = 'Your camera or microphone is already in use by another application. Please close other apps and try again.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera/Microphone Constraints Not Supported';
            errorDetails = 'The requested video/audio settings are not supported by your device.';
            break;
          case 'NotSupportedError':
            errorMessage = 'HTTPS Required';
            errorDetails = 'Video calls require a secure connection (HTTPS). Please ensure you\'re accessing this site securely.';
            break;
          case 'TypeError':
            errorMessage = 'Invalid Configuration';
            errorDetails = 'The camera/microphone configuration is invalid.';
            break;
          default:
            errorDetails = error.message || 'An unknown error occurred while accessing media devices.';
        }
      }
      
      // Create and throw a properly typed error
      throw new MediaDeviceError(errorMessage, errorDetails, error as Error);
    }
  }
  
  async createPeerConnection(peerId: string, initiator: boolean = false): Promise<void> {
    if (!this.config) {
      throw new Error('WebRTC config not loaded');
    }
    
    this.peerConnection = new RTCPeerConnection(this.config);
    
    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('signal', {
          type: 'ice-candidate',
          data: event.candidate,
          from: this.userId,
          to: peerId
        });
      }
    };
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      }
      this.remoteStream.addTrack(event.track);
    };
    
    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };
    
    // If initiator, create and send offer
    if (initiator) {
      await this.createOffer(peerId);
    }
  }
  
  private async createOffer(peerId: string): Promise<void> {
    if (!this.peerConnection) return;
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.socket?.emit('signal', {
      type: 'offer',
      data: offer,
      from: this.userId,
      to: peerId
    });
  }
  
  private async handleSignal(message: { type: string; data: RTCSessionDescriptionInit | RTCIceCandidateInit; from: string }): Promise<void> {
    if (!this.peerConnection) return;
    
    switch (message.type) {
      case 'offer': {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket?.emit('signal', {
          type: 'answer',
          data: answer,
          from: this.userId,
          to: message.from
        });
        break;
      }
        
      case 'answer':
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
        break;
        
      case 'ice-candidate':
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.data as RTCIceCandidateInit));
        break;
    }
  }
  
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
  
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
  
  sendRecordingConsent(consented: boolean): void {
    if (this.callId && this.userId) {
      this.socket?.emit('recording-consent', {
        callId: this.callId,
        userId: this.userId,
        consented
      });
    }
  }
  
  sendRecordingStatus(isRecording: boolean): void {
    if (this.callId && this.userId) {
      this.socket?.emit('recording-status', {
        callId: this.callId,
        userId: this.userId,
        isRecording
      });
    }
  }
  
  leaveCall(): void {
    if (this.callId) {
      this.socket?.emit('leave-call', this.callId);
    }
    this.cleanup();
  }
  
  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
  }
  
  disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const webrtcService = new WebRTCService();
