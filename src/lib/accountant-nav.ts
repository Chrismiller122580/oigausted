import {
  Home,
  DollarSign,
  Receipt,
  TrendingUp,
  FileText,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Users,
  Settings,
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
  { href: '/accountant/analytics', label: 'Finance Analytics', icon: BarChart3, wired: true },
  { href: '/accountant/payroll', label: 'Payroll', icon: Receipt, wired: false },
  { href: '/accountant/invoices', label: 'Invoices & Billing', icon: FileText, wired: false },
  { href: '/accountant/transactions', label: 'Transactions', icon: BarChart3, wired: false },
  { href: '/accountant/tax', label: 'Tax Documents', icon: ShieldCheck, wired: false },
  { href: '/accountant/disputes', label: 'Payment Disputes', icon: AlertCircle, wired: false },
  { href: '/accountant/settings', label: 'Accounting Settings', icon: Settings, wired: false },
];