import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { meetingId } = await req.json();
  if (!meetingId) return new Response('meetingId required', { status: 400 });
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting?.transcript) return new Response('Transcript missing', { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
  if (!apiKey) return new Response('OPENAI_API_KEY not set', { status: 500 });

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
          content:
            'Summarize the following meeting transcript in 5-8 bullet points with action items and decisions. Transcript: ' +
            meeting.transcript,
        },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) return new Response('Summarization failed', { status: 500 });
  const data = await res.json();
  const summary = data.choices?.[0]?.message?.content ?? '';

  const updated = await prisma.meeting.update({ where: { id: meetingId }, data: { summary } });
  return Response.json(updated);
}


