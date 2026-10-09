import React, { useState } from 'react';
import { SaleTransaction, StoreSettings } from '../types';
import { Printer, Download, Check, Copy, X, CheckCheck } from 'lucide-react';
import { formatCurrency, generatePlainTextReceipt } from '../utils/receipt';
import { generateBarcodeSvgPath } from '../utils/barcode';

interface ReceiptModalProps {
  sale: SaleTransaction;
  settings: StoreSettings;
  onClose: () => void;
  isReprint?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  onClose,
  isReprint = false,
}) => {
  const [copied, setCopied] = useState(false);

  const barcodeData = generateBarcodeSvgPath(sale.receiptNumber);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const text = generatePlainTextReceipt(sale, settings);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sale.receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async () => {
    const text = generatePlainTextReceipt(sale, settings);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <>
      {/* ON-SCREEN MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto backdrop-blur-xs">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>{isReprint ? 'Reprint Receipt' : 'Transaction Complete'}</span>
                {isReprint && (
                  <span className="text-[11px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                    COPY
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                #{sale.receiptNumber} · {new Date(sale.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Thermal Paper Simulation */}
          <div className="p-6 bg-neutral-950 flex justify-center overflow-y-auto max-h-[65vh]">
            <div className="w-[320px] bg-[#fafafa] text-neutral-900 p-6 rounded-sm shadow-md font-mono text-[12px] leading-relaxed border-t-8 border-t-neutral-800 select-text">
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-neutral-400 space-y-0.5">
                <div className="text-sm font-bold tracking-wider uppercase">
                  {settings.storeName}
                </div>
                <div className="text-[11px] text-neutral-600">{settings.tagline}</div>
                <div className="text-[10px] text-neutral-600">{settings.address}</div>
                <div className="text-[10px] text-neutral-600">Tel: {settings.phone}</div>
                {settings.taxId && (
                  <div className="text-[10px] text-neutral-600">Tax ID: {settings.taxId}</div>
                )}
              </div>

              {/* Transaction Metadata */}
              <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(sale.timestamp).toLocaleDateString()} {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>RECEIPT:</span>
                  <span className="font-bold">#{sale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{sale.cashierName}</span>
                </div>
                {sale.customerName && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="truncate max-w-[150px]">{sale.customerName}</span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="py-3 border-b border-dashed border-neutral-400 space-y-2">
                <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-neutral-300">
                  <span>QTY / ITEM</span>
                  <span>AMOUNT</span>
                </div>
                {sale.items.map((item, idx) => {
                  const lineTotal = item.unitPrice * (item.weight || item.quantity);
                  const qtyLabel = item.weight
                    ? `${item.weight.toFixed(2)} ${item.product.unit} @ ${formatCurrency(item.unitPrice, settings.currency)}`
                    : `${item.quantity} @ ${formatCurrency(item.unitPrice, settings.currency)}`;

                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-neutral-900 leading-tight">
                          {item.product.name}
                        </span>
                        <span className="font-bold tabular-nums ml-2">
                          {formatCurrency(lineTotal, settings.currency)}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-600 flex justify-between">
                        <span>{qtyLabel}</span>
                        {item.product.isTaxable && <span className="text-[9px] uppercase">Tax</span>}
                      </div>
                      {item.discountPercent && item.discountPercent > 0 && (
                        <div className="text-[10px] text-red-600">
                          - Item Discount {item.discountPercent}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals Breakdown */}
              <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span>SUBTOTAL</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(sale.subtotal, settings.currency)}</span>
                </div>
                {sale.discountTotal > 0 && (
                  <div className="flex justify-between text-[11px] text-red-600">
                    <span>ORDER DISCOUNT</span>
                    <span className="tabular-nums">-{formatCurrency(sale.discountTotal, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span>TAX ({settings.taxRate}%)</span>
                  <span className="tabular-nums">{formatCurrency(sale.taxTotal, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-1.5 border-t border-neutral-900 text-neutral-950">
                  <span>TOTAL</span>
                  <span className="tabular-nums">{formatCurrency(sale.total, settings.currency)}</span>
                </div>
              </div>

              {/* Payment Tender details */}
              <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>PAID VIA {sale.paymentMethod.toUpperCase()}</span>
                  <span className="tabular-nums">{formatCurrency(sale.total, settings.currency)}</span>
                </div>
                {sale.paymentMethod === 'cash' && sale.paymentDetails.cashTendered && (
                  <>
                    <div className="flex justify-between text-neutral-600">
                      <span>CASH TENDERED:</span>
                      <span className="tabular-nums">{formatCurrency(sale.paymentDetails.cashTendered, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-900">
                      <span>CHANGE DUE:</span>
                      <span className="tabular-nums">{formatCurrency(sale.paymentDetails.changeGiven || 0, settings.currency)}</span>
                    </div>
                  </>
                )}
                {sale.paymentMethod === 'card' && sale.paymentDetails.cardLast4 && (
                  <>
                    <div className="flex justify-between text-neutral-600">
                      <span>CARD NUMBER:</span>
                      <span>•••• •••• •••• {sale.paymentDetails.cardLast4}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>AUTH CODE:</span>
                      <span>{sale.paymentDetails.authCode || 'APPROVED'}</span>
                    </div>
                  </>
                )}
                {sale.paymentMethod === 'mobile' && (
                  <div className="flex justify-between text-neutral-600">
                    <span>CONTACTLESS:</span>
                    <span>VERIFIED NFC</span>
                  </div>
                )}
                {sale.paymentMethod === 'split' && (
                  <>
                    {sale.paymentDetails.splitCash && (
                      <div className="flex justify-between text-neutral-600">
                        <span>CASH PORTION:</span>
                        <span className="tabular-nums">{formatCurrency(sale.paymentDetails.splitCash, settings.currency)}</span>
                      </div>
                    )}
                    {sale.paymentDetails.splitCard && (
                      <div className="flex justify-between text-neutral-600">
                        <span>CARD PORTION:</span>
                        <span className="tabular-nums">{formatCurrency(sale.paymentDetails.splitCard, settings.currency)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Barcode Section */}
              <div className="py-3 text-center space-y-1">
                <div className="flex justify-center">
                  <svg
                    width="100%"
                    height="45"
                    viewBox={`0 0 ${barcodeData.totalWidth} 50`}
                    className="overflow-visible"
                  >
                    <path d={barcodeData.pathData} fill="#000000" />
                  </svg>
                </div>
                <div className="text-[10px] tracking-widest text-neutral-700">
                  *{sale.receiptNumber}*
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-2 space-y-1 text-[10px] text-neutral-600 border-t border-dashed border-neutral-400">
                <p className="font-medium text-neutral-800">{settings.receiptFooter}</p>
                <p>Returns accepted within 14 days with receipt</p>
                <p className="text-[9px] text-neutral-500 pt-1">
                  Items: {sale.items.reduce((acc, it) => acc + (it.weight ? 1 : it.quantity), 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="px-3 py-2 rounded-xl bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
                title="Copy receipt as plain text"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3 py-2 rounded-xl bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
                title="Download receipt text file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-semibold text-white hover:bg-neutral-700 border border-neutral-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isReprint ? 'Close' : 'Next Sale'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINTABLE CONTAINER (Only visible in browser print preview via @media print) */}
      <div id="printable-receipt" className="hidden print:block">
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{settings.storeName.toUpperCase()}</div>
          <div style={{ fontSize: '10px' }}>{settings.tagline}</div>
          <div style={{ fontSize: '10px' }}>{settings.address}</div>
          <div style={{ fontSize: '10px' }}>Tel: {settings.phone}</div>
          {settings.taxId && <div style={{ fontSize: '10px' }}>Tax ID: {settings.taxId}</div>}
        </div>

        <div style={{ fontSize: '10px', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
          <div>DATE: {new Date(sale.timestamp).toLocaleString()}</div>
          <div>RECEIPT: #{sale.receiptNumber}</div>
          <div>CASHIER: {sale.cashierName}</div>
          {sale.customerName && <div>CUSTOMER: {sale.customerName}</div>}
        </div>

        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          {sale.items.map((item, idx) => {
            const lineTotal = item.unitPrice * (item.weight || item.quantity);
            const qtyText = item.weight
              ? `${item.weight.toFixed(2)} ${item.product.unit} @ ${formatCurrency(item.unitPrice, settings.currency)}`
              : `${item.quantity} x ${formatCurrency(item.unitPrice, settings.currency)}`;
            return (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.product.name}</span>
                  <span>{formatCurrency(lineTotal, settings.currency)}</span>
                </div>
                <div style={{ fontSize: '9px', color: '#444' }}>{qtyText}</div>
              </div>
            );
          })}
        </div>

        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(sale.subtotal, settings.currency)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span>
              <span>-{formatCurrency(sale.discountTotal, settings.currency)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax ({settings.taxRate}%):</span>
            <span>{formatCurrency(sale.taxTotal, settings.currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>{formatCurrency(sale.total, settings.currency)}</span>
          </div>
        </div>

        <div style={{ fontSize: '10px', marginBottom: '8px' }}>
          <div>PAID: {sale.paymentMethod.toUpperCase()}</div>
          {sale.paymentMethod === 'cash' && sale.paymentDetails.cashTendered && (
            <>
              <div>Tendered: {formatCurrency(sale.paymentDetails.cashTendered, settings.currency)}</div>
              <div>Change: {formatCurrency(sale.paymentDetails.changeGiven || 0, settings.currency)}</div>
            </>
          )}
          {sale.paymentMethod === 'card' && sale.paymentDetails.cardLast4 && (
            <div>Card: •••• {sale.paymentDetails.cardLast4} (Auth: {sale.paymentDetails.authCode})</div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <svg width="100%" height="40" viewBox={`0 0 ${barcodeData.totalWidth} 50`}>
            <path d={barcodeData.pathData} fill="#000000" />
          </svg>
          <div style={{ fontSize: '9px', marginTop: '2px' }}>*{sale.receiptNumber}*</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '10px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
          <div>{settings.receiptFooter}</div>
          <div>Thank you for your purchase!</div>
        </div>
      </div>
    </>
  );
};
