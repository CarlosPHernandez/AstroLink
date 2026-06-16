import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4">
      <main className="w-full max-w-md text-center">
        <MaterialIcon name="error_outline" className="text-primary mx-auto mb-4" size={40} />
        <h1 className="font-headline-md text-headline-md font-bold mb-2">Link expired or invalid</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
          This sign-in link may have expired. Request a new confirmation or reset email, or try
          another sign-in method.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center justify-center py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
        >
          Back to sign in
        </Link>
      </main>
    </div>
  );
}