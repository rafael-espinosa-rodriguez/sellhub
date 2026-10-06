export type ProductStatus = 'disponible' | 'reservado' | 'vendido' | 'oculto';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  isCustom?: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: number;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  notes: string;
  status: ProductStatus;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
  primaryImageUrl?: string;
}

export const CATEGORIAS_PREDETERMINADAS: ProductCategory[] = [
  { id: 'cat-1', name: 'Electrónica', slug: 'electronica' },
  { id: 'cat-2', name: 'Celulares', slug: 'celulares' },
  { id: 'cat-3', name: 'Computación', slug: 'computacion' },
  { id: 'cat-4', name: 'Hogar', slug: 'hogar' },
  { id: 'cat-5', name: 'Accesorios', slug: 'accesorios' },
  { id: 'cat-6', name: 'Otros', slug: 'otros' },
];

export const ESTADOS_PRODUCTO: { value: ProductStatus; label: string; color: string }[] = [
  { value: 'disponible', label: 'Disponible', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { value: 'reservado', label: 'Reservado', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'vendido', label: 'Vendido', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { value: 'oculto', label: 'Oculto', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
];
