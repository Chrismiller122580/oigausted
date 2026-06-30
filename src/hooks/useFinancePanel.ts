'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

/** Finance portal context — admin has full powers; accountant manages payouts only. */
export function useFinancePanel() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const onAccountantPortal = pathname.startsWith('/accountant');
  const isAccountant =
    onAccountantPortal || session?.user?.staffRole === 'accountant';
  const isFullAdmin = session?.user?.role === 'admin';

  return {
    isAccountant,
    isFullAdmin,
    canManagePayouts: isFullAdmin || isAccountant,
    canDeleteOrders: isFullAdmin,
  };
}