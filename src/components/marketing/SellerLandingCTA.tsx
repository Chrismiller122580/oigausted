import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { brandButtonClass } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export type SellerLandingUserState = 'guest' | 'buyer' | 'seller' | 'admin';

interface SellerLandingCTAProps {
  userState: SellerLandingUserState;
  className?: string;
}

export function SellerLandingCTA({ userState, className }: SellerLandingCTAProps) {
  if (userState === 'seller' || userState === 'admin') {
    return (
      <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
        <Button asChild size="lg" className={cn(brandButtonClass, 'font-semibold h-12 px-8 rounded-xl')}>
          <Link href="/create-gig">Publicar mi servicio</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold">
          <Link href={userState === 'admin' ? '/admin' : '/seller'}>
            {userState === 'admin' ? 'Ir al panel admin' : 'Ir a mi panel'}
          </Link>
        </Button>
      </div>
    );
  }

  if (userState === 'buyer') {
    return (
      <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
        <Button asChild size="lg" className={cn(brandButtonClass, 'font-semibold h-12 px-8 rounded-xl')}>
          <Link href="/profile">Activar perfil de vendedor</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold">
          <Link href="/gigs">Explorar como comprador</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
      <Button asChild size="lg" className={cn(brandButtonClass, 'font-semibold h-12 px-8 rounded-xl')}>
        <Link href="/signup?role=seller">Registrarme como vendedor</Link>
      </Button>
      <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold">
        <Link href="/login?callbackUrl=%2Fseller">Ya tengo cuenta</Link>
      </Button>
    </div>
  );
}