"use client";
import { useFormStatus } from 'react-dom';

type Props = { idleText: string; pendingText: string; className?: string };

export default function SubmitButton({ idleText, pendingText, className }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : idleText}
    </button>
  );
}





