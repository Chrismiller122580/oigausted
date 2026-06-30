import {
  Home,
  Users,
  List,
  Package,
  Megaphone,
  DollarSign,
  MessageCircle,
  Bell,
  type LucideIcon,
} from 'lucide-react';

export type AdminAssistantNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Sidebar / mobile nav for the admin-assistant panel. */
export const ADMIN_ASSISTANT_NAV_ITEMS: AdminAssistantNavItem[] = [
  { href: '/admin-assistant', label: 'Overview', icon: Home },
  { href: '/admin-assistant/users', label: 'Users (View)', icon: Users },
  { href: '/admin-assistant/orders', label: 'Orders (View)', icon: List },
  { href: '/admin-assistant/gigs', label: 'Gigs (View)', icon: Package },
  { href: '/admin-assistant/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin-assistant/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/admin-assistant/support', label: 'Support', icon: MessageCircle },
  { href: '/admin-assistant/notifications', label: 'Notifications', icon: Bell },
];

/** Routes admin assistants must not access (redirect to overview). */
export const ADMIN_ASSISTANT_BLOCKED_ROUTES = [
  '/admin-assistant/categories',
  '/admin-assistant/settings',
  '/admin-assistant/analytics',
  '/admin-assistant/earnings',
] as const;