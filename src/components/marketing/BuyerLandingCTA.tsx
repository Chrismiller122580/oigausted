import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { brandButtonClass } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export type BuyerLandingUserState = 'guest' | 'buyer' | 'seller' | 'admin';

interface BuyerLandingCTAProps {
  userState: BuyerLandingUserState;
  className?: string;
}

export function BuyerLandingCTA({ userState, className }: BuyerLandingCTAProps) {
  if (userState === 'buyer') {
    return (
      <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
        <Button asChild size="lg" className={cn(brandButtonClass, 'font-semibold h-12 px-8 rounded-xl')}>
          <Link href="/gigs">Buscar servicios</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold">
          <Link href="/buyer">Ir a mi panel</Link>
        </Button>
      </div>
    );
  }

  if (userState === 'seller' || userState === 'admin') {
    return (
      <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
        <Button asChild size="lg" className={cn(brandButtonClass, 'font-semibold h-12 px-8 rounded-xl')}>
          <Link href="/gigs">Buscar servicios</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold">
          <Link href={userState === 'admin' ? '/admin' : '/seller'}>
            {userState === 'admin' ? 'Ir al panel admin' : 'Ir a mi panel de vendedor'}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
      <Button asChild size="lg" className={cn(brandButtonClass, 'font-semibold h-12 px-8 rounded-xl')}>
        <Link href="/signup?role=buyer">Registrarme gratis</Link>
      </Button>
      <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold">
        <Link href="/gigs">Explorar servicios</Link>
      </Button>
    </div>
  );
}