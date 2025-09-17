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
import TtsPlayClient from './TtsPlayClient';
import RotatingStyleText from '@/components/RotatingStyleText';

async function summarizeAction(formData: FormData) {
	'use server';
	const meetingId = String(formData.get('meetingId') ?? '');
	if (!meetingId) return;
	const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
	if (!meeting?.transcript) return;
	const style = String(formData.get('style') ?? '').trim();
	const summary = await summarizeTranscript(meeting.transcript, style || undefined);
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
				{(meeting.transcript && meeting.transcript.length > 0) && (
					<form action={summarizeAction} className="flex flex-col gap-2 justify-start mt-2">
						<div className="flex flex-col gap-1">
							<label htmlFor="style" className="text-sm text-white italic">In the style of: </label>
							<select name="style" id="style" className="rounded px-2 py-1 text-white" style={{ border: '1px solid rgba(255,255,255,0.5)' }}>
								<option value="">Default</option>
								<option>Meeting Notes</option>
								<option>Rapper – Punchy rhyme or a hype bar.</option>
								<option>Sports Commentator – Calls it like a thrilling play-by-play moment.</option>
								<option>Movie Trailer Voice – Over-the-top and cinematic.</option>
								<option>News Anchor – Formal, and breaking-news style.</option>
								<option>Stand-Up Comedian – Twists it into a witty punchline.</option>
								<option>Shakespearean Bard – Flowery, old-English phrasing.</option>
								<option>Fairy Tale Narrator – Whimsical and magical.</option>
								<option>Conspiracy Theorist – Paranoid and full of hidden meanings.</option>
								<option>Tech Support Agent – Dry and procedural.</option>
								<option>Pet Blogger – As if your dog or cat is gossiping about you.</option>
								<option>Cooking Show Host – Ingredients and steps as a recipe.</option>
								<option>Pirate Captain – Growly and full of “Arrr!”</option>
								<option>Poet – Turns it into a haiku or rhyming couplet.</option>
								<option>Gamer Streamer – Overly excited Twitch energy.</option>
								<option>Motivational Coach – Pep talk style, big on energy.</option>
								<option>Sci-Fi Narrator – Futuristic and dramatic, with starship vibes.</option>
								<option>Gossip Columnist – Sassy and dramatic, spilling “tea”.</option>
							</select>
						</div>
						<input type="hidden" name="meetingId" value={meeting.id} />
						<SubmitButton className="btn-primary" idleText="Talk To Me" pendingText="Generating..." />
					</form>
				)}
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-medium">&nbsp;</h2>
					{(meeting.transcript && meeting.transcript.length > 0) && (
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
					<div className="border rounded p-3 min-h-[100px] whitespace-pre-wrap bg-half-white">No summary yet.</div>
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


