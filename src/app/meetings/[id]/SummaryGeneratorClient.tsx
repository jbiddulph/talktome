"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubmitButton from '@/components/SubmitButton';

type Props = {
  meetingId: string;
  hasTranscript: boolean;
  hasSummary: boolean;
};

export default function SummaryGeneratorClient({ meetingId, hasTranscript, hasSummary }: Props) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  // Show generator if there's a transcript but no summary yet
  useEffect(() => {
    setShowGenerator(hasTranscript && !hasSummary);
  }, [hasTranscript, hasSummary]);

  const handleGenerate = async (formData: FormData) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // Refresh the page to show the new summary
        router.refresh();
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!showGenerator) {
    return null;
  }

  return (
    <form action={handleGenerate} className="flex flex-col gap-2 justify-start mt-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="style" className="text-sm text-white italic">In the style of: </label>
        <select name="style" id="style" className="rounded p-2 text-white" style={{ border: '1px solid rgba(255,255,255,0.5)' }}>
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
          <option>Pirate Captain – Growly and full of &quot;Arrr!&quot;</option>
          <option>Poet – Turns it into a haiku or rhyming couplet.</option>
          <option>Gamer Streamer – Overly excited Twitch energy.</option>
          <option>Motivational Coach – Pep talk style, big on energy.</option>
          <option>Sci-Fi Narrator – Futuristic and dramatic, with starship vibes.</option>
          <option>Gossip Columnist – Sassy and dramatic, spilling &quot;tea&quot;.</option>
        </select>
      </div>
      <input type="hidden" name="meetingId" value={meetingId} />
      <SubmitButton 
        className="btn-primary" 
        idleText="Talk To Me" 
        pendingText="Generating..." 
        disabled={isGenerating}
      />
    </form>
  );
}
