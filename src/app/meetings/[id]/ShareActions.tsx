"use client";
import { useCallback } from 'react';

type Props = { title: string; summary: string };

export default function ShareActions({ title, summary }: Props) {
	const text = `Meeting: ${title}\n\nSummary:\n${summary}`;

	const shareNative = useCallback(async () => {
		if (navigator.share) {
			try {
				await navigator.share({ title: `TalkToMe • ${title}`, text });
			} catch {}
		}
	}, [text, title]);

	const smsHref = `sms:&body=${encodeURIComponent(text)}`;
	const whatsappHref = `https://wa.me/?text=${encodeURIComponent(text)}`;
	const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

	return (
		<div className="flex flex-wrap gap-2">
			<button onClick={shareNative} className="px-3 py-2 rounded bg-sky-600 text-white">Share</button>
			<a href={smsHref} className="px-3 py-2 rounded bg-emerald-600 text-white" target="_blank" rel="noreferrer">SMS</a>
			<a href={whatsappHref} className="px-3 py-2 rounded bg-green-600 text-white" target="_blank" rel="noreferrer">WhatsApp</a>
			<a href={twitterHref} className="px-3 py-2 rounded bg-blue-700 text-white" target="_blank" rel="noreferrer">Social</a>
		</div>
	);
}




