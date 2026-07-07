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
  { href: '/analytics', label: 'Overview', icon: Home },
  { href: '/analytics/analytics', label: 'Analytics', icon: Activity },
  { href: '/analytics/reports', label: 'Reports', icon: BarChart3 },
  { href: '/analytics/marketing', label: 'Marketing Insights', icon: Megaphone },
];

/** Routes analytics staff must not access (redirect to overview). */
export const ANALYTICS_BLOCKED_ROUTES = [
  '/analytics/users',
  '/analytics/settings',
  '/analytics/payouts',
  '/analytics/earnings',
] as const;