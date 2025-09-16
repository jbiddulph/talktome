import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

function formatDateUTC(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    dt.getUTCFullYear().toString() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return new Response('Not found', { status: 404 });
  const start = meeting.scheduledAt ?? meeting.createdAt;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const uid = meeting.id + '@teamtalk';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TalkToMe//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateUTC(new Date())}`,
    `DTSTART:${formatDateUTC(start)}`,
    `DTEND:${formatDateUTC(end)}`,
    `SUMMARY:${meeting.title.replace(/\n/g, ' ')}`,
    meeting.summary ? `DESCRIPTION:${meeting.summary.replace(/\n/g, ' ')}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename=meeting-${meeting.id}.ics`,
    },
  });
}


