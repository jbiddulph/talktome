"use client";
import { useState } from 'react';

export default function AddToCalendar({ }: { title: string; start: string }) {
	const [status, setStatus] = useState<string>("");
	async function add() {
		setStatus("Adding to calendar...");
		try {
			// Trigger ICS download/open
			const id = window.location.pathname.split('/').pop();
			const url = `/api/meetings/${id}/ics`;
			const a = document.createElement('a');
			a.href = url;
			a.download = '';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setStatus("Calendar opened");
		} catch {
			setStatus("Calendar unavailable");
		}
	}
	return (
		<div className="flex items-center gap-2">
			<button onClick={add} className="text-emerald-700 underline underline-offset-2">Add to Calendar</button>
			<span className="text-sm text-gray-600">{status}</span>
		</div>
	);
}
