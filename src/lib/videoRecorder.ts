export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
  
  async startRecording(stream: MediaStream): Promise<void> {
    this.stream = stream;
    this.recordedChunks = [];
    
    try {
      // Try to use the best available codec
      const options = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }
  
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder!.mimeType;
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        console.log('Recording stopped, blob size:', blob.size);
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  private getSupportedMimeType(): MediaRecorderOptions {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type };
      }
    }
    
    return {}; // Use browser default
  }
  
  async uploadRecording(blob: Blob, callId: string, userId: string): Promise<void> {
    const formData = new FormData();
    formData.append('video', blob, `recording-${callId}.webm`);
    formData.append('callId', callId);
    formData.append('userId', userId);
    
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${serverUrl}/api/uploads/video`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  }
  
  downloadRecording(blob: Blob, filename: string = 'recording.webm'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const videoRecorder = new VideoRecorder();
