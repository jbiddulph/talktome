import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import HomeClient from '@/components/HomeClient';

type FolderLite = { id: string; name: string };
type MeetingLite = { id: string; title: string; folderId: string | null; createdAt: Date; folder?: { name: string } | null };

export default async function Home() {
  const [folders, meetings] = (await Promise.all([
    prisma.folder.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.meeting.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: { folder: { select: { name: true } } }
    }),
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
    try {
      const title = String(formData.get('title') ?? 'Untitled Meeting');
      const folderId = String(formData.get('folderId') ?? '');
      const meeting = await prisma.meeting.create({ data: { title, folderId: folderId || null } });
      revalidatePath('/');
      redirect(`/talktome/${meeting.id}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
      revalidatePath('/');
      redirect('/');
    }
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

  return <HomeClient folders={folders} meetings={meetings} createFolder={createFolder} createMeeting={createMeeting} />;
}
