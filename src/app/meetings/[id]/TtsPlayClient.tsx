"use client";

import { useEffect, useRef, useState } from 'react';

export default function TtsPlayClient({ text, style }: { text: string; style?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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
        setIsLoading(true);
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
        setIsLoading(false);
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
            setIsLoading(false);
        }
    }

    function onStop() {
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
            audioRef.current = null;
            setHasAudio(false);
            setIsPlaying(false);
        } catch {
            /* noop */
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost" onClick={onPlayPause} disabled={isLoading}>
                {isLoading ? (
                    <span className="inline-flex items-center gap-1">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Loading…
                    </span>
                ) : isPlaying ? '⏸ Pause' : hasAudio ? '▶️ Play' : '🔊 Play'}
            </button>
            <button type="button" className="btn-ghost" onClick={onStop} disabled={!hasAudio || isLoading}>
                ⏹ Stop
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}


