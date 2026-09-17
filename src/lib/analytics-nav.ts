import {
  Home,
  Activity,
  BarChart3,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';

export type AnalyticsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Sidebar / mobile nav for the analytics insights panel. */
export const ANALYTICS_NAV_ITEMS: AnalyticsNavItem[] = [
  { href: '/analytics', label: 'Resumen', icon: Home },
  { href: '/analytics/analytics', label: 'Analítica', icon: Activity },
  { href: '/analytics/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/analytics/marketing', label: 'Insights de marketing', icon: Megaphone },
];

/** Routes analytics staff must not access (redirect to overview). */
export const ANALYTICS_BLOCKED_ROUTES = [
  '/analytics/users',
  '/analytics/settings',
  '/analytics/payouts',
  '/analytics/earnings',
] as const;
