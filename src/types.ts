export interface DrinkSize {
  id: string;
  name: string; // e.g. "300ml", "500ml", "1 Litro"
  price: number; // in cents (R$ 6,00 = 600)
  available: boolean;
}

export interface DrinkDetails {
  flavor: string;
  type?: 'suco' | 'vitamina' | 'ambos';
  sizes?: DrinkSize[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: 'lanches' | 'cuscuz' | 'sopas' | 'bebidas' | (string & {});
  price: number; // In cents. 0 means requires custom pricing or drink options
  description: string;
  ingredients: string[];
  removableIngredients: string[];
  photoUrl?: string;
  available: boolean;
  order: number;
  allowedAdditionalIds?: string[];
  isDrink?: boolean;
  drinkDetails?: DrinkDetails;
  updatedAt?: number;
}

export interface Additional {
  id: string;
  name: string;
  price: number; // in cents
  maxQuantity: number;
  active: boolean;
}

export interface CoverageArea {
  id: string;
  name: string;
  isDelivered: boolean; // true = atendido, false = explicitamente não atendido
}

export interface BusinessPeriod {
  open: string; // HH:mm
  close: string; // HH:mm (can be past midnight, e.g. 02:00)
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Domingo, 1=Segunda, etc.
  dayName: string;
  enabled: boolean;
  periods: BusinessPeriod[];
}

export interface SpecialClosure {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  type: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'outro';
  details?: string;
}

export interface CustomCategory {
  id: string; // key normalizada, ex: "sobremesas"
  name: string; // nome visível, ex: "Sobremesas"
}

export interface StoreConfig {
  name: string;
  slogan: string;
  tagline: string;
  whatsappNumber: string; // e.g. 5584991537520
  logoUrl?: string;
  pickupAddress: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  acceptOrdersWhenClosed: boolean;
  temporaryPause: boolean;
  temporaryPauseMessage: string;
  deliveryTimeEstimate: string; // e.g. "40 a 60 min"
  pickupTimeEstimate: string; // e.g. "20 a 30 min"
  paymentMethods: PaymentMethod[];
  coverageAreas: CoverageArea[];
  businessHours: DaySchedule[];
  specialClosures: SpecialClosure[];
  experimentProductIds: string[]; // IDs for the "Experimente" section
  customCategories?: CustomCategory[];
  version?: number;
  updatedAt?: number;
}

export interface SelectedAdditional {
  id: string;
  name: string;
  price: number; // in cents
  quantity: number;
}

export interface CartItem {
  id: string; // unique UUID for this custom cart entry
  productId: string;
  productName: string;
  basePrice: number; // in cents
  quantity: number;
  removedIngredients: string[];
  additionals: SelectedAdditional[];
  notes: string;
  drinkOption?: {
    type?: string;
    sizeId?: string;
    sizeName?: string;
    flavor?: string;
  };
  unitPriceWithAdditionals: number; // in cents
  totalPrice: number; // in cents
}

export interface CustomerAddress {
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  noNumber: boolean;
  complement: string;
  reference: string;
}

export interface CheckoutData {
  customerName: string;
  fulfillmentType: 'entrega' | 'retirada';
  address: CustomerAddress;
  paymentMethodId: string;
  cashChangeAmount?: string;
  generalNotes?: string;
}

export interface StoreStatus {
  isOpen: boolean;
  statusLabel: string;
  statusDetail: string;
  isPaused: boolean;
  pauseMessage?: string;
  nextOpeningText?: string;
  canOrder: boolean;
}
