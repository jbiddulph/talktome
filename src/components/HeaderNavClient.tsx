"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HeaderNavClient() {
	const pathname = usePathname();
	const onMeeting = pathname?.startsWith('/meetings/');

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
		<nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
			<Link className="btn-ghost" href="/">Home</Link>
			{onMeeting && (
				<>
					<Link className="btn-ghost" href="/">Back</Link>
					<button onClick={addToCalendar} className="btn-ghost">+ Calendar</button>
				</>
			)}
		</nav>
	);
}


