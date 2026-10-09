import React, { useState } from 'react';
import { Product, StoreSettings } from '../types';
import { Scale, X, Check, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../utils/receipt';

interface WeightScaleModalProps {
  product: Product;
  settings: StoreSettings;
  onConfirm: (product: Product, weight: number) => void;
  onClose: () => void;
}

export const WeightScaleModal: React.FC<WeightScaleModalProps> = ({
  product,
  settings,
  onConfirm,
  onClose,
}) => {
  const [weightStr, setWeightStr] = useState<string>('1.00');

  const weightNum = parseFloat(weightStr) || 0;
  const totalPrice = weightNum * product.price;

  const handlePreset = (val: number) => {
    setWeightStr(val.toFixed(2));
  };

  const handleKeypad = (char: string) => {
    if (char === 'clear') {
      setWeightStr('0.00');
      return;
    }
    if (char === 'backspace') {
      if (weightStr.length <= 1) {
        setWeightStr('0');
      } else {
        setWeightStr(weightStr.slice(0, -1));
      }
      return;
    }
    if (char === '.') {
      if (!weightStr.includes('.')) {
        setWeightStr(weightStr + '.');
      }
      return;
    }
    if (weightStr === '0' || weightStr === '0.00') {
      setWeightStr(char);
    } else {
      // Limit to 2 decimal places
      const parts = weightStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setWeightStr(weightStr + char);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (weightNum > 0) {
      onConfirm(product, weightNum);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{product.name}</h3>
              <p className="text-xs text-neutral-400">
                Rate: {formatCurrency(product.price, settings.currency)} / {product.unit} · SKU: {product.sku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital Scale Readout Display */}
        <div className="p-6 space-y-5">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-neutral-400 tracking-wider">
                MEASURED NET WEIGHT
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-mono font-bold tracking-tight text-emerald-400 tabular-nums">
                  {weightNum.toFixed(2)}
                </span>
                <span className="text-lg font-medium text-neutral-400 font-mono uppercase">
                  {product.unit}
                </span>
              </div>
            </div>
            <div className="text-right border-l border-neutral-800 pl-4">
              <div className="text-[11px] font-semibold text-neutral-400 tracking-wider">
                ITEM AMOUNT
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums mt-1">
                {formatCurrency(totalPrice, settings.currency)}
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Quick Weights</label>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1.0, 1.5, 2.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    Math.abs(weightNum - preset) < 0.001
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {preset.toFixed(2)} {product.unit}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypad(key)}
                className="py-3 rounded-xl bg-neutral-800 text-lg font-mono font-semibold text-white hover:bg-neutral-700 active:scale-98 transition-all"
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypad('backspace')}
              className="py-3 rounded-xl bg-neutral-800 text-sm font-medium text-neutral-300 hover:bg-neutral-700 flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={weightNum <= 0}
              onClick={() => handleSubmit()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-sm hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Add to Cart ({formatCurrency(totalPrice, settings.currency)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
