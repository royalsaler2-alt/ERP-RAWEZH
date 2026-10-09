export type UnitType = 'each' | 'lb' | 'kg' | 'pack' | 'bunch' | 'box';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStockAlert: number;
  unit: UnitType;
  isTaxable: boolean;
  notes?: string;
  colorTag?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  weight?: number; // for lb/kg items
  unitPrice: number;
  discountPercent?: number;
  note?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'split';

export interface PaymentDetails {
  cashTendered?: number;
  changeGiven?: number;
  cardLast4?: string;
  authCode?: string;
  splitCash?: number;
  splitCard?: number;
  provider?: string;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string; // ISO string
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  status: 'completed' | 'refunded' | 'voided';
  refundedAt?: string;
  refundReason?: string;
}

export interface ParkedCart {
  id: string;
  name: string;
  createdAt: string;
  items: CartItem[];
  customerName?: string;
  discountPercent: number;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'refund';
  delta: number;
  newStock: number;
  reason: string;
  timestamp: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  cashSales: number;
  cashDrops: number; // payouts or cash drops taken out
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  cashierName: string;
  notes?: string;
  isOpen: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  taxId: string;
  taxRate: number; // e.g. 7.5 for 7.5%
  currency: string;
  receiptFooter: string;
  soundEnabled: boolean;
  cashierName: string;
  requireWeightPrompt: boolean;
}
