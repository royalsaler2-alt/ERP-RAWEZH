import React, { useState, useMemo } from 'react';
import { Product, CartItem, StoreSettings, ParkedCart, PaymentMethod, PaymentDetails } from '../types';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  Percent, 
  PauseCircle, 
  PlayCircle, 
  ArrowRight, 
  Scale, 
  Tag, 
  UserPlus, 
  Check, 
  ShoppingBag,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/receipt';
import { soundFX } from '../utils/audio';
import { WeightScaleModal } from './WeightScaleModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CheckoutModal } from './CheckoutModal';

interface RegisterViewProps {
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  parkedCarts: ParkedCart[];
  setParkedCarts: React.Dispatch<React.SetStateAction<ParkedCart[]>>;
  onCompleteSale: (
    cart: CartItem[],
    subtotal: number,
    discountTotal: number,
    taxTotal: number,
    total: number,
    method: PaymentMethod,
    details: PaymentDetails,
    custName?: string,
    custPhone?: string
  ) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  products,
  settings,
  cart,
  setCart,
  parkedCarts,
  setParkedCarts,
  onCompleteSale,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [showCustomerInput, setShowCustomerInput] = useState<boolean>(false);

  // Modals state
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showParkedDropdown, setShowParkedDropdown] = useState<boolean>(false);
  const [itemDiscountModalIndex, setItemDiscountModalIndex] = useState<number | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const { subtotal, discountTotal, taxTotal, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;

    cart.forEach((item) => {
      const itemQty = item.weight || item.quantity;
      let linePrice = item.unitPrice * itemQty;
      if (item.discountPercent && item.discountPercent > 0) {
        linePrice -= (linePrice * item.discountPercent) / 100;
      }
      sub += linePrice;

      if (item.product.isTaxable) {
        tax += (linePrice * settings.taxRate) / 100;
      }
    });

    const disc = orderDiscountPercent > 0 ? (sub * orderDiscountPercent) / 100 : 0;
    const finalSub = Math.max(0, sub - disc);
    const finalTax = orderDiscountPercent > 0 ? (tax * (100 - orderDiscountPercent)) / 100 : tax;
    const grandTotal = Number((finalSub + finalTax).toFixed(2));

    return {
      subtotal: Number(sub.toFixed(2)),
      discountTotal: Number(disc.toFixed(2)),
      taxTotal: Number(finalTax.toFixed(2)),
      total: grandTotal,
    };
  }, [cart, orderDiscountPercent, settings.taxRate]);

  // Handle adding product to cart
  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) {
      if (settings.soundEnabled) soundFX.playErrorBoop();
      return;
    }

    if (product.unit === 'lb' || product.unit === 'kg') {
      if (settings.requireWeightPrompt) {
        setWeightModalProduct(product);
        return;
      }
    }

    // Unit item or instant add
    if (settings.soundEnabled) soundFX.playScanBeep();
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.product.id === product.id && !i.weight);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1,
        };
        return next;
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.price,
        },
      ];
    });
  };

  // Confirm weight modal
  const handleConfirmWeight = (product: Product, weight: number) => {
    if (settings.soundEnabled) soundFX.playScanBeep();
    setCart((prev) => [
      ...prev,
      {
        product,
        quantity: 1,
        weight,
        unitPrice: product.price,
      },
    ]);
    setWeightModalProduct(null);
  };

  // Barcode / SKU scan
  const handleBarcodeScanned = (code: string) => {
    const clean = code.trim().toLowerCase();
    const found = products.find(
      (p) => p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean
    );

    if (found) {
      if (found.unit === 'lb' || found.unit === 'kg') {
        setWeightModalProduct(found);
      } else {
        handleProductClick(found);
      }
    } else {
      if (settings.soundEnabled) soundFX.playErrorBoop();
      alert(`Barcode or SKU "${code}" was not found in catalog.`);
    }
  };

  // Cart item modifications
  const handleUpdateQty = (index: number, delta: number) => {
    if (settings.soundEnabled) soundFX.playClick();
    setCart((prev) => {
      const next = [...prev];
      const item = next[index];
      if (item.weight) {
        const newWeight = Math.max(0.1, Number((item.weight + delta * 0.5).toFixed(2)));
        next[index] = { ...item, weight: newWeight };
      } else {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          next.splice(index, 1);
        } else {
          next[index] = { ...item, quantity: newQty };
        }
      }
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (settings.soundEnabled) soundFX.playClick();
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from the current cart?')) {
      if (settings.soundEnabled) soundFX.playClick();
      setCart([]);
      setOrderDiscountPercent(0);
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // Park / Suspend cart
  const handleParkCart = () => {
    if (cart.length === 0) return;
    const parkedName = customerName || `Order #${parkedCarts.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const newParked: ParkedCart = {
      id: `parked-${Date.now()}`,
      name: parkedName,
      createdAt: new Date().toISOString(),
      items: cart,
      customerName: customerName || undefined,
      discountPercent: orderDiscountPercent,
    };
    setParkedCarts((prev) => [newParked, ...prev]);
    setCart([]);
    setOrderDiscountPercent(0);
    setCustomerName('');
    setCustomerPhone('');
    if (settings.soundEnabled) soundFX.playClick();
  };

  // Resume parked cart
  const handleResumeParkedCart = (pCart: ParkedCart) => {
    if (cart.length > 0) {
      if (!window.confirm('Replace current cart with suspended order?')) return;
    }
    setCart(pCart.items);
    setOrderDiscountPercent(pCart.discountPercent || 0);
    setCustomerName(pCart.customerName || '');
    setParkedCarts((prev) => prev.filter((p) => p.id !== pCart.id));
    setShowParkedDropdown(false);
    if (settings.soundEnabled) soundFX.playScanBeep();
  };

  // Quick tender from register ticket footer
  const handleQuickPayCash = (tenderAmount: number) => {
    if (cart.length === 0) return;
    const change = Math.max(0, tenderAmount - total);
    onCompleteSale(
      cart,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      'cash',
      {
        cashTendered: tenderAmount,
        changeGiven: Number(change.toFixed(2)),
      },
      customerName || undefined,
      customerPhone || undefined
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden bg-neutral-900">
      {/* LEFT PANE: PRODUCT CATALOG & SCANNING */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-neutral-800 bg-neutral-950/40">
        {/* Top Control Bar: Search & Barcode Scan Input */}
        <div className="p-3.5 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search items by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-neutral-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowBarcodeModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs font-semibold text-neutral-200 hover:text-white hover:border-emerald-500/60 hover:bg-neutral-800 transition-all shrink-0 shadow-xs"
            title="Open Barcode Scanner Simulator"
          >
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span>Barcode Scanner</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-3.5 py-2 border-b border-neutral-800/80 bg-neutral-950/80 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-emerald-400 font-semibold border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-3.5 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium text-neutral-300">No items match your query</p>
              <p className="text-xs text-neutral-500 mt-1">Try another search term or select &quot;All&quot; categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStockAlert && !isOutOfStock;
                const isWeightUnit = product.unit === 'lb' || product.unit === 'kg';

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => handleProductClick(product)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group relative overflow-hidden select-none active:scale-98 ${
                      isOutOfStock
                        ? 'bg-neutral-950/40 border-neutral-800/50 opacity-45 cursor-not-allowed'
                        : 'bg-neutral-900/90 border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 hover:shadow-lg hover:shadow-emerald-950/20'
                    }`}
                  >
                    {/* Top row: Category & Unit */}
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-400 font-medium mb-1">
                        <span className="truncate">{product.category}</span>
                        {isWeightUnit && (
                          <span className="flex items-center gap-0.5 text-emerald-400 font-mono">
                            <Scale className="w-2.5 h-2.5" />
                            <span>Scale</span>
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                    </div>

                    {/* Bottom row: Price & Stock status */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                          {formatCurrency(product.price, settings.currency)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          /{product.unit}
                        </span>
                      </div>

                      {/* Stock Pill / Tag */}
                      <div className="text-[10px] font-mono tabular-nums">
                        {isOutOfStock ? (
                          <span className="text-red-400 font-medium">Out</span>
                        ) : isLowStock ? (
                          <span className="text-amber-400 font-medium">
                            {product.stock} left
                          </span>
                        ) : (
                          <span className="text-neutral-500">
                            {product.stock} {product.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: INTERACTIVE REGISTER TICKET & CART */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col h-full bg-neutral-950 border-l border-neutral-800 shrink-0">
        {/* Ticket Header & Customer Bar */}
        <div className="p-3.5 border-b border-neutral-800 bg-neutral-950 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Current Ticket
              </span>
              <span className="text-xs font-mono bg-neutral-900 border border-neutral-800 text-emerald-400 px-2 py-0.5 rounded-md">
                {cart.length} {cart.length === 1 ? 'line' : 'lines'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Parked Carts Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowParkedDropdown(!showParkedDropdown)}
                  disabled={parkedCarts.length === 0}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    parkedCarts.length > 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 opacity-60'
                  }`}
                  title="View Parked Orders"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Parked ({parkedCarts.length})</span>
                </button>

                {showParkedDropdown && parkedCarts.length > 0 && (
                  <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-400 px-2 py-1 uppercase">
                      Recall Suspended Ticket
                    </div>
                    {parkedCarts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleResumeParkedCart(p)}
                        className="w-full text-left p-2 rounded-lg hover:bg-neutral-800 text-xs text-white flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-medium group-hover:text-emerald-400">{p.name}</div>
                          <div className="text-[10px] text-neutral-500">
                            {p.items.length} items · {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className="text-emerald-400 text-xs font-semibold">Load</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Suspend / Park button */}
              <button
                onClick={handleParkCart}
                disabled={cart.length === 0}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Hold / Suspend Current Order"
              >
                <PauseCircle className="w-4 h-4" />
              </button>

              {/* Clear cart */}
              <button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Clear Cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customer Lookup & Loyalty Tag */}
          <div className="flex items-center gap-2">
            {!showCustomerInput ? (
              <button
                onClick={() => setShowCustomerInput(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{customerName ? `Customer: ${customerName}` : '+ Assign Customer (Optional)'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  placeholder="Customer name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white flex-1 focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  onClick={() => setShowCustomerInput(false)}
                  className="p-1 rounded-md text-emerald-400 hover:bg-neutral-800"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <ShoppingBag className="w-12 h-12 mb-3 stroke-[1.2] opacity-30" />
              <p className="text-sm font-semibold text-neutral-300">Ticket is empty</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-[200px]">
                Scan barcodes or tap products from the catalog to ring up a purchase.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemTotal = item.unitPrice * (item.weight || item.quantity);
              const discountVal = item.discountPercent
                ? (itemTotal * item.discountPercent) / 100
                : 0;
              const netTotal = itemTotal - discountVal;

              return (
                <div
                  key={`${item.product.id}-${idx}`}
                  className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white leading-tight truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>
                          {formatCurrency(item.unitPrice, settings.currency)}/{item.product.unit}
                        </span>
                        {item.product.isTaxable && (
                          <span className="text-neutral-500 uppercase">Tax</span>
                        )}
                        {item.discountPercent && item.discountPercent > 0 && (
                          <span className="text-red-400">-{item.discountPercent}%</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono tabular-nums text-white block">
                        {formatCurrency(netTotal, settings.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50">
                    <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
                      <button
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="px-2 text-xs font-mono font-semibold text-emerald-400 min-w-[36px] text-center tabular-nums">
                        {item.weight ? `${item.weight.toFixed(2)} ${item.product.unit}` : item.quantity}
                      </span>

                      <button
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setItemDiscountModalIndex(idx)}
                        className="px-2 py-1 rounded text-[10px] font-mono text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Add item discount"
                      >
                        % Disc
                      </button>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calculation & Tender Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 space-y-3">
          {/* Subtotal & Discount & Tax */}
          <div className="space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-neutral-200 tabular-nums">
                {formatCurrency(subtotal, settings.currency)}
              </span>
            </div>

            {/* Discount selector button */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span>Order Discount:</span>
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    onClick={() => setOrderDiscountPercent(d)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                      orderDiscountPercent === d
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {d === 0 ? 'None' : `${d}%`}
                  </button>
                ))}
              </div>
              {discountTotal > 0 && (
                <span className="font-mono text-red-400 tabular-nums">
                  -{formatCurrency(discountTotal, settings.currency)}
                </span>
              )}
            </div>

            <div className="flex justify-between">
              <span>Tax ({settings.taxRate}%):</span>
              <span className="font-mono text-neutral-200 tabular-nums">
                {formatCurrency(taxTotal, settings.currency)}
              </span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-neutral-800 flex items-baseline justify-between">
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Total Due
            </span>
            <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(total, settings.currency)}
            </span>
          </div>

          {/* Quick Cash Tender Row */}
          {cart.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                onClick={() => handleQuickPayCash(total)}
                className="py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono font-medium text-emerald-400 hover:bg-neutral-800 transition-colors truncate"
              >
                Exact Cash
              </button>
              <button
                onClick={() => handleQuickPayCash(20)}
                className="py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                $20
              </button>
              <button
                onClick={() => handleQuickPayCash(50)}
                className="py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                $50
              </button>
              <button
                onClick={() => handleQuickPayCash(100)}
                className="py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                $100
              </button>
            </div>
          )}

          {/* Big Pay / Charge Button */}
          <button
            disabled={cart.length === 0}
            onClick={() => setShowCheckoutModal(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
          >
            <span>Charge {formatCurrency(total, settings.currency)}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* WEIGHT SCALE MODAL */}
      {weightModalProduct && (
        <WeightScaleModal
          product={weightModalProduct}
          settings={settings}
          onConfirm={handleConfirmWeight}
          onClose={() => setWeightModalProduct(null)}
        />
      )}

      {/* BARCODE SCANNER SIMULATOR MODAL */}
      {showBarcodeModal && (
        <BarcodeScannerModal
          products={products}
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <CheckoutModal
          total={total}
          settings={settings}
          customerName={customerName}
          customerPhone={customerPhone}
          onComplete={(method, details, cName, cPhone) => {
            setShowCheckoutModal(false);
            onCompleteSale(
              cart,
              subtotal,
              discountTotal,
              taxTotal,
              total,
              method,
              details,
              cName || customerName,
              cPhone || customerPhone
            );
          }}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}

      {/* ITEM DISCOUNT QUICK PROMPT MODAL */}
      {itemDiscountModalIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-white">Item Discount</h4>
            <div className="grid grid-cols-4 gap-2">
              {[0, 10, 15, 20, 25, 30, 50].map((disc) => (
                <button
                  key={disc}
                  onClick={() => {
                    setCart((prev) => {
                      const next = [...prev];
                      if (next[itemDiscountModalIndex]) {
                        next[itemDiscountModalIndex] = {
                          ...next[itemDiscountModalIndex],
                          discountPercent: disc,
                        };
                      }
                      return next;
                    });
                    setItemDiscountModalIndex(null);
                  }}
                  className="py-2 rounded-lg bg-neutral-800 text-xs font-mono font-medium text-neutral-200 hover:bg-emerald-500 hover:text-neutral-950 transition-colors"
                >
                  {disc === 0 ? 'Clear' : `${disc}%`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setItemDiscountModalIndex(null)}
              className="w-full py-2 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
