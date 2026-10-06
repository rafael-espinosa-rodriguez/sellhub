import { Terminal } from 'lucide-react';
import type { Product } from '../../types/product.ts';
import { ProductCard } from './ProductCard.tsx';

interface ProductGridProps {
  products: Product[];
  imageMap: Record<string, string>;
  imageCountMap?: Record<string, number>;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelectProduct: (product: Product) => void;
  onQuickCopy: (product: Product, e: React.MouseEvent) => void;
  onQuickShare: (product: Product, e: React.MouseEvent) => void;
  onResetFilters?: () => void;
}

export function ProductGrid({
  products,
  imageMap,
  imageCountMap = {},
  onToggleFavorite,
  onSelectProduct,
  onQuickCopy,
  onQuickShare,
  onResetFilters,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center border border-[#262626] bg-[#0a0a0a] my-4">
        <div className="w-12 h-12 bg-[#141414] border border-[#262626] flex items-center justify-center text-[#d4ff00] mb-3">
          <Terminal className="w-6 h-6" />
        </div>
        <div className="font-mono text-xs text-[#d4ff00] uppercase tracking-widest">
          [ERR: 404_NO_RECORDS_MATCHED]
        </div>
        <h3 className="font-title font-bold text-lg text-white mt-1 uppercase">
          NINGÚN PRODUCTO CUMPLE CON EL CRITERIO
        </h3>
        <p className="font-mono text-xs text-[#828282] max-w-md mt-1">
          VERIFICA LA CADENA DE BÚSQUEDA O RESTABLECE LOS PARÁMETROS DE FILTRADO.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 bg-white text-black hover:bg-[#d4ff00] font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            [RESTABLECER FILTROS]
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border border-[#262626] bg-[#262626] gap-[1px]">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          imageUrl={imageMap[product.id]}
          imageCount={imageCountMap[product.id] || 1}
          onToggleFavorite={onToggleFavorite}
          onSelect={onSelectProduct}
          onQuickCopy={onQuickCopy}
          onQuickShare={onQuickShare}
        />
      ))}
    </div>
  );
}
