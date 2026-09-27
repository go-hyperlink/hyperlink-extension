// Screen & Audio Recording Service using MediaStream & MediaRecorder

import { RecordingOptions } from '../../types';
import { indexedDBService } from '../storage/indexedDB';

export interface RecordedVideoData {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  size: number;
  timestamp: number;
}

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private status: RecordingStatus = 'idle';
  private startTime: number = 0;
  private timerInterval: any = null;
  private elapsedSeconds: number = 0;

  private onStatusChangeCallbacks: Set<(status: RecordingStatus, elapsed: number) => void> = new Set();

  getStatus(): RecordingStatus {
    return this.status;
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  subscribe(callback: (status: RecordingStatus, elapsed: number) => void): () => void {
    this.onStatusChangeCallbacks.add(callback);
    return () => this.onStatusChangeCallbacks.delete(callback);
  }

  private notify() {
    this.onStatusChangeCallbacks.forEach(fn => fn(this.status, this.elapsedSeconds));
  }

  async startRecording(options: RecordingOptions): Promise<boolean> {
    try {
      this.recordedChunks = [];
      this.elapsedSeconds = 0;

      // Request display media (Tab/Window/Screen)
      const displayMediaOptions: any = {
        video: {
          cursor: options.cursor || 'always'
        },
        audio: options.audio
      };

      this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // If user enabled microphone, mix mic stream
      if (options.mic) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new AudioContext();
          const destination = audioContext.createMediaStreamDestination();

          if (this.stream.getAudioTracks().length > 0) {
            const systemSource = audioContext.createMediaStreamSource(this.stream);
            systemSource.connect(destination);
          }

          const micSource = audioContext.createMediaStreamSource(this.micStream);
          micSource.connect(destination);

          // Add mixed audio track to stream
          const mixedAudioTrack = destination.stream.getAudioTracks()[0];
          if (mixedAudioTrack) {
            // Remove old audio tracks and append mixed
            this.stream.getAudioTracks().forEach(t => this.stream?.removeTrack(t));
            this.stream.addTrack(mixedAudioTrack);
          }
        } catch (micErr) {
          console.warn('Microphone access denied or unavailable, proceeding with screen only:', micErr);
        }
      }

      // Check supported mime types
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle stream track ending (user clicks "Stop sharing" on Chrome banner)
      this.stream.getVideoTracks()[0].onended = () => {
        if (this.status === 'recording' || this.status === 'paused') {
          this.stopRecording();
        }
      };

      this.mediaRecorder.start(1000); // 1s slices
      this.status = 'recording';
      this.startTime = Date.now();

      this.timerInterval = setInterval(() => {
        if (this.status === 'recording') {
          this.elapsedSeconds++;
          this.notify();
        }
      }, 1000);

      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to start screen recording:', err);
      this.status = 'idle';
      this.notify();
      return false;
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.status === 'recording') {
      this.mediaRecorder.pause();
      this.status = 'paused';
      this.notify();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.status === 'paused') {
      this.mediaRecorder.resume();
      this.status = 'recording';
      this.notify();
    }
  }

  async stopRecording(): Promise<RecordedVideoData | null> {
    if (!this.mediaRecorder || this.status === 'idle') return null;

    clearInterval(this.timerInterval);

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const duration = this.elapsedSeconds;
        const id = 'rec_' + Date.now();

        // Stop all tracks
        this.stream?.getTracks().forEach(t => t.stop());
        this.micStream?.getTracks().forEach(t => t.stop());

        const videoData: RecordedVideoData = {
          id,
          blob,
          url,
          duration,
          size: blob.size,
          timestamp: Date.now()
        };

        // Persist into IndexedDB
        try {
          await indexedDBService.saveRecording({
            id,
            blob,
            name: `Recording — ${new Date().toLocaleTimeString()}`,
            duration,
            timestamp: Date.now(),
            size: blob.size,
            mode: 'screen'
          });
        } catch (e) {
          console.warn('Could not save recording to IndexedDB', e);
        }

        this.status = 'idle';
        this.notify();
        resolve(videoData);
      };

      this.mediaRecorder.stop();
    });
  }

  downloadRecording(blob: Blob, filename = 'hyperlink-recording.webm'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export const recordingService = new RecordingService();
