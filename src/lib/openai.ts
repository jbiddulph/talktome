export async function transcribeAudio(file: File | Blob): Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
	if (!apiKey) throw new Error('OPENAI_API_KEY not set');

	const form = new FormData();
	form.append('file', file);
	form.append('model', 'whisper-1');

	const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}` },
		body: form,
	});
	if (!res.ok) throw new Error('Transcription failed');
	const data: { text?: string } = await res.json();
	return String(data.text ?? '');
}

export async function summarizeTranscript(transcript: string, style?: string): Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
	if (!apiKey) throw new Error('OPENAI_API_KEY not set');

	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
    body: JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [
                { role: 'system', content: 'You are an assistant that writes concise meeting summaries.' },
				{
					role: 'user',
                    content: (
                        (style && style.trim().length > 0
                            ? `Summarize the following transcript in 5-8 bullet points with action items and decisions, written in the style of: ${style}. Keep it readable and faithful to the content.\n\nTranscript: `
                            : 'Summarize the following meeting transcript in 5-8 bullet points with action items and decisions. Transcript: '
                        ) + transcript
                    ),
				},
			],
			temperature: 0.2,
		}),
	});
	if (!res.ok) throw new Error('Summarization failed');
	type ChatResponse = { choices?: { message?: { content?: string } }[] };
	const data: ChatResponse = await res.json();
	return data.choices?.[0]?.message?.content ?? '';
}


