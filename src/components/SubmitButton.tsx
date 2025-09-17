"use client";
import { useFormStatus } from 'react-dom';

type Props = { idleText: string; pendingText: string; className?: string; disabled?: boolean };

export default function SubmitButton({ idleText, pendingText, className, disabled }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled}>
      {pending ? pendingText : idleText}
    </button>
  );
}






