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
import { toast } from 'react-hot-toast';
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const router = useRouter();

  // Handle NextAuth error redirects (e.g. ?error=OAuthSignin)
  useEffect(() => {
    const urlError = new URLSearchParams(window.location.search).get('error');
    if (urlError) {
      const friendlyMessage = 
        urlError === 'OAuthSignin' 
          ? 'Google sign-in failed. This is common in temporary dev environments (changing URLs). Try the email/password form instead.'
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
      .then(data => setGoogleEnabled(data.googleEnabled ?? false))
      .catch(() => setGoogleEnabled(false));
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

    await signIn('credentials', {
      email,
      password,
      callbackUrl,
    });
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
          <p className="text-sm text-muted-foreground mt-1">Sign in to OigaUsted</p>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-3">Sign in with your account</p>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
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

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-base py-6 mt-2"
              disabled={isLoading}
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
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">or</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full py-5 text-base flex items-center justify-center gap-2"
              >
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
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

          {/* Dev-only helper while testing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-2xl text-sm text-yellow-900">
              <div className="font-semibold mb-2 text-yellow-800">🚀 Dev Testing Accounts (click to login directly)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => signIn('credentials', { 
                    email: 'buyer@demo.com', 
                    password: 'demo1234', 
                    callbackUrl: getAuthCallbackUrl('/buyer') 
                  })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Login as Buyer
                </Button>
                <Button
                  size="sm"
                  onClick={() => signIn('credentials', { 
                    email: 'seller@demo.com', 
                    password: 'demo1234', 
                    callbackUrl: getAuthCallbackUrl('/seller') 
                  })}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Login as Seller
                </Button>
              </div>
              <p className="text-[10px] text-yellow-700 mt-1.5">
                Use the real admin account (<code>oigaustedcolombia@gmail.com</code>) for production/admin access.
              </p>
              <p className="text-[10px] text-yellow-700 mt-2">
                Quick demo accounts for local development only.<br />
                For production/admin use, create a real admin with <code>npm run create-admin</code> (works everywhere against the same DB).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

