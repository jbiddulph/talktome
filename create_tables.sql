-- Create talktome_ prefixed tables in Supabase PostgreSQL
-- Run this SQL in your Supabase SQL Editor

-- Create talktome_folders table
CREATE TABLE IF NOT EXISTS "public"."talktome_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "talktome_folders_pkey" PRIMARY KEY ("id")
);

-- Create talktome_meetings table
CREATE TABLE IF NOT EXISTS "public"."talktome_meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "talktome_meetings_pkey" PRIMARY KEY ("id")
);

-- Create talktome_transcript_chunks table
CREATE TABLE IF NOT EXISTS "public"."talktome_transcript_chunks" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talktome_transcript_chunks_pkey" PRIMARY KEY ("id")
);

-- Create talktome_transcript_edits table
CREATE TABLE IF NOT EXISTS "public"."talktome_transcript_edits" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "editedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talktome_transcript_edits_pkey" PRIMARY KEY ("id")
);

-- Create talktome_bookmarks table
CREATE TABLE IF NOT EXISTS "public"."talktome_bookmarks" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talktome_bookmarks_pkey" PRIMARY KEY ("id")
);

-- Create talktome_import_jobs table
CREATE TABLE IF NOT EXISTS "public"."talktome_import_jobs" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filePath" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "talktome_import_jobs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."talktome_meetings" ADD CONSTRAINT "talktome_meetings_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."talktome_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_transcript_chunks" ADD CONSTRAINT "talktome_transcript_chunks_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_transcript_edits" ADD CONSTRAINT "talktome_transcript_edits_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_bookmarks" ADD CONSTRAINT "talktome_bookmarks_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_import_jobs" ADD CONSTRAINT "talktome_import_jobs_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "talktome_meetings_folderId_idx" ON "public"."talktome_meetings"("folderId");
CREATE INDEX IF NOT EXISTS "talktome_transcript_chunks_meetingId_idx" ON "public"."talktome_transcript_chunks"("meetingId");
CREATE INDEX IF NOT EXISTS "talktome_transcript_edits_meetingId_idx" ON "public"."talktome_transcript_edits"("meetingId");
CREATE INDEX IF NOT EXISTS "talktome_bookmarks_meetingId_idx" ON "public"."talktome_bookmarks"("meetingId");
CREATE INDEX IF NOT EXISTS "talktome_import_jobs_meetingId_idx" ON "public"."talktome_import_jobs"("meetingId");
