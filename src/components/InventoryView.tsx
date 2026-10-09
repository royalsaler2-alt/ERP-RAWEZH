import React, { useState, useMemo } from 'react';
import { Product, StoreSettings, InventoryMovement } from '../types';
import { 
  Package, 
  Search, 
  Plus, 
  SlidersHorizontal, 
  AlertTriangle, 
  Tag, 
  Printer, 
  Download, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  History, 
  Check, 
  X,
  TrendingUp,
  DollarSign,
  Barcode
} from 'lucide-react';
import { formatCurrency } from '../utils/receipt';
import { generateBarcodeSvgPath } from '../utils/barcode';

interface InventoryViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: StoreSettings;
  movements: InventoryMovement[];
  onRecordMovement: (movement: InventoryMovement) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  setProducts,
  settings,
  movements,
  onRecordMovement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [showMovementsModal, setShowMovementsModal] = useState<boolean>(false);
  const [showLabelsModal, setShowLabelsModal] = useState<boolean>(false);

  // Quick adjust form state
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Shipment Received');
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');

  // Add/Edit Product Form state
  const [formProduct, setFormProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: 'Fresh Produce',
    price: 0,
    cost: 0,
    stock: 20,
    minStockAlert: 5,
    unit: 'each',
    isTaxable: false,
    notes: '',
  });

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Inventory metrics
  const metrics = useMemo(() => {
    let totalRetail = 0;
    let totalCost = 0;
    let lowCount = 0;
    let outCount = 0;

    products.forEach((p) => {
      totalRetail += p.price * p.stock;
      totalCost += p.cost * p.stock;
      if (p.stock <= 0) outCount++;
      else if (p.stock <= p.minStockAlert) lowCount++;
    });

    const potentialProfit = Math.max(0, totalRetail - totalCost);
    const margin = totalRetail > 0 ? (potentialProfit / totalRetail) * 100 : 0;

    return {
      totalCount: products.length,
      lowCount,
      outCount,
      totalRetail,
      totalCost,
      potentialProfit,
      margin: Number(margin.toFixed(1)),
    };
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q);

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.stock > 0 && p.stock <= p.minStockAlert;
      } else if (stockFilter === 'out') {
        matchesStock = p.stock <= 0;
      }

      return matchesCat && matchesQuery && matchesStock;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  // Handle Save Product (Create or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name || !formProduct.price) return;

    if (editingProduct) {
      // Update existing
      const updatedList = products.map((p) => {
        if (p.id === editingProduct.id) {
          const delta = (formProduct.stock ?? p.stock) - p.stock;
          if (delta !== 0) {
            onRecordMovement({
              id: `mov-${Date.now()}`,
              productId: p.id,
              productName: formProduct.name!,
              type: 'adjustment',
              delta,
              newStock: formProduct.stock ?? p.stock,
              reason: 'Manual Inventory Edit',
              timestamp: new Date().toISOString(),
            });
          }
          return {
            ...p,
            ...formProduct,
            price: Number(formProduct.price),
            cost: Number(formProduct.cost || 0),
            stock: Number(formProduct.stock ?? p.stock),
            minStockAlert: Number(formProduct.minStockAlert || 5),
          } as Product;
        }
        return p;
      });
      setProducts(updatedList);
      setEditingProduct(null);
    } else {
      // Create new
      const newSku = formProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBarcode = formProduct.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formProduct.name!,
        sku: newSku,
        barcode: newBarcode,
        category: formProduct.category || 'Fresh Produce',
        price: Number(formProduct.price),
        cost: Number(formProduct.cost || 0),
        stock: Number(formProduct.stock || 0),
        minStockAlert: Number(formProduct.minStockAlert || 5),
        unit: (formProduct.unit as any) || 'each',
        isTaxable: !!formProduct.isTaxable,
        notes: formProduct.notes || '',
      };
      setProducts([newProduct, ...products]);
      onRecordMovement({
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'restock',
        delta: newProduct.stock,
        newStock: newProduct.stock,
        reason: 'Initial Stock on Creation',
        timestamp: new Date().toISOString(),
      });
      setShowAddModal(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormProduct({ ...product });
  };

  // Open Adjust Modal
  const handleOpenAdjust = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustDelta(10);
    setAdjustType('add');
    setAdjustReason('Shipment Received');
  };

  // Confirm stock adjustment
  const handleConfirmAdjust = () => {
    if (!adjustingProduct) return;
    const finalDelta = adjustType === 'add' ? Math.abs(adjustDelta) : -Math.abs(adjustDelta);
    const newStock = Math.max(0, adjustingProduct.stock + finalDelta);

    const updated = products.map((p) => {
      if (p.id === adjustingProduct.id) {
        return { ...p, stock: newStock };
      }
      return p;
    });

    setProducts(updated);
    onRecordMovement({
      id: `mov-${Date.now()}`,
      productId: adjustingProduct.id,
      productName: adjustingProduct.name,
      type: adjustType === 'add' ? 'restock' : 'adjustment',
      delta: finalDelta,
      newStock,
      reason: adjustReason,
      timestamp: new Date().toISOString(),
    });

    setAdjustingProduct(null);
  };

  // Delete product
  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Permanently remove "${name}" from inventory catalog?`)) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  // Export inventory CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Barcode', 'Category', 'Unit', 'Price', 'Cost', 'Stock', 'MinAlert', 'Taxable'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode,
      `"${p.category}"`,
      p.unit,
      p.price.toFixed(2),
      p.cost.toFixed(2),
      p.stock,
      p.minStockAlert,
      p.isTaxable ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden bg-neutral-900 p-4 lg:p-6 space-y-4">
      {/* SECTION 1: INVENTORY KPI SUMMARY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Total SKUs
          </span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">
            {metrics.totalCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums mt-1 block">
            {metrics.lowCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Out of Stock
          </span>
          <span className="text-2xl font-mono font-bold text-red-400 tabular-nums mt-1 block">
            {metrics.outCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Retail Stock Value
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums mt-1 block">
            {formatCurrency(metrics.totalRetail, settings.currency)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Cost Valuation
          </span>
          <span className="text-2xl font-mono font-bold text-neutral-300 tabular-nums mt-1 block">
            {formatCurrency(metrics.totalCost, settings.currency)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Est. Gross Margin
          </span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">
            {metrics.margin}%
          </span>
        </div>
      </div>

      {/* SECTION 2: TOOLBAR CONTROLS */}
      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Stock status filter tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                stockFilter === 'all' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                stockFilter === 'low' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                stockFilter === 'out' ? 'bg-red-500/20 text-red-300 font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMovementsModal(true)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            title="View Stock Movement Audit Trail"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            <span>Audit Log</span>
          </button>

          <button
            onClick={() => setShowLabelsModal(true)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            title="Print Shelf Barcode Labels"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print Shelf Labels</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setFormProduct({
                name: '',
                sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
                category: 'Fresh Produce',
                price: 2.99,
                cost: 1.20,
                stock: 25,
                minStockAlert: 5,
                unit: 'each',
                isTaxable: false,
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: PRODUCT TABLE */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-900/90 text-neutral-400 sticky top-0 z-10 border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Product Name</th>
              <th className="py-3 px-3 font-semibold">Category</th>
              <th className="py-3 px-3 font-semibold font-mono">SKU / Barcode</th>
              <th className="py-3 px-3 font-semibold text-right">Cost</th>
              <th className="py-3 px-3 font-semibold text-right">Price</th>
              <th className="py-3 px-3 font-semibold text-right">Margin</th>
              <th className="py-3 px-3 font-semibold text-center">Current Stock</th>
              <th className="py-3 px-3 font-semibold text-center">Tax</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-500">
                  No inventory records match the current filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const marginVal = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : '0';
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock <= p.minStockAlert && !isOutOfStock;

                return (
                  <tr key={p.id} className="hover:bg-neutral-900/50 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.name}</div>
                      {p.notes && <div className="text-[11px] text-neutral-500 truncate max-w-xs">{p.notes}</div>}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-neutral-300">
                      <span>{p.category}</span>
                    </td>

                    {/* SKU & Barcode */}
                    <td className="py-3 px-3 font-mono text-[11px] text-neutral-400">
                      <div>{p.sku}</div>
                      <div className="text-neutral-500 text-[10px]">{p.barcode}</div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-3 text-right font-mono text-neutral-400 tabular-nums">
                      {formatCurrency(p.cost, settings.currency)}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white tabular-nums">
                      {formatCurrency(p.price, settings.currency)}
                      <span className="text-[10px] text-neutral-500 ml-0.5">/{p.unit}</span>
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 tabular-nums">
                      {marginVal}%
                    </td>

                    {/* Stock & Alert */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                        <span className={`text-xs font-bold ${
                          isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-neutral-200'
                        }`}>
                          {p.stock}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase">{p.unit}</span>
                        {isLowStock && (
                          <span title={`Low stock alert (threshold: ${p.minStockAlert})`} className="text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] font-sans px-1.5 py-0.2 bg-red-500/20 text-red-300 rounded">
                            Empty
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Taxable */}
                    <td className="py-3 px-3 text-center text-[11px] text-neutral-400">
                      {p.isTaxable ? <span className="text-emerald-400">Yes</span> : <span>No</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Adjust or restock inventory count"
                        >
                          Stock +/-
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <h3 className="text-base font-semibold text-white">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Honeycrisp Apples"
                  value={formProduct.name}
                  onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    list="cat-datalist"
                    value={formProduct.category}
                    onChange={(e) => setFormProduct({ ...formProduct, category: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <datalist id="cat-datalist">
                    <option value="Fresh Produce" />
                    <option value="Bakery & Deli" />
                    <option value="Dairy & Eggs" />
                    <option value="Beverages" />
                    <option value="Pantry & Dry Goods" />
                    <option value="Household & Care" />
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Unit Type
                  </label>
                  <select
                    value={formProduct.unit}
                    onChange={(e) => setFormProduct({ ...formProduct, unit: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="each">Each (Unit)</option>
                    <option value="lb">Pound (lb - Scale)</option>
                    <option value="kg">Kilogram (kg - Scale)</option>
                    <option value="pack">Pack / Bundle</option>
                    <option value="bunch">Bunch</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formProduct.sku}
                    onChange={(e) => setFormProduct({ ...formProduct, sku: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Barcode Number
                  </label>
                  <input
                    type="text"
                    value={formProduct.barcode}
                    onChange={(e) => setFormProduct({ ...formProduct, barcode: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Selling Price ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formProduct.price}
                    onChange={(e) => setFormProduct({ ...formProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Unit Cost ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formProduct.cost}
                    onChange={(e) => setFormProduct({ ...formProduct, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Initial / Current Stock
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formProduct.stock}
                    onChange={(e) => setFormProduct({ ...formProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Min Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formProduct.minStockAlert}
                    onChange={(e) => setFormProduct({ ...formProduct, minStockAlert: parseInt(e.target.value, 10) || 5 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={formProduct.isTaxable}
                    onChange={(e) => setFormProduct({ ...formProduct, isTaxable: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-950 text-emerald-500 w-4 h-4 focus:ring-0"
                  />
                  <span>Subject to Sales Tax ({settings.taxRate}%)</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Product Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Supplier origin, organic certifications, storage shelf..."
                  value={formProduct.notes}
                  onChange={(e) => setFormProduct({ ...formProduct, notes: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK ADJUST / RESTOCK */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-semibold text-white">Adjust Stock Count</h3>
                <p className="text-xs text-neutral-400">{adjustingProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="text-neutral-400">Current On-Hand Stock:</span>
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {adjustingProduct.stock} {adjustingProduct.unit}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    adjustType === 'add'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  + Restock (Add Stock)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    adjustType === 'remove'
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  - Deduct (Damage / Loss)
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Quantity Delta
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Shipment Received">Shipment / Restock Received</option>
                  <option value="Inventory Audit Recount">Inventory Audit Recount</option>
                  <option value="Damaged / Expired / Spoilage">Damaged / Expired / Spoilage</option>
                  <option value="Customer Return">Customer Return</option>
                  <option value="Internal Store Use">Internal Store Use</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex justify-between">
                <span className="text-neutral-400">Projected New Stock:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {Math.max(
                    0,
                    adjustType === 'add'
                      ? adjustingProduct.stock + adjustDelta
                      : adjustingProduct.stock - adjustDelta
                  )}{' '}
                  {adjustingProduct.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INVENTORY MOVEMENT AUDIT TRAIL */}
      {showMovementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Stock Movement Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowMovementsModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-neutral-800">
              {movements.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  No movement records logged yet. Movements automatically register upon sales, restocks, or adjustments.
                </div>
              ) : (
                movements.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{m.productName}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {m.reason} · {new Date(m.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`font-bold ${m.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        New: {m.newStock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE SHELF BARCODE LABELS */}
      {showLabelsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <div>
                <h3 className="text-base font-semibold text-white">Print Shelf Barcode Labels</h3>
                <p className="text-xs text-neutral-400">Ready for shelf placement and optical barcode scanning</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-500 text-neutral-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>Print Labels</span>
                </button>
                <button
                  onClick={() => setShowLabelsModal(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-neutral-950">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => {
                  const barcodeSvg = generateBarcodeSvgPath(p.barcode);
                  return (
                    <div
                      key={p.id}
                      className="bg-white text-neutral-950 p-4 rounded-lg border border-neutral-300 shadow-xs flex flex-col justify-between h-44"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                            {settings.storeName}
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-600">
                            {p.sku}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold leading-tight line-clamp-2 mt-1">
                          {p.name}
                        </h4>
                      </div>

                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-mono font-black tabular-nums">
                          {formatCurrency(p.price, settings.currency)}
                        </span>
                        <span className="text-xs font-bold text-neutral-600 font-mono">
                          /{p.unit}
                        </span>
                      </div>

                      <div className="text-center pt-1 border-t border-neutral-200 mt-2">
                        <svg
                          width="100%"
                          height="28"
                          viewBox={`0 0 ${barcodeSvg.totalWidth} 50`}
                          className="overflow-visible"
                        >
                          <path d={barcodeSvg.pathData} fill="#000000" />
                        </svg>
                        <div className="text-[9px] font-mono tracking-widest text-neutral-600 -mt-0.5">
                          {p.barcode}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRINT CONTAINER FOR LABELS (Visible only in print mode via @media print) */}
      <div id="printable-labels" className="hidden print:grid">
        {products.map((p) => {
          const barcodeSvg = generateBarcodeSvgPath(p.barcode);
          return (
            <div
              key={p.id}
              style={{
                border: '1px solid #ccc',
                padding: '10px',
                breakInside: 'avoid',
                height: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
                  <span>{settings.storeName}</span>
                  <span>{p.sku}</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
                  {p.name}
                </div>
              </div>

              <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
                {formatCurrency(p.price, settings.currency)} /{p.unit}
              </div>

              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <svg width="100%" height="24" viewBox={`0 0 ${barcodeSvg.totalWidth} 50`}>
                  <path d={barcodeSvg.pathData} fill="#000000" />
                </svg>
                <div style={{ fontSize: '9px', fontFamily: 'monospace' }}>{p.barcode}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
