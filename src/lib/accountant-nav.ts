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
  { href: '/accountant', label: 'Resumen', icon: Home, wired: true },
  { href: '/accountant/payouts', label: 'Pagos', icon: DollarSign, wired: true },
  { href: '/accountant/earnings', label: 'Ganancias y reportes', icon: TrendingUp, wired: true },
  { href: '/accountant/users-finance', label: 'Pagos a vendedores', icon: Users, wired: true },
  { href: '/accountant/transactions', label: 'Transacciones', icon: ArrowLeftRight, wired: true },
  { href: '/accountant/tax', label: 'Documentos tributarios', icon: ShieldCheck, wired: true },
  { href: '/accountant/disputes', label: 'Disputas de pago', icon: AlertCircle, wired: true },
  { href: '/accountant/settings', label: 'Ajustes contables', icon: Settings, wired: true },
];
