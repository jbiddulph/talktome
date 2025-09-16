import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const folders = await prisma.folder.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json(folders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body?.name ?? '').trim();
  if (!name) return new Response('Name required', { status: 400 });
  const folder = await prisma.folder.create({ data: { name } });
  return Response.json(folder, { status: 201 });
}





