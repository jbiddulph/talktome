"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ClientTime from '@/components/ClientTime';

type MeetingHeader = { title: string; createdAt: string } | null;

export default function HeaderNavClient() {
    const pathname = usePathname();
    const onMeeting = pathname?.startsWith('/meetings/');
    const [meeting, setMeeting] = useState<MeetingHeader>(null);

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                if (!onMeeting) {
                    setMeeting(null);
                    return;
                }
                const id = pathname?.split('/').pop();
                if (!id) return;
                const res = await fetch(`/api/meetings/${id}`, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (!active) return;
                setMeeting({ title: String(data.title ?? ''), createdAt: String(data.createdAt ?? '') });
            } catch {}
        }
        load();
        return () => {
            active = false;
        };
    }, [onMeeting, pathname]);

	async function addToCalendar() {
		try {
			const id = pathname?.split('/').pop();
			if (!id) return;
			const a = document.createElement('a');
			a.href = `/api/meetings/${id}/ics`;
			a.download = '';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} catch {}
	}

    return (
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link className="btn-ghost" href="/">Home</Link>
                {onMeeting && meeting && (
                    <div className="hidden sm:flex items-baseline gap-3">
                        <span className="font-semibold">{meeting.title}</span>
                        <span className="text-xs text-gray-500"><ClientTime iso={meeting.createdAt} /></span>
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {onMeeting && (
                    <>
                        <Link className="btn-ghost" href="/">Back</Link>
                        <button onClick={addToCalendar} className="btn-ghost">+ Calendar</button>
                    </>
                )}
            </div>
        </nav>
    );
}


