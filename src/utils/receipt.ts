import { SaleTransaction, StoreSettings } from '../types';

export function formatCurrency(amount: number, currency = '$'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `${currency}${safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${year}${month}${day}-${randomSuffix}`;
}

export function generatePlainTextReceipt(sale: SaleTransaction, settings: StoreSettings): string {
  const width = 40;
  const line = '-'.repeat(width);
  const doubleLine = '='.repeat(width);

  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const padSides = (left: string, right: string) => {
    const spaces = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(spaces) + right;
  };

  const lines: string[] = [
    doubleLine,
    center(settings.storeName.toUpperCase()),
    center(settings.tagline || 'FRESH MARKET & GROCERY'),
    center(settings.address),
    center(`Tel: ${settings.phone}`),
    settings.taxId ? center(`Tax ID / EIN: ${settings.taxId}`) : '',
    doubleLine,
    padSides(`Date: ${new Date(sale.timestamp).toLocaleString()}`, ''),
    padSides(`Receipt: #${sale.receiptNumber}`, `Cashier: ${sale.cashierName}`),
    sale.customerName ? padSides(`Customer: ${sale.customerName}`, '') : '',
    line,
    padSides('ITEM', 'TOTAL'),
    line,
  ].filter(Boolean);

  sale.items.forEach((item) => {
    const itemTotal = item.unitPrice * (item.weight || item.quantity);
    const qtyText = item.weight
      ? `${item.weight.toFixed(2)} ${item.product.unit} @ ${formatCurrency(item.unitPrice, settings.currency)}`
      : `${item.quantity} x ${formatCurrency(item.unitPrice, settings.currency)}`;

    lines.push(item.product.name);
    lines.push(padSides(`  ${qtyText}`, formatCurrency(itemTotal, settings.currency)));
    if (item.discountPercent && item.discountPercent > 0) {
      lines.push(padSides(`  Item Disc. -${item.discountPercent}%`, ''));
    }
  });

  lines.push(line);
  lines.push(padSides('Subtotal:', formatCurrency(sale.subtotal, settings.currency)));
  if (sale.discountTotal > 0) {
    lines.push(padSides('Order Discount:', `-${formatCurrency(sale.discountTotal, settings.currency)}`));
  }
  lines.push(padSides(`Tax (${settings.taxRate}%):`, formatCurrency(sale.taxTotal, settings.currency)));
  lines.push(doubleLine);
  lines.push(padSides('TOTAL AMOUNT:', formatCurrency(sale.total, settings.currency)));
  lines.push(doubleLine);

  lines.push(padSides('Payment Method:', sale.paymentMethod.toUpperCase()));
  if (sale.paymentMethod === 'cash' && sale.paymentDetails.cashTendered) {
    lines.push(padSides('Cash Tendered:', formatCurrency(sale.paymentDetails.cashTendered, settings.currency)));
    lines.push(padSides('Change Due:', formatCurrency(sale.paymentDetails.changeGiven || 0, settings.currency)));
  } else if (sale.paymentMethod === 'card' && sale.paymentDetails.cardLast4) {
    lines.push(padSides(`Card (ending in ${sale.paymentDetails.cardLast4}):`, formatCurrency(sale.total, settings.currency)));
    lines.push(padSides('Auth Code:', sale.paymentDetails.authCode || 'APPRVD'));
  } else if (sale.paymentMethod === 'mobile') {
    lines.push(padSides('Mobile Wallet:', 'CONTACTLESS APPROVED'));
  } else if (sale.paymentMethod === 'split') {
    if (sale.paymentDetails.splitCash) {
      lines.push(padSides('Split Cash:', formatCurrency(sale.paymentDetails.splitCash, settings.currency)));
    }
    if (sale.paymentDetails.splitCard) {
      lines.push(padSides('Split Card:', formatCurrency(sale.paymentDetails.splitCard, settings.currency)));
    }
  }

  lines.push(line);
  lines.push(center('Items Sold: ' + sale.items.reduce((acc, it) => acc + (it.weight ? 1 : it.quantity), 0)));
  lines.push(center(settings.receiptFooter || 'Thank you for shopping local!'));
  lines.push(center('Returns accepted within 14 days with receipt'));
  lines.push(doubleLine);

  return lines.join('\n');
}
