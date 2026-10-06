import type { ProductStatus } from '../../types/product.ts';

interface StatusBadgeProps {
  status: ProductStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  let styleClasses = 'bg-[#172b00] border-[#d4ff00]/40 text-[#d4ff00]';
  let label = '[DISPONIBLE]';

  switch (status) {
    case 'disponible':
      styleClasses = 'bg-[#172b00] border-[#d4ff00]/40 text-[#d4ff00]';
      label = '[DISPONIBLE]';
      break;
    case 'reservado':
      styleClasses = 'bg-amber-950/80 border-amber-600/40 text-amber-400';
      label = '[RESERVADO]';
      break;
    case 'vendido':
      styleClasses = 'bg-red-950/80 border-red-600/40 text-red-400';
      label = '[VENDIDO]';
      break;
    case 'oculto':
      styleClasses = 'bg-[#171717] border-[#3d3d3d] text-[#828282]';
      label = '[OCULTO]';
      break;
  }

  const paddingClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]';

  return (
    <span
      className={`inline-block font-mono font-bold uppercase tracking-wider border ${styleClasses} ${paddingClasses}`}
    >
      {label}
    </span>
  );
}
