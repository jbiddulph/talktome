"use client";

import { useState } from 'react';

export default function TtsPlayClient({ text, style }: { text: string; style?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function play() {
        try {
            setError(null);
            setIsPlaying(true);
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, style }),
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = new Blob([await res.arrayBuffer()], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(url);
            };
            await audio.play();
        } catch (e: unknown) {
            setIsPlaying(false);
            setError(e instanceof Error ? e.message : 'Playback failed');
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost" onClick={play} disabled={isPlaying}>
                {isPlaying ? 'Playing…' : '🔊 Play'}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}


