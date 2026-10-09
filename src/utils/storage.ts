import { Product, SaleTransaction, StoreSettings, ParkedCart, InventoryMovement, CashShift } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'marketflow_pos_products_v1',
  SALES: 'marketflow_pos_sales_v1',
  SETTINGS: 'marketflow_pos_settings_v1',
  PARKED_CARTS: 'marketflow_pos_parked_v1',
  MOVEMENTS: 'marketflow_pos_movements_v1',
  SHIFTS: 'marketflow_pos_shifts_v1',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Mercado Fresh Market',
  tagline: 'Artisanal Grocer & Provisions',
  address: '428 Market Street, Suite 100, San Francisco, CA 94105',
  phone: '(415) 555-0194',
  taxId: 'US-84-9120341',
  taxRate: 8.25,
  currency: '$',
  receiptFooter: 'Thank you for supporting your local neighbourhood market!',
  soundEnabled: true,
  cashierName: 'Alex Mercer (Reg #1)',
  requireWeightPrompt: true,
};

export const INITIAL_PRODUCTS: Product[] = [
  // Produce
  {
    id: 'prod-001',
    name: 'Organic Cavendish Bananas',
    sku: 'PROD-4011',
    barcode: '040110000001',
    category: 'Fresh Produce',
    price: 0.79,
    cost: 0.35,
    stock: 85,
    minStockAlert: 20,
    unit: 'lb',
    isTaxable: false,
    notes: 'Imported fair trade organic',
    colorTag: 'emerald',
  },
  {
    id: 'prod-002',
    name: 'Honeycrisp Apples',
    sku: 'PROD-4173',
    barcode: '041730000002',
    category: 'Fresh Produce',
    price: 2.49,
    cost: 1.10,
    stock: 62,
    minStockAlert: 15,
    unit: 'lb',
    isTaxable: false,
    notes: 'Washington State extra fancy',
    colorTag: 'emerald',
  },
  {
    id: 'prod-003',
    name: 'Hass Avocados (Ripe)',
    sku: 'PROD-4225',
    barcode: '042250000003',
    category: 'Fresh Produce',
    price: 1.89,
    cost: 0.85,
    stock: 44,
    minStockAlert: 12,
    unit: 'each',
    isTaxable: false,
    notes: 'Premium medium California',
    colorTag: 'emerald',
  },
  {
    id: 'prod-004',
    name: 'Organic Baby Spinach (5 oz)',
    sku: 'PROD-3201',
    barcode: '850012001004',
    category: 'Fresh Produce',
    price: 3.49,
    cost: 1.70,
    stock: 28,
    minStockAlert: 10,
    unit: 'each',
    isTaxable: false,
    notes: 'Pre-washed triple rinsed',
    colorTag: 'emerald',
  },
  {
    id: 'prod-005',
    name: 'Heirloom Vine Tomatoes',
    sku: 'PROD-4799',
    barcode: '047990000005',
    category: 'Fresh Produce',
    price: 3.99,
    cost: 1.95,
    stock: 35,
    minStockAlert: 10,
    unit: 'lb',
    isTaxable: false,
    notes: 'Sweet greenhouse heirloom mix',
    colorTag: 'emerald',
  },
  {
    id: 'prod-006',
    name: 'Organic Cilantro Bunch',
    sku: 'PROD-4889',
    barcode: '048890000006',
    category: 'Fresh Produce',
    price: 0.99,
    cost: 0.35,
    stock: 18,
    minStockAlert: 8,
    unit: 'bunch',
    isTaxable: false,
    notes: 'Crisp aromatic fresh herb',
    colorTag: 'emerald',
  },

  // Bakery & Deli
  {
    id: 'prod-007',
    name: 'San Francisco Sourdough Loaf',
    sku: 'BAKE-1001',
    barcode: '850012001007',
    category: 'Bakery & Deli',
    price: 5.95,
    cost: 2.20,
    stock: 14,
    minStockAlert: 5,
    unit: 'each',
    isTaxable: false,
    notes: 'Baked fresh daily at 5am',
    colorTag: 'amber',
  },
  {
    id: 'prod-008',
    name: 'French Butter Croissants (2-pack)',
    sku: 'BAKE-1002',
    barcode: '850012001008',
    category: 'Bakery & Deli',
    price: 4.50,
    cost: 1.80,
    stock: 9,
    minStockAlert: 6,
    unit: 'pack',
    isTaxable: false,
    notes: 'Laminated with cultured butter',
    colorTag: 'amber',
  },
  {
    id: 'prod-009',
    name: 'Rosemary Sea Salt Focaccia',
    sku: 'BAKE-1003',
    barcode: '850012001009',
    category: 'Bakery & Deli',
    price: 6.25,
    cost: 2.50,
    stock: 6,
    minStockAlert: 4,
    unit: 'each',
    isTaxable: false,
    notes: 'Olive oil rich crumb',
    colorTag: 'amber',
  },
  {
    id: 'prod-010',
    name: 'Smoked Turkey Breast (Deli Sliced)',
    sku: 'DELI-2001',
    barcode: '850012001010',
    category: 'Bakery & Deli',
    price: 11.99,
    cost: 6.20,
    stock: 16,
    minStockAlert: 5,
    unit: 'lb',
    isTaxable: false,
    notes: 'Hickory smoked, antibiotic free',
    colorTag: 'amber',
  },
  {
    id: 'prod-011',
    name: 'Aged Sharp Vermont Cheddar',
    sku: 'DELI-2002',
    barcode: '850012001011',
    category: 'Bakery & Deli',
    price: 7.49,
    cost: 3.80,
    stock: 22,
    minStockAlert: 8,
    unit: 'each',
    isTaxable: false,
    notes: '18 month cave aged block (8 oz)',
    colorTag: 'amber',
  },

  // Dairy & Eggs
  {
    id: 'prod-012',
    name: 'Organic Whole Milk (1 Gallon)',
    sku: 'DAIRY-3001',
    barcode: '850012001012',
    category: 'Dairy & Eggs',
    price: 5.89,
    cost: 3.40,
    stock: 30,
    minStockAlert: 10,
    unit: 'each',
    isTaxable: false,
    notes: 'Pasture raised non-homogenized',
    colorTag: 'blue',
  },
  {
    id: 'prod-013',
    name: 'Pasture-Raised Brown Eggs (12 ct)',
    sku: 'DAIRY-3002',
    barcode: '850012001013',
    category: 'Dairy & Eggs',
    price: 6.49,
    cost: 3.60,
    stock: 45,
    minStockAlert: 12,
    unit: 'pack',
    isTaxable: false,
    notes: 'Certified humane 108 sq ft per bird',
    colorTag: 'blue',
  },
  {
    id: 'prod-014',
    name: 'Greek Whole Milk Yogurt (32 oz)',
    sku: 'DAIRY-3003',
    barcode: '850012001014',
    category: 'Dairy & Eggs',
    price: 5.25,
    cost: 2.80,
    stock: 19,
    minStockAlert: 6,
    unit: 'each',
    isTaxable: false,
    notes: 'Unsweetened probiotic rich',
    colorTag: 'blue',
  },
  {
    id: 'prod-015',
    name: 'Salted European Butter (16 oz)',
    sku: 'DAIRY-3004',
    barcode: '850012001015',
    category: 'Dairy & Eggs',
    price: 4.99,
    cost: 2.60,
    stock: 26,
    minStockAlert: 8,
    unit: 'pack',
    isTaxable: false,
    notes: '82% butterfat 4 sticks',
    colorTag: 'blue',
  },

  // Beverages
  {
    id: 'prod-016',
    name: 'Cold Pressed Orange Juice (16 oz)',
    sku: 'BEV-4001',
    barcode: '850012001016',
    category: 'Beverages',
    price: 4.29,
    cost: 2.10,
    stock: 18,
    minStockAlert: 6,
    unit: 'each',
    isTaxable: true,
    notes: '100% pure Valencia oranges',
    colorTag: 'cyan',
  },
  {
    id: 'prod-017',
    name: 'Sparkling Mineral Water (750ml glass)',
    sku: 'BEV-4002',
    barcode: '850012001017',
    category: 'Beverages',
    price: 2.79,
    cost: 1.15,
    stock: 40,
    minStockAlert: 12,
    unit: 'each',
    isTaxable: true,
    notes: 'Naturally carbonated limestone spring',
    colorTag: 'cyan',
  },
  {
    id: 'prod-018',
    name: 'Organic Cold Brew Coffee (32 oz)',
    sku: 'BEV-4003',
    barcode: '850012001018',
    category: 'Beverages',
    price: 6.99,
    cost: 3.50,
    stock: 15,
    minStockAlert: 5,
    unit: 'each',
    isTaxable: true,
    notes: 'Single origin Ethiopian roast',
    colorTag: 'cyan',
  },
  {
    id: 'prod-019',
    name: 'Ginger Lemon Kombucha (12 oz)',
    sku: 'BEV-4004',
    barcode: '850012001019',
    category: 'Beverages',
    price: 3.89,
    cost: 1.90,
    stock: 24,
    minStockAlert: 8,
    unit: 'each',
    isTaxable: true,
    notes: 'Live raw fermented',
    colorTag: 'cyan',
  },

  // Pantry & Dry Goods
  {
    id: 'prod-020',
    name: 'Extra Virgin Olive Oil (500ml)',
    sku: 'PANTRY-5001',
    barcode: '850012001020',
    category: 'Pantry & Dry Goods',
    price: 13.50,
    cost: 7.20,
    stock: 20,
    minStockAlert: 5,
    unit: 'each',
    isTaxable: false,
    notes: 'First cold pressed unfiltered Crete',
    colorTag: 'orange',
  },
  {
    id: 'prod-021',
    name: 'Organic White Quinoa (16 oz)',
    sku: 'PANTRY-5002',
    barcode: '850012001021',
    category: 'Pantry & Dry Goods',
    price: 4.89,
    cost: 2.20,
    stock: 32,
    minStockAlert: 10,
    unit: 'each',
    isTaxable: false,
    notes: 'Pre-washed gluten-free',
    colorTag: 'orange',
  },
  {
    id: 'prod-022',
    name: 'Wildflower Raw Honey (12 oz jar)',
    sku: 'PANTRY-5003',
    barcode: '850012001022',
    category: 'Pantry & Dry Goods',
    price: 8.95,
    cost: 4.50,
    stock: 11,
    minStockAlert: 4,
    unit: 'each',
    isTaxable: false,
    notes: 'Local California apiary raw unfiltered',
    colorTag: 'orange',
  },
  {
    id: 'prod-023',
    name: 'Sea Salt & Vinegar Kettle Chips',
    sku: 'SNACK-6001',
    barcode: '850012001023',
    category: 'Pantry & Dry Goods',
    price: 3.29,
    cost: 1.45,
    stock: 38,
    minStockAlert: 12,
    unit: 'each',
    isTaxable: true,
    notes: 'Non-GMO avocado oil cooked',
    colorTag: 'orange',
  },
  {
    id: 'prod-024',
    name: 'Dark Roast Whole Bean Coffee (12 oz)',
    sku: 'PANTRY-5004',
    barcode: '850012001024',
    category: 'Pantry & Dry Goods',
    price: 14.25,
    cost: 7.80,
    stock: 17,
    minStockAlert: 5,
    unit: 'each',
    isTaxable: false,
    notes: 'Fair trade organic dark roast',
    colorTag: 'orange',
  },

  // Household & Goods
  {
    id: 'prod-025',
    name: 'Eco Dish Soap Cedar & Sage (16 oz)',
    sku: 'HOUSE-7001',
    barcode: '850012001025',
    category: 'Household & Care',
    price: 5.49,
    cost: 2.60,
    stock: 19,
    minStockAlert: 6,
    unit: 'each',
    isTaxable: true,
    notes: 'Plant-based biodegradable formula',
    colorTag: 'slate',
  },
  {
    id: 'prod-026',
    name: '100% Recycled Paper Towels (2 Roll)',
    sku: 'HOUSE-7002',
    barcode: '850012001026',
    category: 'Household & Care',
    price: 4.19,
    cost: 2.10,
    stock: 22,
    minStockAlert: 8,
    unit: 'pack',
    isTaxable: true,
    notes: 'Chlorine-free unbleached sheets',
    colorTag: 'slate',
  },
];

export function generateSeedSales(products: Product[]): SaleTransaction[] {
  const now = new Date();
  const sales: SaleTransaction[] = [];
  const pMap = new Map(products.map((p) => [p.id, p]));

  // Seed transactions spread across the last 3 days
  const timeOffsets = [
    { hoursAgo: 1.2, cashier: 'Alex Mercer', pay: 'card', cust: 'Sophia Chen' },
    { hoursAgo: 2.5, cashier: 'Alex Mercer', pay: 'cash', cust: 'Marcus Brody' },
    { hoursAgo: 4.1, cashier: 'Alex Mercer', pay: 'mobile', cust: 'Elena Rostova' },
    { hoursAgo: 5.8, cashier: 'Alex Mercer', pay: 'card', cust: 'Walk-in Customer' },
    { hoursAgo: 18.0, cashier: 'Jordan Lee', pay: 'card', cust: 'David Kim' },
    { hoursAgo: 22.4, cashier: 'Jordan Lee', pay: 'cash', cust: 'Walk-in Customer' },
    { hoursAgo: 26.0, cashier: 'Jordan Lee', pay: 'card', cust: 'Sarah Jenkins' },
    { hoursAgo: 48.2, cashier: 'Alex Mercer', pay: 'mobile', cust: 'Walk-in Customer' },
    { hoursAgo: 52.0, cashier: 'Alex Mercer', pay: 'card', cust: 'Liam O\'Connor' },
    { hoursAgo: 65.5, cashier: 'Jordan Lee', pay: 'cash', cust: 'Emma Watson' },
  ];

  timeOffsets.forEach((item, index) => {
    const saleDate = new Date(now.getTime() - item.hoursAgo * 3600 * 1000);
    const receiptNum = `RCP-${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, '0')}${String(saleDate.getDate()).padStart(2, '0')}-${1001 + index}`;

    // pick 2 to 4 items
    const sampleItems = [
      pMap.get('prod-001') || products[0],
      pMap.get('prod-007') || products[6],
      pMap.get('prod-012') || products[11],
      pMap.get('prod-016') || products[15],
    ];

    const cartItems = sampleItems.slice(0, 2 + (index % 3)).map((prod, pIdx) => {
      const isWeight = prod.unit === 'lb' || prod.unit === 'kg';
      const weight = isWeight ? Number((1.2 + (pIdx * 0.45)).toFixed(2)) : undefined;
      const quantity = isWeight ? 1 : (1 + (pIdx % 2));
      return {
        product: prod,
        quantity,
        weight,
        unitPrice: prod.price,
      };
    });

    let subtotal = 0;
    let taxTotal = 0;
    cartItems.forEach((ci) => {
      const lineCost = ci.unitPrice * (ci.weight || ci.quantity);
      subtotal += lineCost;
      if (ci.product.isTaxable) {
        taxTotal += lineCost * 0.0825;
      }
    });

    const total = Number((subtotal + taxTotal).toFixed(2));
    const cashTendered = item.pay === 'cash' ? Math.ceil(total / 10) * 10 : undefined;
    const changeGiven = cashTendered ? Number((cashTendered - total).toFixed(2)) : undefined;

    sales.push({
      id: `sale-seed-${index + 1}`,
      receiptNumber: receiptNum,
      timestamp: saleDate.toISOString(),
      items: cartItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: 0,
      taxTotal: Number(taxTotal.toFixed(2)),
      total,
      paymentMethod: item.pay as any,
      paymentDetails: {
        cashTendered,
        changeGiven,
        cardLast4: item.pay === 'card' ? `${4000 + (index * 13) % 9000}` : undefined,
        authCode: item.pay === 'card' ? `AUTH-${8291 + index}` : undefined,
      },
      cashierName: item.cashier,
      customerName: item.cust,
      status: 'completed',
    });
  });

  return sales;
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  saveProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products:', err);
  }
}

export function loadSales(products?: Product[]): SaleTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  const seeded = generateSeedSales(products || INITIAL_PRODUCTS);
  saveSales(seeded);
  return seeded;
}

export function saveSales(sales: SaleTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (err) {
    console.error('Error saving sales:', err);
  }
}

export function loadSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

export function loadParkedCarts(): ParkedCart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARKED_CARTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveParkedCarts(carts: ParkedCart[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARKED_CARTS, JSON.stringify(carts));
  } catch (err) {
    console.error('Error saving parked carts:', err);
  }
}

export function loadMovements(): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveMovements(movements: InventoryMovement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  } catch (err) {
    console.error('Error saving movements:', err);
  }
}

export function loadShifts(): CashShift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  // Initial open shift for register 1
  const initialShift: CashShift = {
    id: 'shift-today-1',
    openedAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    openingCash: 250.0,
    cashSales: 78.45,
    cashDrops: 0,
    expectedCash: 328.45,
    cashierName: DEFAULT_SETTINGS.cashierName,
    isOpen: true,
  };
  saveShifts([initialShift]);
  return [initialShift];
}

export function saveShifts(shifts: CashShift[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  } catch (err) {
    console.error('Error saving shifts:', err);
  }
}

export function resetAllData(): { products: Product[]; sales: SaleTransaction[]; settings: StoreSettings } {
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.PARKED_CARTS);
  localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
  localStorage.removeItem(STORAGE_KEYS.SHIFTS);

  const prods = INITIAL_PRODUCTS;
  const sales = generateSeedSales(prods);
  const settings = DEFAULT_SETTINGS;

  saveProducts(prods);
  saveSales(sales);
  saveSettings(settings);
  return { products: prods, sales, settings };
}
