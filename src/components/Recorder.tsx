"use client";
import { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon, StopCircleIcon } from '@heroicons/react/24/solid';

type Props = { meetingId: string };

export default function Recorder({ meetingId }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [liveLevel, setLiveLevel] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const pcmChunksRef = useRef<Uint8Array[] | null>(null);
  const aiListenerRef = useRef<((e: any) => void) | null>(null);
  const aiErrorListenerRef = useRef<((e: any) => void) | null>(null);
  const aiChunkGuardRef = useRef<number | null>(null);
  const nativeSampleRateRef = useRef<number>(16000);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<number | null>(null);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedSec(0);
    timerRef.current = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function formatElapsed(total: number): string {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function base64ToBlob(base64Data: string, contentType = 'audio/m4a'): Blob {
    // Normalize: strip data URL prefix, fix URL-safe chars, strip whitespace
    let b64 = base64Data.trim();
    const commaIdx = b64.indexOf(',');
    if (commaIdx !== -1 && b64.substring(0, commaIdx).includes('base64')) b64 = b64.substring(commaIdx + 1);
    b64 = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    // pad to multiple of 4
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const byteCharacters = atob(b64);
    const byteArrays: Uint8Array[] = [];
    const sliceSize = 1024;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  }

  function pickFilenameAndType(mime: string | undefined): { filename: string; type: string } {
    const m = (mime || '').toLowerCase();
    if (m.includes('mp3')) return { filename: 'audio.mp3', type: 'audio/mp3' };
    if (m.includes('wav')) return { filename: 'audio.wav', type: 'audio/wav' };
    if (m.includes('ogg') || m.includes('oga')) return { filename: 'audio.ogg', type: 'audio/ogg' };
    if (m.includes('webm')) return { filename: 'audio.webm', type: 'audio/webm' };
    // iOS often returns 'audio/mp4' or 'audio/aac' for m4a
    if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return { filename: 'audio.m4a', type: 'audio/m4a' };
    // default to m4a which Whisper supports
    return { filename: 'audio.m4a', type: 'audio/m4a' };
  }

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      stopTimer();
    };
  }, []);

  async function start() {
    // Web path if available (HTTPS or allowed WebView)
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Simple live level meter
      try {
        const win = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
        const Ctor: typeof AudioContext | undefined = win.AudioContext || win.webkitAudioContext;
        if (!Ctor) throw new Error('No AudioContext');
        const audioCtx = new Ctor();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          setLiveLevel(rms);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {}
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('file', blob, 'audio.webm');
        fd.append('meetingId', meetingId);
        setStatus('Uploading and transcribing...');
        const res = await fetch('/api/transcribe', { method: 'POST', body: fd, cache: 'no-store' });
        if (!res.ok) {
          const err = await res.text().catch(() => '');
          setStatus('Transcription failed' + (err ? `: ${err.slice(0, 120)}` : ''));
        } else {
          setStatus('Transcribed');
          window.location.reload();
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      startTimer();
      return;
    }

    // Native WAV fallback via cordova-plugin-audioinput
    const ai = (typeof window !== 'undefined' ? (window as any).audioinput : undefined) as Window['audioinput'] | undefined;
    if (ai) {
      setStatus('Requesting microphone permission...');
      // Ensure listeners from prior sessions are removed
      if (aiListenerRef.current) document.removeEventListener('audioinput', aiListenerRef.current as any, false);
      if (aiErrorListenerRef.current) document.removeEventListener('audioinputerror', aiErrorListenerRef.current as any, false);
      aiListenerRef.current = null;
      aiErrorListenerRef.current = null;

      // Some devices need check+request flow
      ai.checkMicrophonePermission((hasPerm: boolean) => {
        const request = () => ai.getMicrophonePermission((granted: boolean) => begin(granted));
        if (!hasPerm) request(); else begin(true);
      });

      const begin = (granted: boolean) => {
        if (!granted) {
          setStatus('Microphone permission not granted');
          return;
        }
        pcmChunksRef.current = [];
        // Use WebAudio streaming from plugin to reliably capture samples
        try {
          const win = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
          const Ctx: typeof AudioContext | undefined = win.AudioContext || win.webkitAudioContext;
          if (!Ctx) throw new Error('No AudioContext');
          const audioCtx = new Ctx();
          audioCtxRef.current = audioCtx;
          nativeSampleRateRef.current = Math.floor(audioCtx.sampleRate) || 44100;
          const bufferSize = 2048; // small buffers to ensure frequent callbacks
          const script = audioCtx.createScriptProcessor(bufferSize, 1, 1);
          script.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0); // Float32 [-1,1]
            // Convert float32 to 16-bit PCM little-endian
            const out = new Uint8Array(input.length * 2);
            let o = 0;
            for (let i = 0; i < input.length; i++) {
              let s = Math.max(-1, Math.min(1, input[i]));
              s = s < 0 ? s * 0x8000 : s * 0x7fff;
              const v = s | 0;
              out[o++] = v & 0xff;
              out[o++] = (v >> 8) & 0xff;
            }
            if (out.length) {
              pcmChunksRef.current!.push(out);
              if (pcmChunksRef.current!.length === 1) setStatus('Recording… capturing audio');
            }
          };
          script.connect(audioCtx.destination);
          scriptNodeRef.current = script;

          // Connect plugin source to script processor
          (ai as any).connect(script);

          const config: any = {
            sampleRate: nativeSampleRateRef.current,
            channels: 1,
            format: (ai as any).FORMAT?.PCM_16BIT ?? 1,
            bufferSize: 4096,
            streamToWebAudio: true,
            normalize: false,
            audioSourceType: (ai as any).AUDIO_SOURCE_TYPE?.DEFAULT ?? 0,
          };
          ai.start(config);
        } catch {
          setStatus('Recording error');
          return;
        }
        setRecording(true);
        setStatus('Recording...');
        startTimer();
        // Guard: if no chunks after 2s, inform user
        if (aiChunkGuardRef.current) clearTimeout(aiChunkGuardRef.current);
        aiChunkGuardRef.current = window.setTimeout(() => {
          if (pcmChunksRef.current && pcmChunksRef.current.length === 0) {
            setStatus('No audio captured yet… try speaking or adjust mic perms');
          }
        }, 2000);
      };
      return;
    }
    setStatus('Recording not supported in this environment');
  }

  async function stop() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      analyserRef.current?.disconnect();
      setRecording(false);
      stopTimer();
      return;
    }

    // Native WAV stop via cordova-plugin-audioinput
    const ai = (typeof window !== 'undefined' ? (window as any).audioinput : undefined) as Window['audioinput'] | undefined;
    if (ai?.isCapturing()) {
      try {
        ai.stop();
        // Clean up listeners
        if (aiListenerRef.current) document.removeEventListener('audioinput', aiListenerRef.current as any, false);
        if (aiErrorListenerRef.current) document.removeEventListener('audioinputerror', aiErrorListenerRef.current as any, false);
        aiListenerRef.current = null;
        aiErrorListenerRef.current = null;
        if (aiChunkGuardRef.current) { clearTimeout(aiChunkGuardRef.current); aiChunkGuardRef.current = null; }
        // Disconnect WebAudio nodes
        try {
          scriptNodeRef.current?.disconnect();
          audioCtxRef.current?.close();
        } catch {}
        scriptNodeRef.current = null;
        audioCtxRef.current = null;
        stopTimer();
        const chunks = pcmChunksRef.current || [];
        const total = chunks.reduce((n, c) => n + c.length, 0);
        if (!total) {
          setStatus('Transcription failed: empty audio');
          setRecording(false);
          return;
        }
        const pcm = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) { pcm.set(c, offset); offset += c.length; }

        // WAV header (mono, 16-bit) at recorded sample rate
        const sampleRate = nativeSampleRateRef.current || 16000, channels = 1, bitsPerSample = 16;
        const blockAlign = (channels * bitsPerSample) / 8;
        const byteRate = sampleRate * blockAlign;
        const dataSize = pcm.length;
        const wav = new ArrayBuffer(44 + dataSize);
        const view = new DataView(wav);
        const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeStr(8, 'WAVE');
        writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
        view.setUint16(22, channels, true); view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        writeStr(36, 'data'); view.setUint32(40, dataSize, true);
        new Uint8Array(wav, 44).set(pcm);

        const blob = new Blob([wav], { type: 'audio/wav' });
        const fd = new FormData();
        fd.append('file', blob, 'audio.wav');
        fd.append('meetingId', meetingId);
        setStatus('Uploading and transcribing...');
        const res = await fetch('/api/transcribe', { method: 'POST', body: fd, cache: 'no-store' });
        if (!res.ok) {
          const err = await res.text().catch(() => '');
          setStatus('Transcription failed' + (err ? `: ${err.slice(0, 120)}` : ''));
        } else {
          setStatus('Transcribed');
          window.location.reload();
        }
      } catch {
        setStatus('Recording failed');
      } finally {
        setRecording(false);
        pcmChunksRef.current = null;
      }
      return;
    }
  }

  return (
    <div className="flex items-center gap-4">
      {!recording ? (
        <button onClick={start} className="relative inline-flex items-center justify-center h-14 w-14 rounded-full text-white shadow-lg active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-red-400" style={{ background: 'radial-gradient(100% 100% at 50% 0%, #ef4444 0%, #b91c1c 100%)' }} aria-label="Start recording">
          <MicrophoneIcon className="h-7 w-7" />
        </button>
      ) : (
        <button onClick={stop} className="relative inline-flex items-center justify-center h-14 w-14 rounded-full text-white bg-gray-800 shadow-lg active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Stop recording">
          <StopCircleIcon className="h-8 w-8 text-red-400" />
        </button>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 min-h-[1rem]">
          <span className="text-sm text-gray-600">{status}</span>
          {recording && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/5 text-gray-700">{formatElapsed(elapsedSec)}</span>
          )}
        </div>
        {recording && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
              </span>
            </span>
            <div className="w-28 h-2 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${Math.min(100, Math.floor(liveLevel * 200))}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



