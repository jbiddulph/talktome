declare global {
    interface Window {
      audioinput?: {
        checkMicrophonePermissions(success: (granted: boolean) => void, fail?: (e: any) => void): void;
        getMicrophonePermission(success: (granted: boolean) => void, fail?: (e: any) => void): void;
        start(opts: {
          sampleRate?: number; // e.g. 16000
          channels?: number;   // 1
          format?: number;     // 5 = PCM_16BIT
          streamToWebAudio?: boolean;
          normalize?: boolean;
          audioSourceType?: number;
        }): void;
        stop(): void;
        isCapturing(): boolean;
        // Cordova event sends base64 PCM chunks
        ondatareceived: (data: { data: string; format: any }) => void;
      };
    }
  }
  export {};