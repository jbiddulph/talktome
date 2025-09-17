import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PlusIcon, FolderIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ClientTime from '@/components/ClientTime';
import ConfirmButton from '@/components/ConfirmButton';

type FolderLite = { id: string; name: string };
type MeetingLite = { id: string; title: string; folderId: string | null; createdAt: Date };

export default async function Home() {
  const [folders, meetings] = (await Promise.all([
    prisma.folder.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.meeting.findMany({ orderBy: { createdAt: 'desc' } }),
  ])) as [FolderLite[], MeetingLite[]];

  async function createFolder(formData: FormData) {
    'use server';
    const name = String(formData.get('name') ?? '').trim();
    if (!name) return;
    await prisma.folder.create({ data: { name } });
    revalidatePath('/');
    redirect('/');
  }

  async function createMeeting(formData: FormData) {
    'use server';
    const title = String(formData.get('title') ?? 'Untitled Meeting');
    const folderId = String(formData.get('folderId') ?? '');
    await prisma.meeting.create({ data: { title, folderId: folderId || null } });
    revalidatePath('/');
    redirect('/');
  }

  async function updateFolder(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    if (!id || !name) return;
    await prisma.folder.update({ where: { id }, data: { name } });
    revalidatePath('/');
    redirect('/');
  }

  async function deleteFolder(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    if (!id) return;
    await prisma.folder.delete({ where: { id } });
    revalidatePath('/');
    redirect('/');
  }

  async function updateMeeting(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const title = String(formData.get('title') ?? '').trim();
    const folderId = String(formData.get('folderId') ?? '');
    if (!id || !title) return;
    await prisma.meeting.update({ where: { id }, data: { title, folderId: folderId || null } });
    revalidatePath('/');
    redirect('/');
  }

  async function deleteMeeting(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    if (!id) return;
    await prisma.meeting.delete({ where: { id } });
    revalidatePath('/');
    redirect('/');
  }

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
              <span className="font-medium">{f.name}</span>
              <div className="flex items-center gap-2">
                {/* <details>
                  <summary className="cursor-pointer text-sm text-gray-700 inline-flex items-center gap-1">
                    <PencilIcon className="h-4 w-4" /> Edit
                  </summary>
                  <form action={updateFolder} className="mt-2 flex gap-2">
                    <input type="hidden" name="id" value={f.id} />
                    <input name="name" defaultValue={f.name} className="border rounded px-2 py-1" />
                    <button className="btn-ghost">Save</button>
                  </form>
                </details>
                <form action={deleteFolder}>
                  <input type="hidden" name="id" value={f.id} />
                  <ConfirmButton confirmText="Delete this folder and all recordings?" className="text-red-700 inline-flex items-center gap-1"><TrashIcon className="h-4 w-4" /> Delete</ConfirmButton>
                </form> */}
              </div>
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
          <h2 className="text-xl font-medium">To get started, add a title, select a folder and click Create.</h2>
        <form action={createMeeting} className="flex gap-2">
          <input name="title" placeholder="New recording title" className="border-primaryrounded px-3 py-3 flex-1" style={{ border: '3px solid rgba(255,255,255,0.6)', borderRadius: 8 }} />
          <select name="folderId" className="rounded px-3 py-3" style={{ border: '3px solid rgba(255,255,255,0.6)', borderRadius: 8 }}>
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button className="btn-primary inline-flex items-center gap-1 tap-target"><PlusIcon className="h-5 w-5" /> Create</button>
        </form>
        <ul id="recordings" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {meetings.map((m) => (
            <li key={m.id} className="group">
              <Link href={`/meetings/${m.id}`} className="btn-primary block border rounded p-3 space-y-2 bg-white/60 backdrop-blur-sm hover:shadow-sm transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-gray-300"><ClientTime iso={m.createdAt as unknown as string} /></p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        </section>
      </div>
    </main>
  );
}
