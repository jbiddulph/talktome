import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.meeting.update({ where: { id }, data: { transcript: null, summary: null } });
  return new Response(null, { status: 204 });
}





