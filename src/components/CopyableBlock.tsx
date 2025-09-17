"use client";
import { useState } from 'react';

type Props = { text: string; className?: string };

export default function CopyableBlock({ text, className }: Props) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {}
	}
	return (
		<div onClick={copy} className={className} title={copied ? 'Copied!' : 'Click to copy'}  style={{ border: '1px solid rgba(255,255,255,0.5)', borderRadius: '12px' }}>
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs text-gray-500">Click to copy</span>
				{copied && <span className="text-xs text-emerald-600">Copied</span>}
			</div>
			<div className="whitespace-pre-wrap">
				{text}
			</div>
		</div>
	);
}






