"use client";
import { useState } from 'react';
import Link from 'next/link';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import ClientTime from './ClientTime';

type FolderLite = { id: string; name: string };
type MeetingLite = { id: string; title: string; folderId: string | null; createdAt: Date; folder?: { name: string } | null };

type Props = {
  folders: FolderLite[];
  meetings: MeetingLite[];
  createFolder: (formData: FormData) => void;
  createMeeting: (formData: FormData) => void;
};

export default function HomeClient({ folders, meetings, createFolder, createMeeting }: Props) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Create a map of folder names for quick lookup
  const folderMap = new Map(folders.map(f => [f.id, f.name]));

  // Function to truncate long titles
  const truncateTitle = (title: string, maxLength: number = 23) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Filter meetings based on selected folder
  const filteredMeetings = selectedFolderId 
    ? meetings.filter(m => m.folderId === selectedFolderId)
    : meetings;

  // Get the selected folder name for display
  const selectedFolderName = selectedFolderId ? folderMap.get(selectedFolderId) : null;

  return (
    <main>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Folders: ~20% on desktop */}
        <section className="space-y-2 glass p-4 md:col-span-1" style={{ borderRadius: 12 }}>
          <h2 className="text-xl font-medium">Folders</h2>
          <form action={createFolder} className="flex gap-2 text-sm">
            <input name="name" placeholder="New folder name" className="rounded px-2 py-2 flex-1" style={{ border: '2px solid rgba(255,255,255,0.6)', borderRadius: 8 }} />
            <button className="btn-primary inline-flex items-center gap-1 tap-target">
              <PlusIcon className="h-5 w-5" />
            </button>
          </form>
          <ul className="divide-y">
            {folders.map((f) => (
              <li key={f.id} className="p-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
                <button
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`cursor-pointer font-medium text-left flex-1 p-2 rounded transition-colors ${
                    selectedFolderId === f.id 
                      ? 'bg-[#8a5df6] text-white' 
                      : 'hover:bg-white/20'
                  }`}
                >
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Recordings: ~80% on desktop */}
        <section className="space-y-3 glass p-4 md:col-span-4" style={{ borderRadius: 12 }}>
          <div className="mb-2">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              TalkToMe
            </h1>
            <p className="opacity-90">Capture, transcribe, and summarize.</p>
          </div>
          
          {/* Filter status and clear button */}
          {selectedFolderName && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">
                Showing recordings in: <strong>{selectedFolderName}</strong>
              </span>
              <button
                onClick={() => setSelectedFolderId(null)}
                className="btn-ghost inline-flex items-center gap-1 text-xs px-2 py-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear filter
              </button>
            </div>
          )}

          <h2 className="text-xl font-medium">To get started, add a title, select a folder and click Create.</h2>
          <form action={createMeeting} className="flex gap-2">
            <input name="title" placeholder="New TalkToMe title" maxLength={100} className="border-primaryrounded px-3 py-3 flex-1" style={{ border: '3px solid rgba(255,255,255,0.6)', borderRadius: 8 }} />
            <select name="folderId" className="rounded px-3 py-3" style={{ border: '3px solid rgba(255,255,255,0.6)', borderRadius: 8 }}>
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button className="btn-primary inline-flex items-center gap-1 tap-target"><PlusIcon className="h-5 w-5" /> Create</button>
          </form>
          
          <ul id="recordings" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredMeetings.map((m) => (
              <li key={m.id} className="group">
                <Link href={`/talktome/${m.id}`} className="btn-primary block border rounded p-3 space-y-2 bg-white/60 backdrop-blur-sm hover:shadow-sm transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium" title={m.title}>{truncateTitle(m.title)}</p>
                      <p className="text-sm text-gray-300"><ClientTime iso={m.createdAt as unknown as string} /></p>
                      {m.folderId && (
                        <p className="text-xs text-gray-800 font-medium mt-1">
                          📁 {folderMap.get(m.folderId)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          
          {filteredMeetings.length === 0 && selectedFolderName && (
            <div className="text-center py-8 text-gray-500">
              No recordings found in &quot;{selectedFolderName}&quot; folder.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
