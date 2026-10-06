import { LayoutGrid, Star, Plus, Database } from 'lucide-react';
import type { ActiveTab } from '../../types/navigation.ts';

interface BottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  productCount?: number;
  onOpenCreate: () => void;
}

export function BottomNavigation({
  activeTab,
  onNavigate,
  productCount = 0,
  onOpenCreate,
}: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050505] border-t border-[#262626] font-mono text-[10px]">
      <div className="grid grid-cols-4 items-center">
        {/* Catálogo */}
        <button
          type="button"
          onClick={() => onNavigate('catalogo')}
          className={`flex flex-col items-center justify-center py-2 px-1 border-r border-[#262626] uppercase transition-colors cursor-pointer ${
            activeTab === 'catalogo'
              ? 'bg-[#141414] text-[#d4ff00] font-bold'
              : 'text-[#828282] hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mb-0.5" />
          <span>CATÁLOGO ({productCount})</span>
        </button>

        {/* Favoritos */}
        <button
          type="button"
          onClick={() => onNavigate('favoritos')}
          className={`flex flex-col items-center justify-center py-2 px-1 border-r border-[#262626] uppercase transition-colors cursor-pointer ${
            activeTab === 'favoritos'
              ? 'bg-[#141414] text-[#d4ff00] font-bold'
              : 'text-[#828282] hover:text-white'
          }`}
        >
          <Star className="w-4 h-4 mb-0.5" />
          <span>FAVORITOS</span>
        </button>

        {/* Nuevo Producto */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex flex-col items-center justify-center py-2 px-1 border-r border-[#262626] uppercase bg-[#d4ff00] text-black font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mb-0.5" />
          <span>AGREGAR</span>
        </button>

        {/* Respaldo */}
        <button
          type="button"
          onClick={() => onNavigate('respaldo')}
          className={`flex flex-col items-center justify-center py-2 px-1 uppercase transition-colors cursor-pointer ${
            activeTab === 'respaldo'
              ? 'bg-[#141414] text-[#d4ff00] font-bold'
              : 'text-[#828282] hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 mb-0.5" />
          <span>BACKUP</span>
        </button>
      </div>
    </nav>
  );
}
