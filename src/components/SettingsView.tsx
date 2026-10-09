import React, { useState } from 'react';
import { StoreSettings, Product, SaleTransaction } from '../types';
import { 
  Settings, 
  Store, 
  Receipt, 
  Database, 
  Volume2, 
  Scale, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  CheckCheck,
  Percent
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  products: Product[];
  sales: SaleTransaction[];
  onResetDemoData: () => void;
  onImportData: (data: { products?: Product[]; sales?: SaleTransaction[]; settings?: StoreSettings }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  products,
  sales,
  onResetDemoData,
  onImportData,
}) => {
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: 'marketflow_pos_v1',
      exportedAt: new Date().toISOString(),
      settings: form,
      products,
      sales,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.products || parsed.sales || parsed.settings) {
          onImportData(parsed);
          alert('Database backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-y-auto bg-neutral-900 p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">System Settings &amp; Store Configuration</h2>
          <p className="text-xs text-neutral-400">Manage receipt details, tax rates, cashier identity, and database</p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold animate-in fade-in">
            <CheckCheck className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: STORE IDENTITY & RECEIPT HEADER */}
        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <Store className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Store Identity &amp; Receipt Header
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Market / Store Name *
              </label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Store Physical Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Store Telephone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Tax ID / EIN / Business Registration
              </label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TAX & CURRENCY */}
        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Taxes &amp; Currency
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Default Cashier Name
              </label>
              <input
                type="text"
                value={form.cashierName}
                onChange={(e) => setForm({ ...form, cashierName: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: RECEIPT FOOTER */}
        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Thermal Receipt Customization
            </h3>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1">
              Receipt Footer Message
            </label>
            <textarea
              rows={2}
              value={form.receiptFooter}
              onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.soundEnabled}
                onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-emerald-500"
              />
              <div>
                <span className="text-xs font-medium text-white block">Sound Effects</span>
                <span className="text-[11px] text-neutral-400">Play register scan beeps and checkout chimes</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requireWeightPrompt}
                onChange={(e) => setForm({ ...form, requireWeightPrompt: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-emerald-500"
              />
              <div>
                <span className="text-xs font-medium text-white block">Scale Prompt on Weighed Items</span>
                <span className="text-[11px] text-neutral-400">Show scale weight calculator for items sold by lb/kg</span>
              </div>
            </label>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Save Store Configuration
          </button>
        </div>
      </form>

      {/* SECTION 4: DATA BACKUP & RESTORE */}
      <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Database Backup &amp; Demo Restoration
          </h3>
        </div>

        <p className="text-xs text-neutral-400">
          Export full store database, load backup JSON, or restore default sample market inventory.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Backup JSON</span>
          </button>

          <label className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Import Backup JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all inventory, sales history, and shifts to fresh demo market state?')) {
                onResetDemoData();
              }
            }}
            className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Demo Market Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
