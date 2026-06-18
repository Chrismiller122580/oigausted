'use client';

import { useSession } from 'next-auth/react';

type Props = {
  whatsapp?: string | null;
  hasGigs: boolean;
};

export default function SellerProfileMobileBar({ whatsapp, hasGigs }: Props) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const hasAppBottomNav = role === 'seller' || role === 'buyer' || role === 'admin';

  if (!whatsapp && !hasGigs) return null;

  const bottomClass = hasAppBottomNav
    ? 'bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]'
    : 'bottom-0 pb-[env(safe-area-inset-bottom,0px)]';

  return (
    <div
      className={`md:hidden fixed inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-6px_24px_rgba(0,0,0,0.08)] px-4 pt-3 ${bottomClass}`}
    >
      <div className="flex gap-2 max-w-lg mx-auto pb-3">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white font-semibold text-sm h-12 px-3 active:scale-[0.98] !min-w-0"
          >
            💬 WhatsApp
          </a>
        )}
        {hasGigs && (
          <a
            href="#seller-gigs"
            className="flex-1 inline-flex items-center justify-center rounded-2xl bg-orange-600 text-white font-semibold text-sm h-12 px-3 active:scale-[0.98] !min-w-0"
          >
            Ver servicios
          </a>
        )}
      </div>
    </div>
  );
}