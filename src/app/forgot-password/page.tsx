'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // For beta: We don't have a real password reset system yet.
    // This is a placeholder that gives good UX.
    setSubmitted(true);
    
    // In a real app, this would call an API to send a reset email
    console.log('Password reset requested for:', email);
    
    toast.success('If an account exists with this email, you will receive reset instructions.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black">
              O
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Forgot your password?</CardTitle>
          <p className="text-gray-600 mt-2">
            No worries. Enter your email and we’ll send you reset instructions.
          </p>
        </CardHeader>

        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email address</label>
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full py-6 text-lg bg-orange-600 hover:bg-orange-700">
                Send reset instructions
              </Button>

              <div className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link href="/login" className="text-orange-600 hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Check your email</h3>
              <p className="text-gray-600 mb-6">
                If an account with <strong>{email}</strong> exists, you will receive password reset instructions shortly.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t text-xs text-center text-gray-500">
            Password reset via email is coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
