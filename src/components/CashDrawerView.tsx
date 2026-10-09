import React, { useState, useMemo } from 'react';
import { CashShift, StoreSettings, SaleTransaction } from '../types';
import { 
  Banknote, 
  DollarSign, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Lock, 
  Unlock,
  RotateCcw
} from 'lucide-react';
import { formatCurrency } from '../utils/receipt';

interface CashDrawerViewProps {
  shifts: CashShift[];
  setShifts: React.Dispatch<React.SetStateAction<CashShift[]>>;
  sales: SaleTransaction[];
  settings: StoreSettings;
}

export const CashDrawerView: React.FC<CashDrawerViewProps> = ({
  shifts,
  setShifts,
  sales,
  settings,
}) => {
  const currentShift = shifts.find((s) => s.isOpen) || shifts[0];

  // Calculate live cash sales for this shift
  const liveCashSales = useMemo(() => {
    if (!currentShift) return 0;
    const shiftOpenTime = new Date(currentShift.openedAt).getTime();
    let totalCash = 0;

    sales.forEach((s) => {
      const sTime = new Date(s.timestamp).getTime();
      if (sTime >= shiftOpenTime && s.status === 'completed') {
        if (s.paymentMethod === 'cash') {
          totalCash += s.total;
        } else if (s.paymentMethod === 'split' && s.paymentDetails.splitCash) {
          totalCash += s.paymentDetails.splitCash;
        }
      }
    });

    return totalCash;
  }, [sales, currentShift]);

  const expectedCash = (currentShift?.openingCash || 0) + liveCashSales - (currentShift?.cashDrops || 0);

  // Cash denomination counter
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '100': 1,
    '50': 2,
    '20': 5,
    '10': 8,
    '5': 10,
    '1': 20,
    'coins': 18.45,
  });

  const physicalCountTotal = useMemo(() => {
    return (
      (denominations['100'] || 0) * 100 +
      (denominations['50'] || 0) * 50 +
      (denominations['20'] || 0) * 20 +
      (denominations['10'] || 0) * 10 +
      (denominations['5'] || 0) * 5 +
      (denominations['1'] || 0) * 1 +
      (denominations['coins'] || 0)
    );
  }, [denominations]);

  const discrepancy = Number((physicalCountTotal - expectedCash).toFixed(2));

  // Cash drop / payout form state
  const [showDropModal, setShowDropModal] = useState(false);
  const [dropAmount, setDropAmount] = useState('100.00');
  const [dropReason, setDropReason] = useState('Safe Drop (Excess Cash)');

  // Handle cash drop
  const handleRecordDrop = () => {
    const val = parseFloat(dropAmount) || 0;
    if (val <= 0 || !currentShift) return;

    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === currentShift.id) {
          return {
            ...s,
            cashDrops: (s.cashDrops || 0) + val,
            notes: (s.notes ? s.notes + '; ' : '') + `Drop: ${formatCurrency(val, settings.currency)} (${dropReason})`,
          };
        }
        return s;
      })
    );

    setShowDropModal(false);
  };

  // Close shift / start new shift
  const handleToggleShift = () => {
    if (currentShift.isOpen) {
      if (window.confirm('Close this shift and reconcile cash drawer?')) {
        setShifts((prev) =>
          prev.map((s) => {
            if (s.id === currentShift.id) {
              return {
                ...s,
                isOpen: false,
                closedAt: new Date().toISOString(),
                actualCash: physicalCountTotal,
                discrepancy,
              };
            }
            return s;
          })
        );
      }
    } else {
      const openFloatStr = prompt('Enter Opening Cash Float for new shift:', '250.00');
      const openFloat = parseFloat(openFloatStr || '250') || 250;
      const newShift: CashShift = {
        id: `shift-${Date.now()}`,
        openedAt: new Date().toISOString(),
        openingCash: openFloat,
        cashSales: 0,
        cashDrops: 0,
        expectedCash: openFloat,
        cashierName: settings.cashierName,
        isOpen: true,
      };
      setShifts([newShift, ...shifts]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-y-auto bg-neutral-900 p-4 lg:p-6 space-y-5">
      {/* SECTION 1: SHIFT STATUS HEADER */}
      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            currentShift?.isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
          }`}>
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Register Cash Drawer</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                currentShift?.isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {currentShift?.isOpen ? 'SHIFT ACTIVE' : 'SHIFT CLOSED'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              Cashier: {currentShift?.cashierName} · Opened: {new Date(currentShift?.openedAt || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDropModal(true)}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
          >
            <ArrowDownRight className="w-4 h-4 text-amber-400" />
            <span>Drop Cash to Safe</span>
          </button>

          <button
            onClick={handleToggleShift}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              currentShift?.isOpen
                ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
            }`}
          >
            {currentShift?.isOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{currentShift?.isOpen ? 'Reconcile & Close Shift' : 'Open New Register Shift'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: DRAWER FINANCIAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Opening Cash Float
          </span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">
            {formatCurrency(currentShift?.openingCash || 0, settings.currency)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Start of shift drawer cash</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Cash Sales Added
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums mt-1 block">
            +{formatCurrency(liveCashSales, settings.currency)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Tendered in cash transactions</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Cash Drops / Payouts
          </span>
          <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums mt-1 block">
            -{formatCurrency(currentShift?.cashDrops || 0, settings.currency)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Transferred to store safe</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Expected in Drawer
          </span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">
            {formatCurrency(expectedCash, settings.currency)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Float + Sales - Drops</span>
        </div>
      </div>

      {/* SECTION 3: PHYSICAL COUNT RECONCILIATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Denomination Counter */}
        <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 lg:col-span-2 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Physical Cash Drawer Count
            </h4>
            <p className="text-xs text-neutral-400">
              Count bills and coins in cash drawer slots to reconcile expected cash
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: '$100 Bills', key: '100', multiplier: 100 },
              { label: '$50 Bills', key: '50', multiplier: 50 },
              { label: '$20 Bills', key: '20', multiplier: 20 },
              { label: '$10 Bills', key: '10', multiplier: 10 },
              { label: '$5 Bills', key: '5', multiplier: 5 },
              { label: '$1 Bills', key: '1', multiplier: 1 },
              { label: 'Coins ($ total)', key: 'coins', isCoins: true },
            ].map((d) => (
              <div key={d.key} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-300 font-medium block">{d.label}</span>
                <input
                  type="number"
                  step={d.isCoins ? '0.01' : '1'}
                  min="0"
                  value={denominations[d.key] || 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDenominations({ ...denominations, [d.key]: val });
                  }}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
                />
                <span className="text-[10px] text-neutral-500 font-mono block">
                  Subtotal: {formatCurrency(
                    d.isCoins ? denominations['coins'] || 0 : (denominations[d.key] || 0) * (d.multiplier || 1),
                    settings.currency
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliation Status Card */}
        <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Shift Reconciliation
              </h4>
              <p className="text-xs text-neutral-400">Drawer variance calculation</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Expected Drawer Total:</span>
                <span className="font-mono text-white tabular-nums">
                  {formatCurrency(expectedCash, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Actual Counted Total:</span>
                <span className="font-mono text-white font-bold tabular-nums">
                  {formatCurrency(physicalCountTotal, settings.currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold">
                <span className="text-neutral-300">Variance / Discrepancy:</span>
                <span className={`font-mono text-sm tabular-nums ${
                  Math.abs(discrepancy) < 0.01
                    ? 'text-emerald-400'
                    : discrepancy > 0
                    ? 'text-blue-400'
                    : 'text-red-400'
                }`}>
                  {discrepancy > 0 ? `+${formatCurrency(discrepancy, settings.currency)} (Over)` : discrepancy < 0 ? `${formatCurrency(discrepancy, settings.currency)} (Short)` : 'Balanced ($0.00)'}
                </span>
              </div>
            </div>

            {Math.abs(discrepancy) < 0.01 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cash drawer is exactly balanced with sales ledger.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Drawer is {discrepancy > 0 ? 'over' : 'short'} by {formatCurrency(Math.abs(discrepancy), settings.currency)}. Please double check bills.
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print End-of-Shift Z-Report</span>
          </button>
        </div>
      </div>

      {/* CASH DROP MODAL */}
      {showDropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Record Safe Drop / Payout</h3>
            <p className="text-xs text-neutral-400">
              Remove excess bills from register drawer and deposit into the store drop safe.
            </p>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Drop Amount ({settings.currency})
              </label>
              <input
                type="number"
                step="5"
                min="1"
                value={dropAmount}
                onChange={(e) => setDropAmount(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Reason / Memo
              </label>
              <input
                type="text"
                value={dropReason}
                onChange={(e) => setDropReason(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDropModal(false)}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordDrop}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
              >
                Confirm Cash Drop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
