# TalkToMe

AI meeting note taker using Next.js + Capacitor (iOS), Prisma (SQLite), and OpenAI.

## Setup

1. Install Node 20+ and Xcode (for iOS).
2. Install deps:

```bash
npm install
```

3. Create `.env`:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Prisma:

```bash
npx prisma migrate dev
npx prisma generate
```

## Dev

```bash
npm run dev
```

- Home page lets you create folders and meetings.
- Meeting page lets you record audio, transcribe (Whisper), and generate AI summary.
- Add to calendar downloads an ICS file for the meeting.

## Build + Capacitor iOS

Next.js static export and sync to iOS:

```bash
npm run build && npm run export
npx cap sync ios
npx cap open ios
```

In Xcode, set signing, then run on device/simulator.
