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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password. Please try again or use one of the demo accounts below.');
      setIsLoading(false);
      return;
    }

    // Successful login - redirect to callbackUrl or home
    const session = await getSession();
    if (session?.user) {
      router.replace(callbackUrl);
    } else {
      router.replace('/');
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = () => {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';
    signIn('google', { callbackUrl });
  };

  const quickDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setError('');

    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';

    const result = await signIn('credentials', {
      email: demoEmail,
      password: 'demo1234',
      redirect: false,
    });

    if (result?.error) {
      setError('Demo login failed. Please try the manual form or contact support.');
      setIsLoading(false);
      return;
    }

    const session = await getSession();
    if (session?.user) {
      router.replace(callbackUrl);
    } else {
      router.replace('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black">
              O
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to <span className="text-orange-600">OigaUsted</span>
          </CardTitle>
          <p className="text-gray-600 mt-2">Connect with local talent in Colombia</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email address</Label>
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
              <Label htmlFor="password">Password</Label>
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
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <p className="text-[10px] text-center text-gray-400 -mt-1">
              Demo accounts use password: <strong>demo1234</strong>
            </p>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
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

            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-orange-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center text-sm text-gray-500 mb-3 font-medium">Or jump in instantly with a demo account</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full py-5 text-sm border-orange-200 hover:bg-orange-50"
                disabled={isLoading}
                onClick={() => quickDemoLogin('buyer@demo.com')}
              >
                Login as <strong className="ml-1">Buyer</strong>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full py-5 text-sm border-orange-200 hover:bg-orange-50"
                disabled={isLoading}
                onClick={() => quickDemoLogin('seller@demo.com')}
              >
                Login as <strong className="ml-1">Seller</strong>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full py-5 text-sm border-orange-200 hover:bg-orange-50"
                disabled={isLoading}
                onClick={() => quickDemoLogin('admin@demo.com')}
              >
                Login as <strong className="ml-1">Admin</strong>
              </Button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">Password for demos: demo1234</p>
          </div>

          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">OR</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full py-6 text-base"
          >
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-gray-600 mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-orange-600 hover:underline">
              Sign up for free
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

