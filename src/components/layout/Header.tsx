import { Download, Plus } from 'lucide-react';
import type { ActiveTab } from '../../types/navigation.ts';

interface HeaderProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  productCount?: number;
  onOpenCreateModal: () => void;
}

export function Header({
  activeTab,
  onNavigate,
  productCount = 0,
  onOpenCreateModal,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505] border-b border-[#262626] h-14">
      <div className="h-full w-full flex items-stretch justify-between">
        {/* Logo + Metadatos de Sistema */}
        <div className="flex items-stretch">
          <div
            onClick={() => onNavigate('catalogo')}
            className="flex items-center gap-3 px-4 bg-[#0d0d0d] border-r border-[#262626] cursor-pointer"
          >
            <div className="w-6 h-6 bg-[#d4ff00] flex items-center justify-center text-black font-mono font-bold text-xs tracking-tighter">
              SH
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-title font-bold tracking-tight text-sm text-white uppercase leading-none">
                SellHub
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center px-4 border-r border-[#262626] text-[11px] text-[#828282] uppercase tracking-wider font-mono gap-3">
            <span className="inline-flex items-center gap-1.5 text-[#d4ff00]">
              <span className="w-1.5 h-1.5 bg-[#d4ff00] animate-ping" />
              [MODO OFFLINE 100%]
            </span>
            <span className="text-[#262626]">/</span>
            <span>[DB: INDEXEDDB_LOCAL]</span>
            <span className="text-[#262626]">/</span>
            <span>[CAPACITOR_READY]</span>
          </div>
        </div>

        {/* Acciones Rápidas Header */}
        <div className="flex items-stretch">
          <div className="hidden sm:flex items-center px-4 border-l border-[#262626] text-[11px] text-[#828282] font-mono uppercase">
            <span className="text-white mr-1">[ITEMS:</span> {productCount} EN DB
            <span className="text-white">]</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('respaldo')}
            className={`hidden sm:inline-flex items-center gap-2 px-4 border-l border-[#262626] text-xs uppercase tracking-wider transition-colors font-mono cursor-pointer ${
              activeTab === 'respaldo'
                ? 'bg-[#1a1a1a] text-white border-b-2 border-b-[#d4ff00]'
                : 'bg-[#0d0d0d] hover:bg-[#171717] text-white'
            }`}
          >
            <Download className="w-4 h-4 text-[#828282]" />
            <span>BACKUP.JSON</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 bg-[#d4ff00] hover:bg-[#c2ea00] text-black border-l border-[#262626] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>PRODUCTO</span>
          </button>
        </div>
      </div>
    </header>
  );
}
