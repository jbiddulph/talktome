"use client";

import { useEffect, useRef, useState } from 'react';

export default function TtsPlayClient({ text, style }: { text: string; style?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasAudio, setHasAudio] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const urlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
            }
        };
    }, []);

    async function ensureAudio() {
        if (audioRef.current && hasAudio) return;
        const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, style }),
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = new Blob([await res.arrayBuffer()], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        audioRef.current = audio;
        setHasAudio(true);
    }

    async function onPlayPause() {
        try {
            setError(null);
            await ensureAudio();
            if (!audioRef.current) return;
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                await audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Playback failed');
            setIsPlaying(false);
        }
    }

    function onStop() {
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
        } catch {
            /* noop */
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost" onClick={onPlayPause}>
                {isPlaying ? '⏸ Pause' : hasAudio ? '▶️ Play' : '🔊 Play'}
            </button>
            <button type="button" className="btn-ghost" onClick={onStop} disabled={!hasAudio}>
                ⏹ Stop
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}


