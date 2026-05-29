export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock?: number;
  category: string;
  imageUrl: string;
  promoPrice?: number;
  externalUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  isExternalLinks?: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  productIds: string[];
  active: boolean;
  expiresAt?: string | null;
  showOnStart?: boolean;
}

export interface Banner {
  id: string;
  store_id?: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  type: 'promo' | 'sorteio' | 'aviso';
  expiresAt?: string | null;
  active: boolean;
}

export interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

export interface StoreConfig {
  name: string;
  font: string;
  primaryColor: string;
  logoUrl: string;
  address: string;
  lat: number;
  lng: number;
  deliveryFeePerKm: number;
  slogan: string;
  whatsapp: string;
  instagram?: string;
  pixKey?: string;
  openingHours?: OpeningHours;
  informativeText?: string; // New field
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  status: 'pending' | 'confirmed' | 'delivered';
  createdAt: string;
  paymentMethod: 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito';
  changeFor?: number | null;
  isPaid: boolean;
}
