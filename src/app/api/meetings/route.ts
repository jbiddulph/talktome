import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const meetings = await prisma.meeting.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json(meetings);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const { title, folderId, scheduledAt } = json ?? {};
  const meeting = await prisma.meeting.create({
    data: {
      title: String(title ?? 'Untitled Meeting'),
      folderId: folderId ?? null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });
  return Response.json(meeting, { status: 201 });
}





