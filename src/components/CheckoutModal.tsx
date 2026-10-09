import React, { useState } from 'react';
import { PaymentMethod, PaymentDetails, StoreSettings } from '../types';
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Split, 
  X, 
  Check, 
  CheckCircle2, 
  RotateCcw,
  User,
  Phone
} from 'lucide-react';
import { formatCurrency } from '../utils/receipt';
import { soundFX } from '../utils/audio';

interface CheckoutModalProps {
  total: number;
  settings: StoreSettings;
  customerName?: string;
  customerPhone?: string;
  onComplete: (
    method: PaymentMethod,
    details: PaymentDetails,
    custName?: string,
    custPhone?: string
  ) => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  total,
  settings,
  customerName: initialCustName = '',
  customerPhone: initialCustPhone = '',
  onComplete,
  onClose,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashTenderedStr, setCashTenderedStr] = useState<string>(Math.ceil(total).toString());
  const [custName, setCustName] = useState(initialCustName);
  const [custPhone, setCustPhone] = useState(initialCustPhone);

  // Card terminal simulation state
  const [cardStatus, setCardStatus] = useState<'idle' | 'processing' | 'approved'>('idle');
  const [cardLast4, setCardLast4] = useState<string>('4242');

  // Mobile pay state
  const [mobileStatus, setMobileStatus] = useState<'idle' | 'scanning' | 'approved'>('idle');

  // Split payment state
  const [splitCashStr, setSplitCashStr] = useState<string>(
    (Math.floor(total / 2)).toFixed(2)
  );

  const cashTendered = parseFloat(cashTenderedStr) || 0;
  const changeDue = Math.max(0, cashTendered - total);
  const cashShortage = Math.max(0, total - cashTendered);

  const splitCash = parseFloat(splitCashStr) || 0;
  const splitCard = Math.max(0, total - splitCash);

  const handleCashKeypad = (val: string) => {
    if (settings.soundEnabled) soundFX.playClick();
    if (val === 'clear') {
      setCashTenderedStr('0');
      return;
    }
    if (val === 'backspace') {
      if (cashTenderedStr.length <= 1) {
        setCashTenderedStr('0');
      } else {
        setCashTenderedStr(cashTenderedStr.slice(0, -1));
      }
      return;
    }
    if (val === '.') {
      if (!cashTenderedStr.includes('.')) {
        setCashTenderedStr(cashTenderedStr + '.');
      }
      return;
    }
    if (cashTenderedStr === '0') {
      setCashTenderedStr(val);
    } else {
      const parts = cashTenderedStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setCashTenderedStr(cashTenderedStr + val);
    }
  };

  const handleCashPreset = (bill: number) => {
    if (settings.soundEnabled) soundFX.playClick();
    setCashTenderedStr(bill.toString());
  };

  const handleExactCash = () => {
    if (settings.soundEnabled) soundFX.playClick();
    setCashTenderedStr(total.toFixed(2));
  };

  const handleSimulateCard = (last4 = '4821') => {
    if (settings.soundEnabled) soundFX.playClick();
    setCardLast4(last4);
    setCardStatus('processing');
    setTimeout(() => {
      setCardStatus('approved');
      if (settings.soundEnabled) soundFX.playScanBeep();
    }, 900);
  };

  const handleSimulateMobile = () => {
    if (settings.soundEnabled) soundFX.playClick();
    setMobileStatus('scanning');
    setTimeout(() => {
      setMobileStatus('approved');
      if (settings.soundEnabled) soundFX.playScanBeep();
    }, 800);
  };

  const handleFinalize = () => {
    if (settings.soundEnabled) soundFX.playSuccessChime();

    let details: PaymentDetails = {};

    if (method === 'cash') {
      details = {
        cashTendered,
        changeGiven: Number(changeDue.toFixed(2)),
      };
    } else if (method === 'card') {
      details = {
        cardLast4,
        authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        provider: 'Visa EMV Contactless',
      };
    } else if (method === 'mobile') {
      details = {
        provider: 'Apple / Google Pay',
        authCode: `NFC-${Math.floor(10000 + Math.random() * 90000)}`,
      };
    } else if (method === 'split') {
      details = {
        splitCash,
        splitCard,
        cardLast4: '3819',
        authCode: `SPLIT-${Math.floor(1000 + Math.random() * 9000)}`,
      };
    }

    onComplete(method, details, custName.trim() || undefined, custPhone.trim() || undefined);
  };

  const canSubmit = () => {
    if (method === 'cash') {
      return cashTendered >= total - 0.001;
    }
    if (method === 'card') {
      return cardStatus === 'approved';
    }
    if (method === 'mobile') {
      return mobileStatus === 'approved';
    }
    if (method === 'split') {
      return splitCash > 0 && splitCash < total;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase block">
                PAYMENT CHECKOUT
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono tabular-nums text-white">
                  {formatCurrency(total, settings.currency)}
                </span>
                <span className="text-xs text-neutral-400 font-medium">TOTAL DUE</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Method Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-neutral-950/80 border-b border-neutral-800">
          <button
            type="button"
            onClick={() => {
              if (settings.soundEnabled) soundFX.playClick();
              setMethod('cash');
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl gap-1 text-xs font-medium transition-colors ${
              method === 'cash'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Cash</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (settings.soundEnabled) soundFX.playClick();
              setMethod('card');
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl gap-1 text-xs font-medium transition-colors ${
              method === 'card'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Card</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (settings.soundEnabled) soundFX.playClick();
              setMethod('mobile');
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl gap-1 text-xs font-medium transition-colors ${
              method === 'mobile'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>Mobile Pay</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (settings.soundEnabled) soundFX.playClick();
              setMethod('split');
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl gap-1 text-xs font-medium transition-colors ${
              method === 'split'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Split className="w-5 h-5" />
            <span>Split Tender</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* METHOD 1: CASH */}
          {method === 'cash' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Readout & Quick Bills */}
              <div className="space-y-4">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-neutral-400 tracking-wider">
                    CASH TENDERED
                  </div>
                  <div className="text-3xl font-mono font-bold text-white tabular-nums mt-1">
                    {formatCurrency(cashTendered, settings.currency)}
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-neutral-400 tracking-wider">
                    {cashShortage > 0.001 ? 'AMOUNT REMAINING' : 'CHANGE DUE TO CUSTOMER'}
                  </div>
                  <div className={`text-3xl font-mono font-bold tabular-nums mt-1 ${
                    cashShortage > 0.001 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {cashShortage > 0.001
                      ? formatCurrency(cashShortage, settings.currency)
                      : formatCurrency(changeDue, settings.currency)}
                  </div>
                </div>

                {/* Quick Bills Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-medium">Quick Bills</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleExactCash}
                      className="py-2.5 px-2 rounded-lg bg-neutral-800 border border-neutral-700/80 text-xs font-mono font-medium text-emerald-400 hover:bg-neutral-700 transition-colors"
                    >
                      Exact ({formatCurrency(total, settings.currency)})
                    </button>
                    {[10, 20, 50, 100].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => handleCashPreset(bill)}
                        className="py-2.5 px-2 rounded-lg bg-neutral-800 border border-neutral-700/80 text-xs font-mono font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        ${bill} Bill
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleCashPreset(Math.ceil(total / 5) * 5)}
                      className="py-2.5 px-2 rounded-lg bg-neutral-800 border border-neutral-700/80 text-xs font-mono font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
                    >
                      Round ${Math.ceil(total / 5) * 5}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleCashKeypad(digit)}
                    className="py-3.5 rounded-xl bg-neutral-800 text-lg font-mono font-bold text-white hover:bg-neutral-700 active:scale-98 transition-all"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleCashKeypad('backspace')}
                  className="py-3.5 rounded-xl bg-neutral-800 text-sm font-medium text-neutral-300 hover:bg-neutral-700 flex items-center justify-center"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* METHOD 2: CARD */}
          {method === 'card' && (
            <div className="space-y-6">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-emerald-400">
                  <CreditCard className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">EMV Chip & Contactless Reader</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    Customer can tap Visa, Mastercard, Amex or insert chip card on terminal.
                  </p>
                </div>

                {cardStatus === 'idle' && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateCard('4242')}
                      className="px-5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors flex items-center gap-2"
                    >
                      <span>Simulate Tap (Visa •••• 4242)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCard('8812')}
                      className="px-5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors flex items-center gap-2"
                    >
                      <span>Simulate Chip (MC •••• 8812)</span>
                    </button>
                  </div>
                )}

                {cardStatus === 'processing' && (
                  <div className="py-4 space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono text-neutral-300">Authorizing transaction with bank...</p>
                  </div>
                )}

                {cardStatus === 'approved' && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                    <div className="flex items-center justify-center gap-2 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Card Approved</span>
                    </div>
                    <div className="text-xs font-mono text-emerald-300">
                      Card: •••• {cardLast4} · Auth: AUTH-84920
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* METHOD 3: MOBILE PAY */}
          {method === 'mobile' && (
            <div className="space-y-6">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-emerald-400">
                  <Smartphone className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Apple Pay / Google Wallet NFC</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    Hold phone or smartwatch near reader to pay {formatCurrency(total, settings.currency)}.
                  </p>
                </div>

                {mobileStatus === 'idle' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSimulateMobile}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
                    >
                      Simulate Mobile NFC Tap
                    </button>
                  </div>
                )}

                {mobileStatus === 'scanning' && (
                  <div className="py-4 space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono text-neutral-300">Reading contactless credentials...</p>
                  </div>
                )}

                {mobileStatus === 'approved' && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                    <div className="flex items-center justify-center gap-2 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Mobile Payment Verified</span>
                    </div>
                    <div className="text-xs font-mono text-emerald-300">
                      Tokenized Device Card Approved
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* METHOD 4: SPLIT TENDER */}
          {method === 'split' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-neutral-400 uppercase">
                  Divide Payment Between Cash & Card
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Cash Tender Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-neutral-400 font-mono text-sm">{settings.currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={total}
                        value={splitCashStr}
                        onChange={(e) => setSplitCashStr(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Remaining on Card</label>
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-sm">
                      {formatCurrency(splitCard, settings.currency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Optional Customer info on checkout */}
          <div className="pt-2 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-400 font-medium flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5" />
                <span>Customer Name (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Walk-in or Loyalty Name"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-medium flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Customer Phone (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="(415) 555-0100"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-600"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSubmit()}
            onClick={handleFinalize}
            className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Complete Sale &amp; Print Receipt ({formatCurrency(total, settings.currency)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
