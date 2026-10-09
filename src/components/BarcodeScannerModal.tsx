import React, { useState } from 'react';
import { Product } from '../types';
import { Barcode, Search, X, Check, ScanLine } from 'lucide-react';
import { generateBarcodeSvgPath } from '../utils/barcode';

interface BarcodeScannerModalProps {
  products: Product[];
  onScan: (barcodeOrSku: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  onScan,
  onClose,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onScan(inputVal.trim());
      setInputVal('');
      onClose();
    }
  };

  const handlePickProduct = (product: Product) => {
    onScan(product.barcode);
    onClose();
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.barcode.includes(filterQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Barcode Scanner Simulator</h3>
              <p className="text-xs text-neutral-400">
                Type barcode/SKU or tap any product below to simulate scan
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

        {/* Manual Barcode Input */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/60">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label className="text-xs font-semibold text-neutral-300 block">
              Scan Barcode / Enter SKU
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. 040110000001 or PROD-4011..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="px-4 py-2 bg-emerald-500 text-neutral-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Simulate Scan</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Pick Products with visual barcode preview */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase">
              Quick Barcodes from Store Catalog
            </span>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filter catalog..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {filteredProducts.slice(0, 10).map((prod) => {
              const barcodeSvg = generateBarcodeSvgPath(prod.barcode);
              return (
                <button
                  key={prod.id}
                  onClick={() => handlePickProduct(prod)}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800/50 transition-all text-left flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                      {prod.name}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono mt-0.5">
                      SKU: {prod.sku} · Barcode: {prod.barcode}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end">
                    <svg
                      width="100"
                      height="24"
                      viewBox={`0 0 ${barcodeSvg.totalWidth} 50`}
                      className="opacity-70 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-sm"
                    >
                      <path d={barcodeSvg.pathData} fill="#000000" />
                    </svg>
                    <span className="text-[10px] text-emerald-400 mt-1 font-semibold group-hover:underline">
                      Tap to Scan →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
