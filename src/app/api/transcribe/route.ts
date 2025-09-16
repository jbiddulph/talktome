import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const meetingId = String(formData.get('meetingId') ?? '');
  if (!(file instanceof Blob)) return new Response('file required', { status: 400 });
  if (!meetingId) return new Response('meetingId required', { status: 400 });

  // For MVP: we won't persist the raw audio; just transcribe and store transcript
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
  if (!apiKey) return new Response('OPENAI_API_KEY not set', { status: 500 });

  // Inspect incoming file
  const size = (file as Blob).size;
  const type = (file as Blob).type ?? '';
  if (!size || size < 200) {
    console.error('Transcribe: empty or tiny file received. type=', type, 'size=', size);
    return new Response('empty audio received', { status: 400 });
  }

  // Wrap Blob into a File with a supported container name
  const forcedFile = new File([file as Blob], 'audio.m4a', { type: 'audio/m4a' });
  const openaiForm = new FormData();
  openaiForm.append('file', forcedFile);
  openaiForm.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: openaiForm,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('OpenAI transcription error:', res.status, errText);
    return new Response(`transcription failed: ${res.status} ${errText}`, { status: 500 });
  }
  const data = (await res.json()) as { text?: string };
  const transcript = String(data.text ?? '');

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data: { transcript },
  });
  return Response.json(updated, { headers: { 'Cache-Control': 'no-store' } });
}


