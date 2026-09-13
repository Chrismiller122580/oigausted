import {
  Send, Users, Instagram, Facebook,
  Twitter, MessageCircle, Clock, TrendingUp,
  Lightbulb, Package, ShoppingCart, AlertCircle,
  BookOpen, CreditCard, Star,
} from 'lucide-react';

export interface AudienceUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  businessName: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  emailReachable?: boolean;
}

export type RecipientMode = 'segment' | 'user';

export interface Campaign {
  id: string;
  subject: string;
  segment: string;
  recipientCount: number;
  sentBy: string;
  sentByStaff?: string | null;
  createdAt: string;
}

export interface PlaybookSummary {
  id: string;
  label: string;
  description: string;
  category?: 'acquisition' | 'retention' | 'seller';
  roleFilter?: 'seller' | 'buyer';
  segment: string;
  defaultCta: string;
  defaultCtaUrl: string;
  automatable?: boolean;
  total: number;
  reachable: number;
}

export interface BuyerFunnel {
  totalBuyers: number;
  noOrders: number;
  onePlusOrders: number;
  repeatBuyers: number;
}

export const PLAYBOOK_ICONS: Record<string, typeof Package> = {
  'buyers-new-signup': Users,
  'buyers-no-orders': ShoppingCart,
  'buyers-abandoned-checkout': CreditCard,
  'buyers-one-order-lapsed': Clock,
  'buyers-repeat-active': TrendingUp,
  'buyers-no-active-orders': Users,
  'buyers-pending-review': Star,
  'sellers-get-buyers-toolkit': Lightbulb,
  'sellers-no-gigs': Package,
  'sellers-new-no-gig': BookOpen,
  'sellers-paused-gigs': AlertCircle,
  'sellers-no-payout': CreditCard,
};

export const SELLER_QUICK_GOAL = {
  goal: 'Enseñar a vendedores cómo conseguir compradores con todas las herramientas OigaGIG',
  focus: 'both' as const,
};

export const QUICK_GOALS = [
  { goal: 'Adquirir compradores nuevos registrados sin primer pedido', focus: 'acquisition' as const },
  { goal: 'Convertir compradores registrados a su primer pedido', focus: 'acquisition' as const },
  { goal: 'Reactivar compradores con 1 pedido que no vuelven a comprar', focus: 'retention' as const },
  { goal: 'Impulsar segunda compra en compradores activos', focus: 'retention' as const },
  { goal: 'Campaña nacional: confianza y reseñas en todo Colombia', focus: 'both' as const },
  { goal: 'Recuperar checkouts abandonados en los últimos 7 días', focus: 'acquisition' as const },
];

export const CHANNEL_OPTIONS = [
  { key: 'email', label: 'Email + In-app', icon: Send },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook Ads', icon: Facebook },
  { key: 'x', label: 'X / Twitter', icon: Twitter },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

export const TONES = ['cercano y confiable', 'profesional', 'urgente pero honesto', 'amigable y local', 'inspirador', 'directo y claro'];

export const SEGMENTS = [
  { value: 'all', label: 'Todos los usuarios activos' },
  { value: 'buyers', label: 'Solo compradores' },
  { value: 'sellers', label: 'Solo vendedores' },
  { value: 'active', label: 'Activos últimos 30 días' },
  { value: 'inactive', label: 'Cuentas inactivas' },
];
