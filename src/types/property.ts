/** Valores do enum property_type da API */
export const PROPERTY_TYPE_VALUES = [
  "CASA",
  "APARTAMENTO",
  "COMERCIAL",
  "RURAL",
  "TERRENO",
] as const;

/** Valores do enum status da API */
export const STATUS_VALUES = ["RASCUNHO", "DISPONIVEL", "VENDIDO"] as const;

export interface PropertyAddress {
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

export interface PropertyCreate {
  title: string;
  description?: string;
  property_type?: string;
  price: number;
  area: number;
  bedrooms?: number;
  status?: string;
  address: PropertyAddress;
}

export interface PropertyImage {
  id?: string;
  url?: string;
  image_url?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface Property {
  id: string;
  title: string;
  property_type?: string;
  price?: number;
  status?: string;
  description?: string;
  area?: number;
  bedrooms?: number;
  image_url?: string;
  primary_image?: string;
  images?: PropertyImage[];
  address?: PropertyAddress | null;
}
