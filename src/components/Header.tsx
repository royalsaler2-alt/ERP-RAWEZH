import React from 'react';
import { StoreSettings } from '../types';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Banknote, 
  Settings, 
  Volume2, 
  VolumeX, 
  Clock
} from 'lucide-react';

export type ActiveTab = 'register' | 'inventory' | 'reports' | 'cash_drawer' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  cartItemCount: number;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onUpdateSettings,
  cartItemCount,
  lowStockCount,
}) => {
  const [currentTime, setCurrentTime] = React.useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    onUpdateSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled,
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950 border-b border-neutral-800 text-neutral-100 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-6 max-w-[1920px] mx-auto">
        {/* Zone 1: Single text element wordmark with domain identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
              MarketFlow
            </span>
            <span className="text-xs text-neutral-400 block -mt-0.5 truncate max-w-[180px]">
              {settings.storeName}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation links / segmented controls */}
        <nav className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800/80 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'register'
                ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>POS Register</span>
            {cartItemCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                activeTab === 'register' ? 'bg-neutral-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory</span>
            {lowStockCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                activeTab === 'inventory' ? 'bg-amber-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'reports'
                ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sales & Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('cash_drawer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cash_drawer'
                ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Cash Drawer</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Zone 3: Active Cashier & Status info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={toggleSound}
            title={settings.soundEnabled ? 'Mute Register Beeps' : 'Enable Register Beeps'}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-300 font-medium whitespace-nowrap truncate max-w-[140px]">
              {settings.cashierName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
