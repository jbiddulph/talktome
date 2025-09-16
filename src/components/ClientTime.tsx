"use client";
import { useMemo } from 'react';

type Props = { iso: string; options?: Intl.DateTimeFormatOptions };

export default function ClientTime({ iso, options }: Props) {
	const text = useMemo(() => {
		try {
			const d = new Date(iso);
			return new Intl.DateTimeFormat(undefined, {
				year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
				hour12: false,
				...options,
			}).format(d);
		} catch {
			return iso;
		}
	}, [iso, options]);

	return <span suppressHydrationWarning>{text}</span>;
}





