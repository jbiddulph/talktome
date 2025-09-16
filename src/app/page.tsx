import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PlusIcon, FolderIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ClientTime from '@/components/ClientTime';
import ConfirmButton from '@/components/ConfirmButton';

export default async function Home() {
  const [folders, meetings] = await Promise.all([
    prisma.folder.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.meeting.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

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
    <main className="container space-y-6">
      <div className="glass p-5">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FolderIcon className="h-6 w-6 text-blue-600" /> TalkToMe
        </h1>
        <p className="opacity-90">Capture, transcribe, and summarize meetings.</p>
      </div>

      <section className="space-y-2 glass p-4" style={{ borderRadius: 12 }}>
        <h2 className="text-xl font-medium">Folders</h2>
        <form action={createFolder} className="flex gap-2">
          <input name="name" placeholder="New folder name" className="border rounded px-3 py-3 flex-1" />
          <button className="btn-primary inline-flex items-center gap-1 tap-target">
            <PlusIcon className="h-5 w-5" /> Add
          </button>
        </form>
        <ul className="divide-y border rounded">
          {folders.map((f) => (
            <li key={f.id} className="p-3 flex items-center justify-between gap-3">
              <span className="font-medium">{f.name}</span>
              <div className="flex items-center gap-2">
                <details>
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
                  <ConfirmButton confirmText="Delete this folder and all meetings?" className="text-red-700 inline-flex items-center gap-1"><TrashIcon className="h-4 w-4" /> Delete</ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 glass p-4" style={{ borderRadius: 12 }}>
        <h2 className="text-xl font-medium">Meetings</h2>
        <form action={createMeeting} className="flex gap-2">
          <input name="title" placeholder="New meeting title" className="border rounded px-3 py-3 flex-1" />
          <select name="folderId" className="border rounded px-3 py-3">
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button className="btn-primary inline-flex items-center gap-1 tap-target"><PlusIcon className="h-5 w-5" /> Create</button>
        </form>
        <ul className="divide-y border rounded">
          {meetings.map((m) => (
            <li key={m.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-sm text-gray-500"><ClientTime iso={m.createdAt as unknown as string} /></p>
                </div>
                <div className="flex items-center gap-3">
                  <Link className="text-blue-600" href={`/meetings/${m.id}`}>Open</Link>
                  <details>
                    <summary className="cursor-pointer text-sm text-gray-700 inline-flex items-center gap-1"><PencilIcon className="h-4 w-4" /> Edit</summary>
                    <form action={updateMeeting} className="mt-2 flex flex-wrap gap-2 items-center">
                      <input type="hidden" name="id" value={m.id} />
                      <input name="title" defaultValue={m.title} className="border rounded px-2 py-1" />
                      <select name="folderId" defaultValue={m.folderId ?? ''} className="border rounded px-2 py-1">
                        <option value="">No folder</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <button className="btn-ghost">Save</button>
                    </form>
                  </details>
                  <form action={deleteMeeting}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmButton confirmText="Delete this meeting?" className="text-red-700 inline-flex items-center gap-1"><TrashIcon className="h-4 w-4" /> Delete</ConfirmButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
