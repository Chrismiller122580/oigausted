'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirigiendo a tu perfil...</p>
    </div>
  );
}
