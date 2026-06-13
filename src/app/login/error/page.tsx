'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const errorMessages: Record<string, string> = {
  OAuthSignin: 'There was a problem signing in with Google. This often happens in development environments with changing URLs.',
  OAuthCallback: 'There was a problem with the Google sign-in callback.',
  OAuthCreateAccount: 'Could not create an account with Google.',
  EmailCreateAccount: 'Could not create an account with this email.',
  Callback: 'There was a problem during the sign-in process.',
  OAuthAccountNotLinked: 'This email is already associated with another account.',
  EmailSignin: 'The email could not be sent.',
  CredentialsSignin: 'Invalid email or password.',
  SessionRequired: 'You must be signed in to access this page.',
  Default: 'An unexpected error occurred during sign-in.',
};

function AuthErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Sign-in Error</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">{message}</p>

          {error === 'OAuthSignin' && (
            <div className="text-sm text-gray-500 space-y-2">
              <p>
                Google sign-in failed. This commonly happens in temporary development environments 
                (e.g. GitHub Codespaces) because the redirect URI changes on every restart.
              </p>
              <p className="font-medium">
                For production: Make sure your production domain is added to the authorized redirect URIs 
                in Google Cloud Console.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <Button asChild className="w-full" variant="default">
              <Link href="/login">Try signing in again</Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go to homepage</Link>
            </Button>
          </div>

          <p className="text-xs text-gray-400 pt-4">
            Error code: {error}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Suspense wrapper for useSearchParams (error code from URL) - fixes prod load errors
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <AuthErrorClient />
    </Suspense>
  );
}
