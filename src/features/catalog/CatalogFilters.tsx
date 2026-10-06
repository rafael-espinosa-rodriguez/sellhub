import { Plus, X, Star, Layers, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import type { ProductCategory } from '../../types/product.ts';
import { ESTADOS_PRODUCTO } from '../../types/product.ts';

export type SortOption = 'recientes' | 'precio-menor' | 'precio-mayor' | 'nombre';

interface CatalogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  categories: ProductCategory[];
  totalSkus: number;
  availableCount: number;
  reservedCount: number;
  estimatedValue: number;
  favoriteCount: number;
  onOpenCreateModal: () => void;
}

export function CatalogFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onlyFavorites,
  onToggleOnlyFavorites,
  sortBy,
  onSortChange,
  categories,
  totalSkus,
  availableCount,
  reservedCount,
  estimatedValue,
  favoriteCount,
  onOpenCreateModal,
}: CatalogFiltersProps) {
  const availablePercentage = totalSkus > 0 ? ((availableCount / totalSkus) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* SECCIÓN TITULAR & METADATOS TÉCNICOS */}
      <div className="border border-[#262626] bg-[#0a0a0a] p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#828282] uppercase tracking-widest">
              <span className="w-2 h-2 bg-[#d4ff00]" />
              <span>INDEX_STORE // VENTA_DIRECTA_INVENTARIO</span>
              <span className="text-[#3d3d3d]">|</span>
              <span>SYS_SYNC: OK</span>
            </div>
            <h1 className="font-title font-bold text-2xl lg:text-3xl text-white tracking-tight uppercase mt-1">
              CATÁLOGO DE PRODUCTOS
            </h1>
            <p className="font-mono text-xs text-[#828282] mt-0.5">
              // INTERFAZ RÁPIDA DE VENTA, COPIADO COMERCIAL Y GESTIÓN SIN SERVIDORES.
            </p>
          </div>

          <div className="inline-flex items-center border border-[#262626] bg-[#050505] divide-x divide-[#262626] text-xs font-mono">
            <div className="px-3 py-2 text-[#828282]">
              MOTOR: <span className="text-white font-bold">IndexedDB</span>
            </div>
            <div className="px-3 py-2 text-[#d4ff00] font-bold uppercase">
              [AIR-GAPPED: TRUE]
            </div>
          </div>
        </div>

        {/* MÉTRICAS / KPIS MODULARES BRUTALISTAS (GRID RÍGIDO 1PX) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#262626] bg-[#262626] gap-[1px] mt-4">
          {/* KPI 01 */}
          <div className="bg-[#0c0c0c] p-3 lg:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#828282] uppercase">
              <span>[01] TOTAL_SKUS</span>
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="mt-3">
              <div className="font-title text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {String(totalSkus).padStart(2, '0')}
              </div>
              <div className="font-mono text-[10px] text-[#828282] uppercase tracking-wider mt-0.5">
                ÍTEMS REGISTRADOS
              </div>
            </div>
          </div>

          {/* KPI 02 */}
          <div className="bg-[#0c0c0c] p-3 lg:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#828282] uppercase">
              <span>[02] DISPONIBLES</span>
              <CheckCircle2 className="w-4 h-4 text-[#d4ff00]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="font-title text-2xl lg:text-3xl font-bold text-[#d4ff00] tracking-tight">
                {String(availableCount).padStart(2, '0')}
              </div>
              <span className="font-mono text-[10px] bg-[#1a2500] text-[#d4ff00] border border-[#d4ff00]/40 px-1 font-bold">
                {availablePercentage}%
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#828282] uppercase tracking-wider mt-0.5">
              LISTOS PARA DESPACHO
            </div>
          </div>

          {/* KPI 03 */}
          <div className="bg-[#0c0c0c] p-3 lg:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#828282] uppercase">
              <span>[03] RESERVADOS</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="font-title text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {String(reservedCount).padStart(2, '0')}
              </div>
              <span className="font-mono text-[10px] bg-amber-950/60 text-amber-400 border border-amber-500/40 px-1 font-bold">
                EN TRATO
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#828282] uppercase tracking-wider mt-0.5">
              PENDIENTE PAGO
            </div>
          </div>

          {/* KPI 04 */}
          <div className="bg-[#0c0c0c] p-3 lg:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#828282] uppercase">
              <span>[04] VALOR_ESTIMADO</span>
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div className="mt-3">
              <div className="font-title text-2xl lg:text-3xl font-bold text-white tracking-tight">
                ${estimatedValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="font-mono text-[10px] text-[#828282] uppercase tracking-wider mt-0.5">
                MONEDA BASE: MXN/USD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONSOLA DE BÚSQUEDA Y FILTRADO BRUTALISTA */}
      <div className="border border-[#262626] bg-[#0c0c0c]">
        {/* Input de Comandos / Búsqueda */}
        <div className="flex items-stretch border-b border-[#262626]">
          <div className="flex items-center justify-center px-4 bg-[#141414] border-r border-[#262626] text-[#d4ff00] font-mono text-sm font-bold">
            &gt;_
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="BUSCAR POR NOMBRE, SKU, CATEGORÍA O DESCRIPCIÓN..."
              className="w-full h-12 px-4 bg-[#0a0a0a] text-white placeholder:text-[#525252] font-mono text-xs uppercase outline-none focus:bg-[#121212] transition-colors border-0"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#828282] hover:text-white font-mono text-xs cursor-pointer"
              >
                [LIMPIAR ESC]
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="hidden sm:flex items-center gap-2 px-5 bg-white text-black hover:bg-[#d4ff00] font-mono text-xs font-bold uppercase transition-colors border-l border-[#262626] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO ARTÍCULO</span>
          </button>
        </div>

        {/* Filtros Modulares en Rejilla */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#262626] font-mono text-xs">
          {/* Selector Categorías */}
          <div className="p-2.5 bg-[#0a0a0a] flex items-center gap-2">
            <span className="text-[#828282] text-[10px] uppercase shrink-0">CAT:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full bg-[#121212] border border-[#262626] text-white px-2.5 py-1.5 outline-none font-mono text-xs uppercase cursor-pointer hover:border-[#3d3d3d] focus:border-[#d4ff00]"
            >
              <option value="">[CATEGORÍAS: TODAS]</option>
              {categories.map((c, idx) => (
                <option key={c.id} value={c.name}>
                  [{String(idx + 1).padStart(2, '0')}] {c.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Selector Estado */}
          <div className="p-2.5 bg-[#0a0a0a] flex items-center gap-2">
            <span className="text-[#828282] text-[10px] uppercase shrink-0">STATUS:</span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full bg-[#121212] border border-[#262626] text-white px-2.5 py-1.5 outline-none font-mono text-xs uppercase cursor-pointer hover:border-[#3d3d3d] focus:border-[#d4ff00]"
            >
              <option value="">[ESTADO: TODOS]</option>
              {ESTADOS_PRODUCTO.map((status) => (
                <option key={status.value} value={status.value}>
                  [{status.label.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Favoritos */}
          <div className="p-2.5 bg-[#0a0a0a] flex items-center">
            <button
              type="button"
              onClick={onToggleOnlyFavorites}
              className={`w-full py-1.5 px-3 border font-mono text-xs uppercase transition-colors flex items-center justify-between cursor-pointer ${
                onlyFavorites
                  ? 'bg-[#1a2500] border-[#d4ff00] text-[#d4ff00]'
                  : 'bg-[#121212] border-[#262626] text-[#828282] hover:text-white hover:border-[#3d3d3d]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-[#d4ff00] text-[#d4ff00]' : ''}`} />
                <span>SOLO FAVORITOS</span>
              </span>
              <span className="px-1.5 py-0.2 bg-[#262626] text-white text-[10px]">
                {favoriteCount}
              </span>
            </button>
          </div>

          {/* Selector Orden */}
          <div className="p-2.5 bg-[#0a0a0a] flex items-center gap-2">
            <span className="text-[#828282] text-[10px] uppercase shrink-0">ORDEN:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full bg-[#121212] border border-[#262626] text-white px-2.5 py-1.5 outline-none font-mono text-xs uppercase cursor-pointer hover:border-[#3d3d3d] focus:border-[#d4ff00]"
            >
              <option value="recientes">RECIENTES / ID DESC</option>
              <option value="precio-menor">PRECIO: MENOR A MAYOR</option>
              <option value="precio-mayor">PRECIO: MAYOR A MENOR</option>
              <option value="nombre">ALFABÉTICO (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
