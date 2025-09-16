-- Create talktome_ prefixed tables in Supabase PostgreSQL
-- Run this SQL in your Supabase SQL Editor

-- Create talktome_folders table
CREATE TABLE IF NOT EXISTS "public"."talktome_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "talktome_folders_pkey" PRIMARY KEY ("id")
);

-- Create talktome_meetings table
CREATE TABLE IF NOT EXISTS "public"."talktome_meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "folder_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "talktome_meetings_pkey" PRIMARY KEY ("id")
);

-- Create talktome_transcript_chunks table
CREATE TABLE IF NOT EXISTS "public"."talktome_transcript_chunks" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "start_time" DOUBLE PRECISION NOT NULL,
    "end_time" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talktome_transcript_chunks_pkey" PRIMARY KEY ("id")
);

-- Create talktome_transcript_edits table
CREATE TABLE IF NOT EXISTS "public"."talktome_transcript_edits" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "edited_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talktome_transcript_edits_pkey" PRIMARY KEY ("id")
);

-- Create talktome_bookmarks table
CREATE TABLE IF NOT EXISTS "public"."talktome_bookmarks" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talktome_bookmarks_pkey" PRIMARY KEY ("id")
);

-- Create talktome_import_jobs table
CREATE TABLE IF NOT EXISTS "public"."talktome_import_jobs" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "file_path" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "talktome_import_jobs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."talktome_meetings" ADD CONSTRAINT "talktome_meetings_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."talktome_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_transcript_chunks" ADD CONSTRAINT "talktome_transcript_chunks_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_transcript_edits" ADD CONSTRAINT "talktome_transcript_edits_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_bookmarks" ADD CONSTRAINT "talktome_bookmarks_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."talktome_import_jobs" ADD CONSTRAINT "talktome_import_jobs_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."talktome_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "talktome_meetings_folder_id_idx" ON "public"."talktome_meetings"("folder_id");
CREATE INDEX IF NOT EXISTS "talktome_transcript_chunks_meeting_id_idx" ON "public"."talktome_transcript_chunks"("meeting_id");
CREATE INDEX IF NOT EXISTS "talktome_transcript_edits_meeting_id_idx" ON "public"."talktome_transcript_edits"("meeting_id");
CREATE INDEX IF NOT EXISTS "talktome_bookmarks_meeting_id_idx" ON "public"."talktome_bookmarks"("meeting_id");
CREATE INDEX IF NOT EXISTS "talktome_import_jobs_meeting_id_idx" ON "public"."talktome_import_jobs"("meeting_id");
