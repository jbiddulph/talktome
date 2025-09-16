declare global {
    interface Window {
      audioinput?: {
        checkMicrophonePermissions(success: (granted: boolean) => void, fail?: (e: Error) => void): void;
        getMicrophonePermission(success: (granted: boolean) => void, fail?: (e: Error) => void): void;
        start(opts: {
          sampleRate?: number; // e.g. 16000
          channels?: number;   // 1
          format?: number;     // 5 = PCM_16BIT
          streamToWebAudio?: boolean;
          normalize?: boolean;
          audioSourceType?: number;
          bufferSize?: number;
          dataType?: 'base64' | 'arraybuffer';
        }): void;
        stop(): void;
        isCapturing(): boolean;
        connect(node: AudioNode): void;
        FORMAT?: { PCM_16BIT?: number };
        AUDIO_SOURCE_TYPE?: { DEFAULT?: number; MIC?: number };
        // Cordova event sends base64 PCM chunks
        ondatareceived: (data: { data: string; format: number }) => void;
      };
    }
  }
  export {};