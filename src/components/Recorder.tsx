"use client";
import { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon, StopCircleIcon } from '@heroicons/react/24/solid';
import { VoiceRecorder } from 'capacitor-voice-recorder';

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
  // Native path does not need extra buffers when using VoiceRecorder
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

  // Helpers for native m4a base64 payloads
  function base64ToBlob(base64Data: string, contentType = 'audio/m4a'): Blob {
    let b64 = base64Data.trim();
    const commaIdx = b64.indexOf(',');
    if (commaIdx !== -1 && b64.substring(0, commaIdx).includes('base64')) b64 = b64.substring(commaIdx + 1);
    b64 = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
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
    if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return { filename: 'audio.m4a', type: 'audio/m4a' };
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

    // Native path via capacitor-voice-recorder (m4a base64)
    setStatus('Requesting microphone permission...');
    const perm = await VoiceRecorder.requestAudioRecordingPermission();
    if (!perm.value) {
      setStatus('Microphone permission not granted');
      return;
    }
    await VoiceRecorder.startRecording();
    setRecording(true);
    setStatus('Recording...');
    startTimer();
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

    // Native stop via VoiceRecorder (m4a base64)
    try {
      const result = await VoiceRecorder.stopRecording();
      stopTimer();
      const base64 = result.value.recordDataBase64 ?? '';
      const mime = result.value.mimeType || 'audio/m4a';
      const chosen = pickFilenameAndType(mime);
      const blob = base64ToBlob(base64, chosen.type);
      const fd = new FormData();
      fd.append('file', blob, chosen.filename);
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



