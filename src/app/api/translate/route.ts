import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { text, target } = await req.json();
  if (!text || !target) return new Response('text and target required', { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
  if (!apiKey) return new Response('OPENAI_API_KEY not set', { status: 500 });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You translate text accurately while preserving meaning and tone.' },
        { role: 'user', content: `Translate the following text into ${target}. Return only the translated text.\n\n${text}` },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) return new Response('translation failed', { status: 500 });
  const data = await res.json();
  const translated = data.choices?.[0]?.message?.content ?? '';
  return Response.json({ translated });
}


