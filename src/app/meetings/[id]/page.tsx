import { prisma } from '@/lib/prisma';
import RecorderClient from './RecorderClient';
import { revalidatePath } from 'next/cache';
import ConfirmButton from '@/components/ConfirmButton';
import TranslateClient from './TranslateClient';
import ShareActions from './ShareActions';
import CopyableBlock from '@/components/CopyableBlock';
import EditTranscriptClient from './EditTranscriptClient';
import TtsPlayClient from './TtsPlayClient';
import RotatingStyleText from '@/components/RotatingStyleText';
import SummaryGeneratorClient from './SummaryGeneratorClient';
import { HeartIcon } from '@heroicons/react/24/solid';


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
			{/* Instruction full-width centered under top bar */}
			<div>
				<p className="text-3xl text-center mt-2 text-gray-700">Hit record, talk away, read or hear it back<br /> in the style of a <strong><RotatingStyleText /></strong></p>
			</div>

			<section className="space-y-3">
				{/* Recorder sits above and to the left of the transcript area */}
				<div className="flex items-center justify-start">
					<RecorderClient meetingId={meeting.id} />
				</div>
				<div className="relative">
					<EditTranscriptClient meetingId={meeting.id} initial={meeting.transcript ?? ''} />
				</div>
				<SummaryGeneratorClient 
					meetingId={meeting.id} 
					hasTranscript={!!(meeting.transcript && meeting.transcript.length > 0)}
					hasSummary={!!meeting.summary}
				/>
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-medium">&nbsp;</h2>
					{meeting.summary && (
						<form action={clearAction}>
							<input type="hidden" name="meetingId" value={meeting.id} />
							<ConfirmButton confirmText="Clear transcript and summary?" className="btn-primary px-2 py-1 text-xs rounded border bg-white/70 backdrop-blur-sm">✕ Clear</ConfirmButton>
						</form>
					)}
				</div>
				{meeting.summary ? (
					<>
						<CopyableBlock className="border rounded p-3 min-h-[100px] bg-half-white" text={meeting.summary} />
						{/* TTS play button */}
						<TtsPlayClient text={meeting.summary} />
					</>
				) : (
					<div className="p-3 min-h-[100px] text-center flex flex-col items-center justify-center">
						<div className="flex items-center gap-2 text-xs font-medium text-gray-700">
							<span>Vibed with Love</span>
							<HeartIcon className="h-8 w-8 text-red-600" />
						</div>
					</div>
				)}
				{meeting.summary && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<h3 className="font-medium my-2">Translate Summary</h3>
							<TranslateClient text={meeting.summary} />
						</div>
						<div>
							<h3 className="font-medium my-2">Share</h3>
							<ShareActions title={meeting.title} summary={meeting.summary} />
						</div>
					</div>
				)}
			</section>
		</main>
	);
}


