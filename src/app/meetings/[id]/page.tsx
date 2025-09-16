import { prisma } from '@/lib/prisma';
import RecorderClient from './RecorderClient';
import { summarizeTranscript } from '@/lib/openai';
import { revalidatePath } from 'next/cache';
import SubmitButton from '@/components/SubmitButton';
import ConfirmButton from '@/components/ConfirmButton';
import TranslateClient from './TranslateClient';
import ShareActions from './ShareActions';
// import Link from 'next/link';
import ClientTime from '@/components/ClientTime';
import CopyableBlock from '@/components/CopyableBlock';
import EditTranscriptClient from './EditTranscriptClient';

async function summarizeAction(formData: FormData) {
	'use server';
	const meetingId = String(formData.get('meetingId') ?? '');
	if (!meetingId) return;
	const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
	if (!meeting?.transcript) return;
	const summary = await summarizeTranscript(meeting.transcript);
	await prisma.meeting.update({ where: { id: meetingId }, data: { summary } });
	revalidatePath(`/meetings/${meetingId}`);
}

async function clearAction(formData: FormData) {
	'use server';
	const meetingId = String(formData.get('meetingId') ?? '');
	if (!meetingId) return;
	await prisma.meeting.update({ where: { id: meetingId }, data: { transcript: null, summary: null } });
	revalidatePath(`/meetings/${meetingId}`);
}

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const meeting = await prisma.meeting.findUnique({ where: { id } });
	if (!meeting) return <div className="p-6">Not found</div>;

	return (
		<main className="max-w-3xl mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div>
						<h1 className="text-2xl font-semibold">{meeting.title}</h1>
						<p className="text-sm text-gray-500"><ClientTime iso={meeting.createdAt as unknown as string} /></p>
					</div>
				</div>
				<div className="inline-flex items-center gap-2" />
			</div>

			<section className="space-y-3">
				<div className="flex justify-center -mt-2 mb-2">
					<RecorderClient meetingId={meeting.id} />
				</div>
				<div className="relative">
					<EditTranscriptClient meetingId={meeting.id} initial={meeting.transcript ?? ''} />
					{(meeting.transcript && meeting.transcript.length > 0) && (
						<form action={clearAction} className="absolute right-2 top-2">
							<input type="hidden" name="meetingId" value={meeting.id} />
							<ConfirmButton confirmText="Clear transcript and summary?" className="px-2 py-1 text-xs rounded border bg-white/70 backdrop-blur-sm">✕ Clear</ConfirmButton>
						</form>
					)}
				</div>
				{(meeting.transcript && meeting.transcript.length > 0) && (
					<form action={summarizeAction} className="flex justify-start mt-2">
						<input type="hidden" name="meetingId" value={meeting.id} />
						<SubmitButton className="btn-primary" idleText="Generate Summary" pendingText="Generating..." />
					</form>
				)}
			</section>

			<section className="space-y-3">
				<h2 className="text-xl font-medium">AI Summary</h2>
				{meeting.summary ? (
					<CopyableBlock className="border rounded p-3 min-h-[100px]" text={meeting.summary} />
				) : (
					<div className="border rounded p-3 min-h-[100px] whitespace-pre-wrap">No summary yet.</div>
				)}
				{meeting.summary && (
					<div className="space-y-2">
						<h3 className="font-medium">Translate Summary</h3>
						<TranslateClient text={meeting.summary} />
						<h3 className="font-medium">Share</h3>
						<ShareActions title={meeting.title} summary={meeting.summary} />
					</div>
				)}
			</section>
		</main>
	);
}


