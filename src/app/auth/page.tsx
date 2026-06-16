import { Suspense } from 'react';
import { isSupabaseAuthEnabled } from '@/lib/app-mode';
import AuthPageClient from './auth-page-client';

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageClient supabaseAuth={isSupabaseAuthEnabled()} />
    </Suspense>
  );
}