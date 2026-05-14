'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleDemoLogin = (role: 'buyer' | 'seller') => {
    const email = role === 'buyer' ? 'buyer@demo.com' : 'seller@demo.com';
    signIn('credentials', { 
      email, 
      callbackUrl: role === 'buyer' ? '/buyer' : '/seller' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Bienvenido a Oiga Usted</CardTitle>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Login */}
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full py-6 text-base flex items-center gap-3 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
          >
            <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                 alt="Google" className="w-5 h-5" />
            Continuar con Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">O usa cuenta demo</span>
            </div>
          </div>

          {/* Demo Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline"
              onClick={() => handleDemoLogin('buyer')}
              className="py-6"
            >
              Entrar como Comprador
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleDemoLogin('seller')}
              className="py-6"
            >
              Entrar como Vendedor
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Usa las cuentas demo para probar la plataforma
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
