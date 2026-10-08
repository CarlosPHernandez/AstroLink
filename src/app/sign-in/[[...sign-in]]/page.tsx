import { SignIn } from '@clerk/nextjs';
import { getSafeRedirectPath } from '@/lib/auth-redirect';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = getSafeRedirectPath(params.redirect_url, '/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-md py-xl">
      <SignIn fallbackRedirectUrl={redirectUrl} />
    </div>
  );
}
