import {
  Home,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Users,
  Settings,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react';

export type AccountantNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  wired: boolean;
};

/** Sidebar / mobile nav for the accountant finance panel. */
export const ACCOUNTANT_NAV_ITEMS: AccountantNavItem[] = [
  { href: '/accountant', label: 'Overview', icon: Home, wired: true },
  { href: '/accountant/payouts', label: 'Payouts', icon: DollarSign, wired: true },
  { href: '/accountant/earnings', label: 'Earnings & Reports', icon: TrendingUp, wired: true },
  { href: '/accountant/users-finance', label: 'Seller Payouts', icon: Users, wired: true },
  { href: '/accountant/transactions', label: 'Transactions', icon: ArrowLeftRight, wired: true },
  { href: '/accountant/tax', label: 'Tax Documents', icon: ShieldCheck, wired: true },
  { href: '/accountant/disputes', label: 'Payment Disputes', icon: AlertCircle, wired: true },
  { href: '/accountant/settings', label: 'Accounting Settings', icon: Settings, wired: true },
];