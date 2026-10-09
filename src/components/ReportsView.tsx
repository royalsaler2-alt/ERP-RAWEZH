import React, { useState, useMemo } from 'react';
import { SaleTransaction, Product, StoreSettings } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  RotateCcw, 
  Printer, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ArrowUpRight,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../utils/receipt';
import { ReceiptModal } from './ReceiptModal';

interface ReportsViewProps {
  sales: SaleTransaction[];
  products: Product[];
  settings: StoreSettings;
  onRefundSale: (saleId: string, reason: string) => void;
}

type DatePreset = 'today' | 'yesterday' | '7days' | 'month' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  products,
  settings,
  onRefundSale,
}) => {
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Reprint modal state
  const [reprintSale, setReprintSale] = useState<SaleTransaction | null>(null);

  // Refund prompt state
  const [refundTargetId, setRefundTargetId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<string>('Customer Dissatisfaction / Return');

  // Filter sales based on date preset
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 3600 * 1000;
    const sevenDaysAgo = todayStart - 6 * 24 * 3600 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((s) => {
      const saleTime = new Date(s.timestamp).getTime();

      let matchesDate = true;
      if (datePreset === 'today') {
        matchesDate = saleTime >= todayStart;
      } else if (datePreset === 'yesterday') {
        matchesDate = saleTime >= yesterdayStart && saleTime < todayStart;
      } else if (datePreset === '7days') {
        matchesDate = saleTime >= sevenDaysAgo;
      } else if (datePreset === 'month') {
        matchesDate = saleTime >= monthStart;
      } else if (customStart && customEnd) {
        const cStart = new Date(customStart).getTime();
        const cEnd = new Date(customEnd).getTime() + 24 * 3600 * 1000;
        matchesDate = saleTime >= cStart && saleTime <= cEnd;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.receiptNumber.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q));

      const matchesMethod =
        selectedMethodFilter === 'all' || s.paymentMethod === selectedMethodFilter;

      return matchesDate && matchesSearch && matchesMethod;
    });
  }, [sales, datePreset, customStart, customEnd, searchQuery, selectedMethodFilter]);

  // Aggregate Reporting KPIs
  const kpis = useMemo(() => {
    let grossSales = 0;
    let netSales = 0;
    let taxCollected = 0;
    let discountsGiven = 0;
    let totalItems = 0;
    let totalCost = 0;
    let completedCount = 0;
    let refundedCount = 0;

    const prodCostMap = new Map(products.map((p) => [p.id, p.cost]));

    filteredSales.forEach((s) => {
      if (s.status === 'completed') {
        completedCount++;
        grossSales += s.subtotal + s.discountTotal;
        netSales += s.total;
        taxCollected += s.taxTotal;
        discountsGiven += s.discountTotal;

        s.items.forEach((item) => {
          const qty = item.weight || item.quantity;
          totalItems += qty;
          const unitCost = prodCostMap.get(item.product.id) || item.product.cost || 0;
          totalCost += unitCost * qty;
        });
      } else if (s.status === 'refunded') {
        refundedCount++;
      }
    });

    const grossProfit = Math.max(0, netSales - taxCollected - totalCost);
    const profitMargin = netSales > 0 ? (grossProfit / (netSales - taxCollected)) * 100 : 0;
    const avgBasket = completedCount > 0 ? netSales / completedCount : 0;

    return {
      grossSales,
      netSales,
      taxCollected,
      discountsGiven,
      grossProfit,
      profitMargin: Number(profitMargin.toFixed(1)),
      completedCount,
      refundedCount,
      totalItems: Math.round(totalItems),
      avgBasket,
    };
  }, [filteredSales, products]);

  // Hourly Sales Volume Breakdown
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
    const counts = new Map<number, number>();
    const revenues = new Map<number, number>();

    hours.forEach((h) => {
      counts.set(h, 0);
      revenues.set(h, 0);
    });

    filteredSales.forEach((s) => {
      if (s.status === 'completed') {
        const h = new Date(s.timestamp).getHours();
        if (counts.has(h)) {
          counts.set(h, (counts.get(h) || 0) + 1);
          revenues.set(h, (revenues.get(h) || 0) + s.total);
        }
      }
    });

    const maxRev = Math.max(...Array.from(revenues.values()), 1);

    return hours.map((h) => ({
      hour: h,
      label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`,
      revenue: revenues.get(h) || 0,
      count: counts.get(h) || 0,
      pct: ((revenues.get(h) || 0) / maxRev) * 100,
    }));
  }, [filteredSales]);

  // Category Sales Share
  const categoryShare = useMemo(() => {
    const catMap = new Map<string, number>();

    filteredSales.forEach((s) => {
      if (s.status === 'completed') {
        s.items.forEach((it) => {
          const rev = it.unitPrice * (it.weight || it.quantity);
          const cat = it.product.category || 'General';
          catMap.set(cat, (catMap.get(cat) || 0) + rev);
        });
      }
    });

    const totalRev = Array.from(catMap.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(catMap.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: Number(((amount / totalRev) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredSales]);

  // Top 5 Best-Selling Products
  const topProducts = useMemo(() => {
    const pMap = new Map<string, { product: Product; units: number; revenue: number }>();

    filteredSales.forEach((s) => {
      if (s.status === 'completed') {
        s.items.forEach((it) => {
          const key = it.product.id;
          const units = it.weight || it.quantity;
          const rev = it.unitPrice * units;

          if (!pMap.has(key)) {
            pMap.set(key, { product: it.product, units, revenue: rev });
          } else {
            const current = pMap.get(key)!;
            current.units += units;
            current.revenue += rev;
          }
        });
      }
    });

    return Array.from(pMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  // Payment Methods Breakdown
  const paymentBreakdown = useMemo(() => {
    const map = { cash: 0, card: 0, mobile: 0, split: 0 };
    let total = 0;

    filteredSales.forEach((s) => {
      if (s.status === 'completed') {
        map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total;
        total += s.total;
      }
    });

    return [
      { name: 'Credit & Debit Card', key: 'card', amount: map.card, icon: CreditCard, pct: total > 0 ? (map.card / total) * 100 : 0 },
      { name: 'Cash Register Tender', key: 'cash', amount: map.cash, icon: Banknote, pct: total > 0 ? (map.cash / total) * 100 : 0 },
      { name: 'Apple / Google Pay', key: 'mobile', amount: map.mobile, icon: Smartphone, pct: total > 0 ? (map.mobile / total) * 100 : 0 },
      { name: 'Split Tender', key: 'split', amount: map.split, icon: RotateCcw, pct: total > 0 ? (map.split / total) * 100 : 0 },
    ];
  }, [filteredSales]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ReceiptNumber',
      'Date',
      'Cashier',
      'Customer',
      'ItemsCount',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
      'PaymentMethod',
      'Status',
    ];

    const rows = filteredSales.map((s) => [
      s.receiptNumber,
      `"${new Date(s.timestamp).toLocaleString()}"`,
      `"${s.cashierName}"`,
      `"${s.customerName || 'Walk-in'}"`,
      s.items.length,
      s.subtotal.toFixed(2),
      s.discountTotal.toFixed(2),
      s.taxTotal.toFixed(2),
      s.total.toFixed(2),
      s.paymentMethod,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-y-auto bg-neutral-900 p-4 lg:p-6 space-y-5">
      {/* SECTION 1: TIME PERIOD SELECTOR & ACTIONS */}
      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        {/* Date presets */}
        <div className="flex items-center gap-1 p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs overflow-x-auto">
          <button
            onClick={() => setDatePreset('today')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              datePreset === 'today'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDatePreset('yesterday')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              datePreset === 'yesterday'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setDatePreset('7days')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              datePreset === '7days'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDatePreset('month')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              datePreset === 'month'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDatePreset('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              datePreset === 'all'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            All History
          </button>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales CSV</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: HIGH-LEVEL KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Net Sales Revenue
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums mt-1 block">
            {formatCurrency(kpis.netSales, settings.currency)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">
            Gross: {formatCurrency(kpis.grossSales, settings.currency)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Est. Gross Profit
          </span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">
            {formatCurrency(kpis.grossProfit, settings.currency)}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
            Margin: {kpis.profitMargin}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Transactions
          </span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">
            {kpis.completedCount}
          </span>
          {kpis.refundedCount > 0 && (
            <span className="text-[10px] text-red-400 font-mono mt-1 block">
              {kpis.refundedCount} refunded
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Avg. Basket Size
          </span>
          <span className="text-2xl font-mono font-bold text-neutral-200 tabular-nums mt-1 block">
            {formatCurrency(kpis.avgBasket, settings.currency)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Per checkout</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Total Items Sold
          </span>
          <span className="text-2xl font-mono font-bold text-neutral-200 tabular-nums mt-1 block">
            {kpis.totalItems}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Units &amp; weighed lbs</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Sales Tax Collected
          </span>
          <span className="text-2xl font-mono font-bold text-neutral-300 tabular-nums mt-1 block">
            {formatCurrency(kpis.taxCollected, settings.currency)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Rate: {settings.taxRate}%</span>
        </div>
      </div>

      {/* SECTION 3: VISUAL REAL-TIME CHARTS & BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Hourly Sales Volume */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Hourly Rush &amp; Peak Periods
              </h4>
              <p className="text-[11px] text-neutral-400">Sales revenue distribution throughout the day</p>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-neutral-800">
            {hourlyData.map((h) => (
              <div
                key={h.hour}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                <div
                  style={{ height: `${Math.max(6, h.pct)}%` }}
                  className={`w-full rounded-t transition-all ${
                    h.revenue > 0
                      ? 'bg-emerald-500/80 group-hover:bg-emerald-400'
                      : 'bg-neutral-800/40'
                  }`}
                />
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-neutral-800 border border-neutral-700 text-[10px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap z-20 text-white">
                  {h.label}: {formatCurrency(h.revenue, settings.currency)} ({h.count} sales)
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-2">
            {hourlyData.filter((_, idx) => idx % 2 === 0).map((h) => (
              <span key={h.hour}>{h.label}</span>
            ))}
          </div>
        </div>

        {/* Chart 2: Category Department Share */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Department Sales Share
            </h4>
            <p className="text-[11px] text-neutral-400">Revenue split across inventory categories</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {categoryShare.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No sales in this timeframe.</p>
            ) : (
              categoryShare.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 font-medium">{cat.category}</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {formatCurrency(cat.amount, settings.currency)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: PAYMENT BREAKDOWN & TOP 5 BESTSELLERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Tender &amp; Payment Distribution
          </h4>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {paymentBreakdown.map((pm) => {
              const Icon = pm.icon;
              return (
                <div key={pm.key} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs font-medium">{pm.name}</span>
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-white tabular-nums mt-1">
                    {formatCurrency(pm.amount, settings.currency)}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {pm.pct.toFixed(1)}% of total receipts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Bestsellers */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Top 5 Products by Revenue
          </h4>
          <div className="divide-y divide-neutral-800/80">
            {topProducts.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No item data recorded yet.</p>
            ) : (
              topProducts.map((tp, idx) => (
                <div key={tp.product.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-neutral-500 text-xs w-4">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{tp.product.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {tp.units.toFixed(tp.product.unit === 'lb' ? 1 : 0)} {tp.product.unit} sold · {tp.product.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(tp.revenue, settings.currency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5: SALES TRANSACTIONS AUDIT LEDGER */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
        {/* Ledger Header Bar */}
        <div className="p-3.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-950">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Sales Transaction Journal ({filteredSales.length})
            </h4>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Receipt # or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Method filter */}
            <select
              value={selectedMethodFilter}
              onChange={(e) => setSelectedMethodFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1 focus:outline-hidden"
            >
              <option value="all">All Tender Types</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Pay</option>
              <option value="split">Split</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold font-mono">Receipt #</th>
                <th className="py-2.5 px-3 font-semibold">Date &amp; Time</th>
                <th className="py-2.5 px-3 font-semibold">Cashier</th>
                <th className="py-2.5 px-3 font-semibold">Customer</th>
                <th className="py-2.5 px-3 font-semibold text-center">Items</th>
                <th className="py-2.5 px-3 font-semibold">Tender</th>
                <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-neutral-500">
                    No transactions match the current query.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;

                  return (
                    <React.Fragment key={sale.id}>
                      <tr className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          #{sale.receiptNumber}
                        </td>
                        <td className="py-3 px-3 text-neutral-300">
                          {new Date(sale.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-neutral-400">
                          {sale.cashierName}
                        </td>
                        <td className="py-3 px-3 text-neutral-300">
                          {sale.customerName || <span className="text-neutral-500">Walk-in</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          {sale.items.length}
                        </td>
                        <td className="py-3 px-3 uppercase font-mono text-[11px] text-neutral-300">
                          {sale.paymentMethod}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white tabular-nums">
                          {formatCurrency(sale.total, settings.currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sale.status === 'completed' ? (
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              PAID
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                              REFUNDED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setReprintSale(sale)}
                              className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                              title="Reprint receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            </button>

                            {sale.status === 'completed' && (
                              <button
                                onClick={() => setRefundTargetId(sale.id)}
                                className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
                                title="Void or refund transaction"
                              >
                                Refund
                              </button>
                            )}

                            <button
                              onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                              className="p-1 rounded text-neutral-400 hover:text-white"
                              title="Toggle line items"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded line items drawer */}
                      {isExpanded && (
                        <tr className="bg-neutral-900/80">
                          <td colSpan={9} className="p-4">
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
                              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                Line Items in #{sale.receiptNumber}
                              </div>
                              <div className="divide-y divide-neutral-800/80 text-xs">
                                {sale.items.map((it, idx) => {
                                  const lineTotal = it.unitPrice * (it.weight || it.quantity);
                                  return (
                                    <div key={idx} className="py-1.5 flex justify-between items-center">
                                      <div>
                                        <span className="font-semibold text-white">{it.product.name}</span>
                                        <span className="text-neutral-400 ml-2 font-mono text-[11px]">
                                          {it.weight ? `${it.weight.toFixed(2)} ${it.product.unit}` : `${it.quantity}x`} @ {formatCurrency(it.unitPrice, settings.currency)}
                                        </span>
                                      </div>
                                      <span className="font-mono text-white tabular-nums">
                                        {formatCurrency(lineTotal, settings.currency)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="pt-2 border-t border-neutral-800 flex justify-between text-xs text-neutral-400 font-mono">
                                <div>Subtotal: {formatCurrency(sale.subtotal, settings.currency)} · Tax: {formatCurrency(sale.taxTotal, settings.currency)}</div>
                                <div className="text-white font-bold">Total: {formatCurrency(sale.total, settings.currency)}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPRINT RECEIPT MODAL */}
      {reprintSale && (
        <ReceiptModal
          sale={reprintSale}
          settings={settings}
          isReprint={true}
          onClose={() => setReprintSale(null)}
        />
      )}

      {/* REFUND TRANSACTION CONFIRMATION MODAL */}
      {refundTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white">Refund / Void Transaction</h3>
            </div>

            <p className="text-xs text-neutral-300">
              This will mark the receipt as refunded and automatically restock items back into inventory.
            </p>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Reason for Refund
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
              >
                <option value="Customer Dissatisfaction / Return">Customer Dissatisfaction / Return</option>
                <option value="Wrong Item Purchased">Wrong Item Purchased</option>
                <option value="Spoiled or Damaged Item">Spoiled or Damaged Item</option>
                <option value="Cashier Ring Error / Duplicate">Cashier Ring Error / Duplicate</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundTargetId(null)}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRefundSale(refundTargetId, refundReason);
                  setRefundTargetId(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-colors"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
