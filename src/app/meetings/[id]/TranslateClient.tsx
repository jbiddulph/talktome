"use client";
import { useState } from 'react';

const languages: { code: string; label: string; flag: string }[] = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Spanish', label: 'Spanish', flag: '🇪🇸' },
  { code: 'French', label: 'French', flag: '🇫🇷' },
  { code: 'German', label: 'German', flag: '🇩🇪' },
  { code: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { code: 'Portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'Japanese', label: 'Japanese', flag: '🇯🇵' },
  { code: 'Chinese (Simplified)', label: 'Chinese', flag: '🇨🇳' },
];

export default function TranslateClient({ text }: { text: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [translated, setTranslated] = useState<string | null>(null);

  async function translate(target: string) {
    setLoading(target);
    setTranslated(null);
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target }),
    });
    if (!res.ok) {
      setLoading(null);
      return;
    }
    const data = await res.json();
    setTranslated(data.translated ?? '');
    setLoading(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => translate(l.code)}
            className="px-2 py-1 text-white"
            disabled={!!loading}
            title={`Translate to ${l.label}`}
            style={{ border: '1px solid rgba(255,255,255,0.5)', borderRadius: '8px' }}
          >
            <span className="text-xl mr-1">{l.flag}</span>
            <span className="text-sm">{l.label}</span>
          </button>
        ))}
      </div>
      {loading && <div className="text-sm text-gray-600">Translating to {loading}...</div>}
      {translated && (
        <div className="border rounded p-3 whitespace-pre-wrap cursor-pointer" title="Click to copy" onClick={() => navigator.clipboard.writeText(translated!)}>
          {translated}
        </div>
      )}
    </div>
  );
}


