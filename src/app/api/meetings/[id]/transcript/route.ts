import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const newText = String(body?.text ?? '');
  if (!newText) return new Response('text required', { status: 400 });

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return new Response('Not found', { status: 404 });

  const fromText = meeting.transcript ?? '';
  if (fromText === newText) return Response.json(meeting);

  await prisma.$transaction([
    prisma.transcriptEdit.create({ data: { meetingId: id, fromText, toText: newText } }),
    prisma.meeting.update({ where: { id }, data: { transcript: newText } }),
  ]);

  const updated = await prisma.meeting.findUnique({ where: { id } });
  return Response.json(updated);
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const edits = await prisma.transcriptEdit.findMany({ where: { meetingId: id }, orderBy: { createdAt: 'desc' } });
  return Response.json(edits);
}




