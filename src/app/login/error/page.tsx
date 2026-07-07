'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const errorMessages: Record<string, string> = {
  OAuthSignin:
    'Hubo un problema al iniciar sesión con Google. Esto suele ocurrir en entornos de desarrollo con URLs temporales.',
  OAuthCallback: 'Hubo un problema con la respuesta de Google al iniciar sesión.',
  OAuthCreateAccount: 'No se pudo crear una cuenta con Google.',
  EmailCreateAccount: 'No se pudo crear una cuenta con este correo.',
  Callback: 'Hubo un problema durante el proceso de inicio de sesión.',
  OAuthAccountNotLinked: 'Este correo ya está asociado a otra cuenta.',
  EmailSignin: 'No se pudo enviar el correo.',
  CredentialsSignin: 'Correo o contraseña incorrectos.',
  SessionRequired: 'Debes iniciar sesión para acceder a esta página.',
  Default: 'Ocurrió un error inesperado al iniciar sesión.',
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
          <CardTitle className="text-2xl font-bold text-gray-900">Error al iniciar sesión</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">{message}</p>

          {error === 'OAuthSignin' && (
            <div className="text-sm text-gray-500 space-y-2">
              <p>
                El inicio de sesión con Google falló. Esto es común en entornos temporales de
                desarrollo (por ejemplo, GitHub Codespaces) porque la URL de redirección cambia al
                reiniciar.
              </p>
              <p className="font-medium">
                En producción: asegúrate de que tu dominio esté en las URIs de redirección
                autorizadas en Google Cloud Console.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <Button asChild className="w-full" variant="default">
              <Link href="/login">Intentar de nuevo</Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/">Ir al inicio</Link>
            </Button>
          </div>

          <p className="text-xs text-gray-400 pt-4">Código de error: {error}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando…</p>
          </div>
        </div>
      }
    >
      <AuthErrorClient />
    </Suspense>
  );
}