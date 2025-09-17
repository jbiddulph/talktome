import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summarizeTranscript } from '@/lib/openai';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const meetingId = String(formData.get('meetingId') ?? '');
    
    if (!meetingId) {
      return new Response('Meeting ID is required', { status: 400 });
    }

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting?.transcript) {
      return new Response('No transcript found', { status: 404 });
    }

    const style = String(formData.get('style') ?? '').trim();
    const summary = await summarizeTranscript(meeting.transcript, style || undefined);
    
    await prisma.meeting.update({ 
      where: { id: meetingId }, 
      data: { summary } 
    });
    
    revalidatePath(`/talktome/${meetingId}`);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('Summarize API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Failed to generate summary: ${errorMessage}`, { status: 500 });
  }
}