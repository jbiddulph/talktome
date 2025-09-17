export const runtime = 'nodejs';

const STYLE_TO_VOICE: Record<string, string> = {
    'Meeting Notes': 'alloy',
    'Rapper – Punchy rhyme or a hype bar.': 'verse',
    'Sports Commentator – Calls it like a thrilling play-by-play moment.': 'verse',
    'Movie Trailer Voice – Over-the-top and cinematic.': 'alloy',
    'News Anchor – Formal, and breaking-news style.': 'alloy',
    'Stand-Up Comedian – Twists it into a witty punchline.': 'shimmer',
    'Shakespearean Bard – Flowery, old-English phrasing.': 'verse',
    'Fairy Tale Narrator – Whimsical and magical.': 'shimmer',
    'Conspiracy Theorist – Paranoid and full of hidden meanings.': 'alloy',
    'Tech Support Agent – Dry and procedural.': 'alloy',
    'Pet Blogger – As if your dog or cat is gossiping about you.': 'shimmer',
    'Cooking Show Host – Ingredients and steps as a recipe.': 'shimmer',
    'Pirate Captain – Growly and full of “Arrr!”': 'verse',
    'Poet – Turns it into a haiku or rhyming couplet.': 'verse',
    'Gamer Streamer – Overly excited Twitch energy.': 'verse',
    'Motivational Coach – Pep talk style, big on energy.': 'alloy',
    'Sci-Fi Narrator – Futuristic and dramatic, with starship vibes.': 'verse',
    'Gossip Columnist – Sassy and dramatic, spilling “tea”.': 'shimmer',
};

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
        if (!apiKey) return new Response('OPENAI_API_KEY not set', { status: 500 });

        const { text, style } = (await req.json()) as { text?: string; style?: string };
        const content = String(text ?? '').trim();
        if (!content) return new Response('No text provided', { status: 400 });

        const voice = STYLE_TO_VOICE[style ?? ''] ?? 'alloy';

        // Some stylistic hinting – TTS models primarily change voice; wording helps a little
        const preface = style && style.trim().length > 0 ? `Read the following in the style of ${style}:\n\n` : '';
        const input = preface + content;

        const res = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini-tts',
                voice,
                input,
                format: 'mp3',
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            return new Response(`TTS failed: ${body}`, { status: 500 });
        }

        const arrayBuffer = await res.arrayBuffer();
        return new Response(Buffer.from(arrayBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-store',
            },
        });
    } catch (err) {
        return new Response('TTS error', { status: 500 });
    }
}


