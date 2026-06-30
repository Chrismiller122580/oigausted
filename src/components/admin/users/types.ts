export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  staffRole?: string | null;
  businessName?: string | null;
  tagline?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  bio?: string | null;
  nit?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  referralCode?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  rating?: number | null;
  reviewCount?: number;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  lastLoginCity?: string | null;
  lastLoginUserAgent?: string | null;
  customReferralRate?: number | null;
  contactViolationCount?: number;
  contactFlaggedAt?: string | null;
  _count?: {
    gigs: number;
    ordersAsBuyer: number;
    ordersAsSeller: number;
    referrals?: number;
  };
}

export type EditForm = Partial<Omit<User, 'customReferralRate'>> & {
  customReferralRate?: number | null | string;
};