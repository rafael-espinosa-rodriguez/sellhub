import { Star, Copy, Share2, Image as ImageIcon } from 'lucide-react';
import type { Product } from '../../types/product.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface ProductCardProps {
  product: Product;
  imageUrl?: string;
  imageCount?: number;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelect: (product: Product) => void;
  onQuickCopy: (product: Product, e: React.MouseEvent) => void;
  onQuickShare: (product: Product, e: React.MouseEvent) => void;
}

export function ProductCard({
  product,
  imageUrl,
  imageCount = 1,
  onToggleFavorite,
  onSelect,
  onQuickCopy,
  onQuickShare,
}: ProductCardProps) {
  const displaySku = product.sku || `SKU-${product.id.slice(-6).toUpperCase()}`;

  return (
    <article
      onClick={() => onSelect(product)}
      className="product-card group flex flex-col bg-[#0a0a0a] transition-colors hover:bg-[#0f0f0f] border border-[#262626] cursor-pointer"
    >
      {/* Encabezado técnico tarjeta */}
      <div className="h-8 px-3 border-b border-[#262626] bg-[#0d0d0d] flex items-center justify-between text-[10px] font-mono">
        <span className="text-[#828282] tracking-wider">[{displaySku}]</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={product.status} size="sm" />
          <button
            type="button"
            onClick={(e) => onToggleFavorite(product.id, e)}
            className={`transition-colors cursor-pointer ${
              product.isFavorite ? 'text-[#d4ff00]' : 'text-[#828282] hover:text-[#d4ff00]'
            }`}
            title={product.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          >
            <Star className={`w-3.5 h-3.5 ${product.isFavorite ? 'fill-[#d4ff00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Imagen con Marco Técnico */}
      <div className="relative w-full aspect-square bg-[#050505] overflow-hidden border-b border-[#262626] flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-[#404040]">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <span className="text-[10px] font-mono">[SIN_IMAGEN]</span>
          </div>
        )}

        {/* Conteo fotos estilo visor técnico */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/90 border border-[#262626] text-white font-mono text-[9px] uppercase tracking-widest flex items-center gap-1">
          <span>[FOTOS: {String(imageCount).padStart(2, '0')}]</span>
        </div>

        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/90 border border-[#262626] text-[#828282] font-mono text-[9px] uppercase">
          CAT: {product.category}
        </div>
      </div>

      {/* Ficha de Datos */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="font-title font-bold text-sm text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#d4ff00] transition-colors">
            {product.name}
          </h2>
          <p className="font-mono text-[11px] text-[#828282] mt-1 line-clamp-2 leading-relaxed">
            {product.description || '// Sin descripción comercial registrada.'}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1f1f1f]">
          <div className="flex items-baseline justify-between mb-3 font-mono">
            <span className="text-[10px] text-[#828282] uppercase tracking-wider">
              {product.status === 'vendido' ? 'CERRADO_POR:' : 'PRECIO_BASE:'}
            </span>
            <span
              className={`font-title text-lg font-bold tracking-tight ${
                product.status === 'vendido' ? 'text-[#828282] line-through' : 'text-white'
              }`}
            >
              ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-[10px] font-mono text-[#828282]">USD</span>
            </span>
          </div>

          {/* Botones Brutalistas Cuadriculados */}
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] font-bold uppercase">
            <button
              type="button"
              onClick={(e) => onQuickCopy(product, e)}
              className="py-2 px-2 border border-[#262626] bg-[#141414] hover:bg-white hover:text-black hover:border-white text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>[COPIAR COPY]</span>
            </button>
            <button
              type="button"
              onClick={(e) => onQuickShare(product, e)}
              className="py-2 px-2 border border-[#d4ff00] bg-[#121c00] hover:bg-[#d4ff00] hover:text-black text-[#d4ff00] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>[COMPARTIR]</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
