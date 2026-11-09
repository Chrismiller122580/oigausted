'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import TurnstileWidget from '@/components/security/TurnstileWidget';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/config')
      .then((r) => r.json())
      .then((data) => {
        setTurnstileEnabled(!!data.turnstileEnabled);
        setTurnstileSiteKey(data.turnstileSiteKey ?? null);
      })
      .catch(() => setTurnstileEnabled(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Ingrese su correo electrónico');
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      toast.error('Complete la verificación anti-bot antes de continuar.');
      return;
    }

    setSubmitted(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = await res.json();

      if (data.devToken) {
        toast.success('Modo desarrollo: token generado. Revise la respuesta o la consola.');
        console.log('[DEV] Use this token to reset:', data.devToken);
      } else {
        toast.success('Si la cuenta existe, enviamos las instrucciones (o contacte soporte).');
      }
    } catch {
      toast.success('Solicitud recibida. Si necesita ayuda inmediata, contacte a soporte.');
    }
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
          <CardTitle className="text-3xl font-bold">¿Olvidó su contraseña?</CardTitle>
          <p className="text-gray-600 mt-2">
            No se preocupe. Ingrese su correo y le enviaremos las instrucciones para restablecerla.
          </p>
        </CardHeader>

        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Correo electrónico</label>
                <Input
                  type="email"
                  placeholder="usted@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

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
                className="w-full py-6 text-lg bg-orange-600 hover:bg-orange-700"
                disabled={turnstileEnabled && !turnstileToken}
              >
                Enviar instrucciones
              </Button>

              <div className="text-center text-sm text-gray-500">
                ¿Recuerda su contraseña?{' '}
                <Link href="/login" className="text-orange-600 hover:underline">
                  Volver a iniciar sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Revise su correo</h3>
              <p className="text-gray-600 mb-6">
                Si existe una cuenta con <strong>{email}</strong>, recibirá las instrucciones para restablecer su contraseña en breve.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Volver a iniciar sesión
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t text-xs text-center text-gray-500">
            El restablecimiento por correo está en beta. Para ayuda inmediata, escriba a support@oigagig.com.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
