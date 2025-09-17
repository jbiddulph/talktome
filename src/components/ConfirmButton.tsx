"use client";
import React from 'react';

type Props = { children: React.ReactNode; className?: string; confirmText: string };

export default function ConfirmButton({ children, className, confirmText }: Props) {
	return (
		<button
			type="submit"
			className={className}
			onClick={(e) => {
				if (!confirm(confirmText)) e.preventDefault();
			}}
			style={{ border: '1px solid rgba(255,255,255,0.5)' }}
		>
			{children}
		</button>
	);
}






