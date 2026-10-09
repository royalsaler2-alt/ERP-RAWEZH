import React, { useState, useEffect } from 'react';
import { 
  Product, 
  SaleTransaction, 
  StoreSettings, 
  ParkedCart, 
  InventoryMovement, 
  CashShift, 
  CartItem, 
  PaymentMethod, 
  PaymentDetails 
} from './types';
import { 
  loadProducts, 
  saveProducts, 
  loadSales, 
  saveSales, 
  loadSettings, 
  saveSettings, 
  loadParkedCarts, 
  saveParkedCarts, 
  loadMovements, 
  saveMovements, 
  loadShifts, 
  saveShifts, 
  resetAllData 
} from './utils/storage';
import { generateReceiptNumber } from './utils/receipt';
import { Header, ActiveTab } from './components/Header';
import { RegisterView } from './components/RegisterView';
import { InventoryView } from './components/InventoryView';
import { ReportsView } from './components/ReportsView';
import { CashDrawerView } from './components/CashDrawerView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('register');
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [sales, setSales] = useState<SaleTransaction[]>(() => loadSales());
  const [settings, setSettings] = useState<StoreSettings>(() => loadSettings());
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>(() => loadParkedCarts());
  const [movements, setMovements] = useState<InventoryMovement[]>(() => loadMovements());
  const [shifts, setShifts] = useState<CashShift[]>(() => loadShifts());

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentReceipt, setCurrentReceipt] = useState<SaleTransaction | null>(null);

  // Sync to local storage whenever core states change
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveSales(sales);
  }, [sales]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveParkedCarts(parkedCarts);
  }, [parkedCarts]);

  useEffect(() => {
    saveMovements(movements);
  }, [movements]);

  useEffect(() => {
    saveShifts(shifts);
  }, [shifts]);

  // Keyboard shortcut listener for fast cashier switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('register');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('reports');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('cash_drawer');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Complete checkout sale
  const handleCompleteSale = (
    saleItems: CartItem[],
    subtotal: number,
    discountTotal: number,
    taxTotal: number,
    total: number,
    paymentMethod: PaymentMethod,
    paymentDetails: PaymentDetails,
    custName?: string,
    custPhone?: string
  ) => {
    const receiptNum = generateReceiptNumber();
    const timestamp = new Date().toISOString();

    const newSale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      receiptNumber: receiptNum,
      timestamp,
      items: saleItems,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      paymentMethod,
      paymentDetails,
      cashierName: settings.cashierName,
      customerName: custName,
      customerPhone: custPhone,
      status: 'completed',
    };

    // 1. Deduct stock and log movements
    const updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [];

    saleItems.forEach((ci) => {
      const idx = updatedProducts.findIndex((p) => p.id === ci.product.id);
      if (idx > -1) {
        const prod = updatedProducts[idx];
        const qtyDeducted = ci.weight || ci.quantity;
        const newStock = Math.max(0, Number((prod.stock - qtyDeducted).toFixed(2)));
        updatedProducts[idx] = { ...prod, stock: newStock };

        newMovements.push({
          id: `mov-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          delta: -qtyDeducted,
          newStock,
          reason: `Sale #${receiptNum}`,
          timestamp,
        });
      }
    });

    setProducts(updatedProducts);
    setMovements((prev) => [...newMovements, ...prev]);

    // 2. Add to sales history
    setSales((prev) => [newSale, ...prev]);

    // 3. Clear active cart
    setCart([]);

    // 4. Show printable thermal receipt modal
    setCurrentReceipt(newSale);
  };

  // Refund / Void sale
  const handleRefundSale = (saleId: string, reason: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status === 'refunded') return;

    const timestamp = new Date().toISOString();
    const updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [];

    // Replenish stock back to inventory
    sale.items.forEach((ci) => {
      const idx = updatedProducts.findIndex((p) => p.id === ci.product.id);
      if (idx > -1) {
        const prod = updatedProducts[idx];
        const qtyReturned = ci.weight || ci.quantity;
        const newStock = Number((prod.stock + qtyReturned).toFixed(2));
        updatedProducts[idx] = { ...prod, stock: newStock };

        newMovements.push({
          id: `mov-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          type: 'refund',
          delta: qtyReturned,
          newStock,
          reason: `Refund #${sale.receiptNumber} (${reason})`,
          timestamp,
        });
      }
    });

    setProducts(updatedProducts);
    setMovements((prev) => [...newMovements, ...prev]);

    // Update sale record
    setSales((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          return {
            ...s,
            status: 'refunded',
            refundedAt: timestamp,
            refundReason: reason,
          };
        }
        return s;
      })
    );
  };

  const handleRecordMovement = (movement: InventoryMovement) => {
    setMovements((prev) => [movement, ...prev]);
  };

  const handleResetDemoData = () => {
    const fresh = resetAllData();
    setProducts(fresh.products);
    setSales(fresh.sales);
    setSettings(fresh.settings);
    setCart([]);
    setParkedCarts([]);
    setMovements([]);
    setShifts(loadShifts());
  };

  const handleImportData = (data: {
    products?: Product[];
    sales?: SaleTransaction[];
    settings?: StoreSettings;
  }) => {
    if (data.products) setProducts(data.products);
    if (data.sales) setSales(data.sales);
    if (data.settings) setSettings(data.settings);
  };

  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.minStockAlert
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-900 text-neutral-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onUpdateSettings={setSettings}
        cartItemCount={cart.length}
        lowStockCount={lowStockCount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'register' && (
          <RegisterView
            products={products}
            settings={settings}
            cart={cart}
            setCart={setCart}
            parkedCarts={parkedCarts}
            setParkedCarts={setParkedCarts}
            onCompleteSale={handleCompleteSale}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            setProducts={setProducts}
            settings={settings}
            movements={movements}
            onRecordMovement={handleRecordMovement}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            sales={sales}
            products={products}
            settings={settings}
            onRefundSale={handleRefundSale}
          />
        )}

        {activeTab === 'cash_drawer' && (
          <CashDrawerView
            shifts={shifts}
            setShifts={setShifts}
            sales={sales}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            products={products}
            sales={sales}
            onResetDemoData={handleResetDemoData}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* THERMAL RECEIPT MODAL ON TRANSACTION COMPLETE */}
      {currentReceipt && (
        <ReceiptModal
          sale={currentReceipt}
          settings={settings}
          onClose={() => setCurrentReceipt(null)}
        />
      )}
    </div>
  );
}
