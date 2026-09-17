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
  { href: '/admin-assistant', label: 'Resumen', icon: Home },
  { href: '/admin-assistant/users', label: 'Usuarios (consulta)', icon: Users },
  { href: '/admin-assistant/orders', label: 'Pedidos (consulta)', icon: List },
  { href: '/admin-assistant/gigs', label: 'Servicios (consulta)', icon: Package },
  { href: '/admin-assistant/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin-assistant/payouts', label: 'Pagos (consulta)', icon: DollarSign },
  { href: '/admin-assistant/support', label: 'Soporte', icon: MessageCircle },
  { href: '/admin-assistant/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/admin-assistant/notifications', label: 'Notificaciones', icon: Bell },
];

/** Routes admin assistants must not access (redirect to overview). */
export const ADMIN_ASSISTANT_BLOCKED_ROUTES = [
  '/admin-assistant/categories',
  '/admin-assistant/settings',
  '/admin-assistant/analytics',
  '/admin-assistant/earnings',
] as const;
