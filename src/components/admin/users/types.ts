export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  staffRole?: string | null;
  businessName?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  bio?: string | null;
  nit?: string | null;
  isActive?: boolean;
  createdAt: string;
  customReferralRate?: number | null;
  contactViolationCount?: number;
  contactFlaggedAt?: string | null;
  _count?: {
    gigs: number;
    ordersAsBuyer: number;
    ordersAsSeller: number;
  };
}

export type EditForm = Partial<Omit<User, 'customReferralRate'>> & {
  customReferralRate?: number | null | string;
};