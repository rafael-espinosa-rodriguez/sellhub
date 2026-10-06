import { Terminal } from 'lucide-react';
import type { ActiveTab } from '../../types/navigation.ts';

interface SidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  productCount: number;
  favoriteCount: number;
  categoryCount: number;
}

export function Sidebar({
  activeTab,
  onNavigate,
  productCount,
  favoriteCount,
  categoryCount,
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-60 bg-[#050505] border-r border-[#262626] hidden md:flex flex-col z-40 justify-between">
      <div>
        {/* Panel de Diagnóstico */}
        <div className="p-3 border-b border-[#262626] bg-[#090909]">
          <div className="text-[10px] text-[#828282] uppercase tracking-widest font-mono">
            [DIAGNÓSTICO SYS]
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-xs">
            <span className="text-white">ALMACENAMIENTO:</span>
            <span className="text-[#d4ff00] font-bold">100% LOCAL</span>
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-[#828282]">
            <span>SERVIDOR EXTERNO:</span>
            <span className="text-red-400 font-bold">DESCONECTADO</span>
          </div>
          <div className="w-full bg-[#1c1c1c] h-1 mt-2.5">
            <div className="bg-[#d4ff00] h-1 w-full" />
          </div>
        </div>

        {/* Navegación Primaria */}
        <nav className="p-0 border-b border-[#262626]">
          <button
            type="button"
            onClick={() => onNavigate('catalogo')}
            className={`w-full flex items-center justify-between px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border-b border-[#1c1c1c] ${
              activeTab === 'catalogo'
                ? 'bg-[#141414] border-l-2 border-l-[#d4ff00] text-white'
                : 'text-[#828282] hover:text-white hover:bg-[#0c0c0c] border-l-2 border-l-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-[#d4ff00]">01.</span>
              <span>CATÁLOGO // TODOS</span>
            </span>
            <span className="text-[10px] bg-[#262626] text-white px-1.5 py-0.5">
              {String(productCount).padStart(2, '0')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('favoritos')}
            className={`w-full flex items-center justify-between px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border-b border-[#1c1c1c] ${
              activeTab === 'favoritos'
                ? 'bg-[#141414] border-l-2 border-l-[#d4ff00] text-white'
                : 'text-[#828282] hover:text-white hover:bg-[#0c0c0c] border-l-2 border-l-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-[#d4ff00]">02.</span>
              <span>FAVORITOS [STAR]</span>
            </span>
            <span className="text-[10px] bg-[#262626] text-white px-1.5 py-0.5">
              {String(favoriteCount).padStart(2, '0')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('respaldo')}
            className={`w-full flex items-center justify-between px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'respaldo'
                ? 'bg-[#141414] border-l-2 border-l-[#d4ff00] text-white'
                : 'text-[#828282] hover:text-white hover:bg-[#0c0c0c] border-l-2 border-l-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-[#d4ff00]">03.</span>
              <span>AJUSTES / EXP.JSON</span>
            </span>
            <Terminal className="w-3.5 h-3.5 text-[#828282]" />
          </button>
        </nav>

        {/* Parámetros de Registro Local */}
        <div className="p-3 text-[10px] text-[#636363] space-y-1 font-mono">
          <div>MOTOR: INDEXEDDB_V1</div>
          <div>ENCRYPT: LOCAL_SANDBOX</div>
          <div>TELEMETRÍA: NINGUNA [0%]</div>
        </div>
      </div>

      {/* Footer Sidebar Brutalista */}
      <div className="p-3 border-t border-[#262626] bg-[#080808]">
        <div className="text-[9px] uppercase tracking-widest text-[#828282]">
          [PRIVACIDAD_ESTRICTA]
        </div>
        <div className="text-[10px] text-[#a0a0a0] mt-1 leading-snug">
          LOS ARCHIVOS NUNCA ABANDONAN LA MEMORIA DEL HARDWARE.
        </div>
      </div>
    </aside>
  );
}
