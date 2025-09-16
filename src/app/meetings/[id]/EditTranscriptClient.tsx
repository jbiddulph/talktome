"use client";
import { useEffect, useState } from 'react';

export default function EditTranscriptClient({ meetingId, initial }: { meetingId: string; initial: string }) {
	const [text, setText] = useState<string>(initial ?? "");
	const [saving, setSaving] = useState(false);
	const [edits, setEdits] = useState<Array<{ id: string; fromText: string; toText: string; createdAt: string }>>([]);
	const [dirty, setDirty] = useState(false);

	async function save() {
		setSaving(true);
		const res = await fetch(`/api/meetings/${meetingId}/transcript`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text }),
		});
		setSaving(false);
		if (!res.ok) return;
		await loadHistory();
		setDirty(false);
	}

	async function loadHistory() {
		const res = await fetch(`/api/meetings/${meetingId}/transcript`);
		if (!res.ok) return;
		const data = await res.json();
		setEdits(data);
	}

	useEffect(() => {
		loadHistory();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [meetingId]);

	useEffect(() => {
		setDirty(text !== (initial ?? ""));
	}, [text, initial]);

	return (
		<div className="space-y-2">
			<textarea
				className="w-full border rounded p-3 min-h-[160px] bg-half-white"
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Edit transcript..."
			/>
			<div className="flex items-center justify-start gap-2">
				{dirty && (
					<button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save edits'}</button>
				)}
			</div>
		</div>
	);
}


