'use client';

import { signIn, getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl';
import TurnstileWidget from '@/components/security/TurnstileWidget';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'deactivated') {
      setError('Tu cuenta ha sido desactivada. Contacta a soporte si crees que es un error.');
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  // Handle NextAuth error redirects (e.g. ?error=OAuthSignin)
  useEffect(() => {
    const urlError = new URLSearchParams(window.location.search).get('error');
    if (urlError) {
      const friendlyMessage =
        urlError === 'OAuthSignin'
          ? 'Google sign-in failed. This is common in temporary dev environments (changing URLs). Try the email/password form instead.'
          : urlError === 'CredentialsSignin'
            ? 'Invalid email or password. For local dev use admin@local.dev / AdminLocal123!'
            : 'There was a problem signing in. Please try again.';

      setError(friendlyMessage);

      // Clean the URL
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  // Check if Google OAuth is configured (for production polish)
  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => {
        setGoogleEnabled(data.googleEnabled ?? false);
        setTurnstileEnabled(!!data.turnstileEnabled);
        setTurnstileSiteKey(data.turnstileSiteKey ?? null);
      })
      .catch(() => {
        setGoogleEnabled(false);
        setTurnstileEnabled(false);
      });
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session?.user) {
        router.replace('/');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const fromQuery = new URLSearchParams(window.location.search).get('callbackUrl');
    const callbackUrl = fromQuery || getAuthCallbackUrl('/');

    if (turnstileEnabled && !turnstileToken) {
      setError('Completa la verificación anti-bot antes de continuar.');
      setIsLoading(false);
      return;
    }

    const preLogin = await fetch('/api/auth/pre-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        turnstileToken,
      }),
    });
    const preData = await preLogin.json().catch(() => ({}));
    if (!preLogin.ok) {
      setError(preData.error || 'Demasiados intentos. Espera un momento e intenta de nuevo.');
      setIsLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      callbackUrl,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError(
        result.error === 'CredentialsSignin'
          ? 'Invalid email or password. For local dev use admin@local.dev / AdminLocal123!'
          : 'There was a problem signing in. Please try again.',
      );
      return;
    }

    if (result?.ok) {
      await fetch('/api/auth/record-login', { method: 'POST' }).catch(() => {})
      window.location.assign(callbackUrl);
    }
  };

  const handleGoogleSignIn = async () => {
    const fromQuery = new URLSearchParams(window.location.search).get('callbackUrl');
    const callbackUrl = fromQuery || getAuthCallbackUrl('/');

    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black">
              O
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome back
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Sign in to Oigagig</p>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-3">Sign in with your account</p>
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 px-3 py-2 text-xs text-orange-900 dark:text-orange-200">
                <strong>Local dev:</strong> admin@local.dev / AdminLocal123!
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">
                {error}
              </div>
            )}

            {turnstileEnabled && turnstileSiteKey && (
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                onToken={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            )}

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-base py-6 mt-2"
              disabled={isLoading || (turnstileEnabled && !turnstileToken)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-sm text-orange-600 hover:underline">
              Forgot your password?
            </Link>
          </div>

          {googleEnabled && (
            <>
              <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full py-5 text-base flex items-center justify-center gap-2"
              >
                {/* Inline Google "G" logo SVG — reliable on all platforms including macOS Safari / PWA / no external network dependency */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.34z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            New here?{' '}
            <Link href="/signup" className="font-medium text-orange-600 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

