export interface ProfileAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  avatar: string | null;
  creci?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  renda_mensal: number | null;
  valor_entrada: number | null;
  address?: ProfileAddress | null;
  created_at: string;
  last_login: string | null;
}

export interface ProfileUpdate {
  name?: string;
  creci?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  renda_mensal?: number | null;
  valor_entrada?: number | null;
  address?: ProfileAddress | null;
}
