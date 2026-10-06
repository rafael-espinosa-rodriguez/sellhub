import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Upload, 
  Star, 
  Trash2, 
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { Product, ProductCategory, ProductStatus, ProductImage } from '../../types/product.ts';
import { ESTADOS_PRODUCTO } from '../../types/product.ts';
import { ImageService } from '../../services/imageService.ts';

interface ProductFormProps {
  initialProduct?: Product | null;
  initialImages?: ProductImage[];
  categories: ProductCategory[];
  onSave: (product: Product, images: ProductImage[]) => Promise<void>;
  onCancel: () => void;
  onAddCategory: (name: string) => Promise<ProductCategory>;
}

interface ImagePreviewItem {
  id: string;
  blob: Blob;
  previewUrl: string;
  isPrimary: boolean;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export function ProductForm({
  initialProduct,
  initialImages = [],
  categories,
  onSave,
  onCancel,
  onAddCategory,
}: ProductFormProps) {
  const isEditing = Boolean(initialProduct);

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : '');
  const [category, setCategory] = useState(
    initialProduct?.category || (categories[0]?.name || 'Electrónica')
  );
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status || 'disponible');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [notes, setNotes] = useState(initialProduct?.notes || '');
  const [isFavorite, setIsFavorite] = useState(initialProduct?.isFavorite || false);

  // Imágenes en preview
  const [images, setImages] = useState<ImagePreviewItem[]>(() => {
    return initialImages.map((img) => ({
      id: img.id,
      blob: img.blob,
      previewUrl: URL.createObjectURL(img.blob),
      isPrimary: img.isPrimary,
      fileName: img.fileName,
      mimeType: img.mimeType,
      sizeBytes: img.blob.size,
    }));
  });

  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionSavings, setCompressionSavings] = useState<string | null>(null);

  // Modal para agregar categoría rápida
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Errores
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar selección y compresión automática de fotografías (Fase 5)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setErrorMsg(null);

    let totalOriginal = 0;
    let totalCompressed = 0;
    const newItems: ImagePreviewItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        totalOriginal += file.size;

        // Comprimir mediante ImageService (Canvas en memoria)
        const optimized = await ImageService.compressImage(file, file.name);
        totalCompressed += optimized.compressedSize;

        const previewUrl = URL.createObjectURL(optimized.blob);
        const isFirst = images.length === 0 && newItems.length === 0;

        newItems.push({
          id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          blob: optimized.blob,
          previewUrl,
          isPrimary: isFirst,
          fileName: optimized.fileName,
          mimeType: optimized.mimeType,
          sizeBytes: optimized.compressedSize,
        });
      }

      const savedBytes = totalOriginal - totalCompressed;
      if (savedBytes > 0) {
        setCompressionSavings(
          `Optimizado: ${ImageService.formatFileSize(totalOriginal)} → ${ImageService.formatFileSize(totalCompressed)} (${((savedBytes / totalOriginal) * 100).toFixed(0)}% reducción)`
        );
      }

      setImages((prev) => [...prev, ...newItems]);
    } catch {
      setErrorMsg('Ocurrió un error al procesar las fotografías seleccionadas.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPrimary = (index: number) => {
    setImages((prev) =>
      prev.map((item, i) => ({
        ...item,
        isPrimary: i === index,
      }))
    );
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const itemToRemove = prev[index];
      URL.revokeObjectURL(itemToRemove.previewUrl);
      const filtered = prev.filter((_, i) => i !== index);
      if (itemToRemove.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await onAddCategory(newCategoryName.trim());
      setCategory(created.name);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch {
      setErrorMsg('No se pudo registrar la categoría.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('El nombre del producto es obligatorio.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Ingresa un precio numérico válido (mayor o igual a 0).');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const generatedSku = sku.trim() || `SKU-${Date.now().toString().slice(-6).toUpperCase()}`;

      const productPayload: Product = {
        id: initialProduct?.id || `prod-${now}`,
        sku: generatedSku,
        name: name.trim(),
        price: parsedPrice,
        category,
        status,
        description: description.trim(),
        notes: notes.trim(),
        isFavorite,
        createdAt: initialProduct?.createdAt || now,
        updatedAt: now,
      };

      const imagesPayload: ProductImage[] = images.map((item, index) => ({
        id: item.id,
        productId: productPayload.id,
        blob: item.blob,
        fileName: item.fileName,
        mimeType: item.mimeType,
        isPrimary: item.isPrimary,
        sortOrder: index,
        createdAt: now,
      }));

      await onSave(productPayload, imagesPayload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el producto.';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  const totalGalleryBytes = images.reduce((acc, img) => acc + img.sizeBytes, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 14 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="border border-[#262626] bg-[#0a0a0a] max-w-4xl mx-auto w-full shadow-2xl"
    >
      {/* Cabecera Técnica del Formulario */}
      <div className="h-12 px-4 border-b border-[#262626] bg-[#0d0d0d] flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#d4ff00]" />
          <span className="font-bold text-white uppercase tracking-wider">
            {isEditing ? '[MODO: EDITAR PRODUCTO]' : '[MODO: NUEVO PRODUCTO]'}
          </span>
          {initialProduct?.sku && (
            <span className="text-[#828282]">[{initialProduct.sku}]</span>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[#828282] hover:text-white transition-colors cursor-pointer"
          title="Cerrar formulario"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="p-3 bg-red-950/60 border-b border-red-800 text-red-300 font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>[ERROR_VALIDACIÓN]: {errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* BLOQUE 1: FOTOGRAFÍAS CON ORDENACIÓN MANUAL Y COMPRESIÓN */}
        <div className="border border-[#262626] bg-[#0d0d0d] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-2 mb-3 font-mono text-xs">
            <span className="text-white font-bold uppercase tracking-wider">
              [01] GALERÍA DE FOTOGRAFÍAS ({images.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#828282] text-[11px]">
                PESO TOTAL: {ImageService.formatFileSize(totalGalleryBytes)}
              </span>
              <span className="text-[#d4ff00] font-bold">
                [COMPRESIÓN_CANVAS: ACTIVA]
              </span>
            </div>
          </div>

          {/* Banner de ahorro por compresión */}
          {compressionSavings && (
            <div className="mb-3 px-3 py-1.5 bg-[#121c00] border border-[#d4ff00]/40 text-[#d4ff00] font-mono text-[10px] flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{compressionSavings}</span>
            </div>
          )}

          {/* Estado de compresión en progreso */}
          {isCompressing && (
            <div className="mb-3 p-3 bg-[#141414] border border-[#262626] text-white font-mono text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#d4ff00]" />
              <span className="uppercase">[OPTIMIZANDO FOTOGRAFÍAS EN CLIENTE CON CANVAS...]</span>
            </div>
          )}

          {/* Selector de Archivos Oculto */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFilesSelected}
            className="hidden"
          />

          {/* Cuadrícula de Previews con reordenamiento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {images.map((item, idx) => (
              <div
                key={item.id}
                className={`relative aspect-square border overflow-hidden group bg-black flex flex-col justify-between ${
                  item.isPrimary ? 'border-2 border-[#d4ff00]' : 'border-[#262626]'
                }`}
              >
                <img
                  src={item.previewUrl}
                  alt={`Preview ${idx}`}
                  className="w-full h-full object-cover"
                />

                {/* Índice de Foto */}
                <div className="absolute top-1 left-1 px-1 bg-black/90 font-mono text-[9px] text-white border border-[#262626]">
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Peso individual */}
                <div className="absolute top-1 right-1 px-1 bg-black/80 font-mono text-[8px] text-[#828282]">
                  {ImageService.formatFileSize(item.sizeBytes)}
                </div>

                {/* Badge Principal */}
                {item.isPrimary && (
                  <div className="absolute bottom-1 left-1 px-1 bg-[#d4ff00] text-black font-mono text-[8px] font-bold uppercase tracking-wider">
                    PORTADA
                  </div>
                )}

                {/* Controles técnicos de ordenación y selección */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveImage(idx, 'left')}
                      className={`p-1 border border-[#262626] bg-[#141414] text-white text-[9px] cursor-pointer ${
                        idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
                      }`}
                      title="Mover a la izquierda (anterior)"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMoveImage(idx, 'right')}
                      className={`p-1 border border-[#262626] bg-[#141414] text-white text-[9px] cursor-pointer ${
                        idx === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
                      }`}
                      title="Mover a la derecha (siguiente)"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="flex-1 py-1 px-1 bg-[#121c00] border border-[#d4ff00] text-[#d4ff00] hover:bg-[#d4ff00] hover:text-black font-mono text-[8px] font-bold uppercase cursor-pointer"
                        title="Marcar como foto principal"
                      >
                        PORTADA
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 bg-[#1a0a0a] border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-mono text-[9px] cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Botón Añadir Foto */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border border-dashed border-[#404040] hover:border-[#d4ff00] bg-[#050505] hover:bg-[#121212] flex flex-col items-center justify-center gap-1.5 text-[#828282] hover:text-[#d4ff00] transition-colors font-mono text-[10px] uppercase cursor-pointer p-2 text-center"
            >
              <Upload className="w-4 h-4" />
              <span>SUBIR FOTOS</span>
            </button>
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-[#636363] mt-2">
            <span>// Pasa el cursor sobre una foto para reordenarla o asignarla como portada.</span>
            <span>// Máximo 1920px (sin pérdida visual).</span>
          </div>
        </div>

        {/* BLOQUE 2: DATOS PRINCIPALES (GRID 2 COLUMNAS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-white uppercase font-bold flex items-center justify-between">
              <span>NOMBRE DEL PRODUCTO *</span>
              <span className="text-[#828282] text-[10px]">[REQUERIDO]</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="EJ. IPHONE 13 PRO 128GB GRAFITO"
              className="w-full bg-[#121212] border border-[#262626] focus:border-[#d4ff00] text-white p-2.5 font-mono text-xs uppercase outline-none"
              required
            />
          </div>

          {/* SKU / Código Interno */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-white uppercase font-bold flex items-center justify-between">
              <span>SKU / CÓDIGO IDENTIFICADOR</span>
              <span className="text-[#828282] text-[10px]">[OPCIONAL]</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="EJ. CEL-0981 (AUTOGENERADO SI VACÍO)"
              className="w-full bg-[#121212] border border-[#262626] focus:border-[#d4ff00] text-white p-2.5 font-mono text-xs uppercase outline-none"
            />
          </div>

          {/* Precio */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-white uppercase font-bold flex items-center justify-between">
              <span>PRECIO DE VENTA *</span>
              <span className="text-[#d4ff00] text-[10px]">[MONEDA BASE]</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#828282] font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="650.00"
                className="w-full bg-[#121212] border border-[#262626] focus:border-[#d4ff00] text-white pl-7 pr-3 py-2.5 font-mono text-xs outline-none"
                required
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-white uppercase font-bold">
              <span>CATEGORÍA</span>
              <button
                type="button"
                onClick={() => setIsAddingCategory((prev) => !prev)}
                className="text-[#d4ff00] hover:underline text-[10px] cursor-pointer"
              >
                {isAddingCategory ? '[CANCELAR NUEVA]' : '[NUEVA CAT]'}
              </button>
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="NUEVA CATEGORÍA..."
                  className="flex-1 bg-[#121212] border border-[#262626] focus:border-[#d4ff00] text-white px-2.5 py-2 font-mono text-xs uppercase outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 bg-[#d4ff00] text-black font-mono font-bold text-xs uppercase cursor-pointer"
                >
                  CREAR
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121212] border border-[#262626] focus:border-[#d4ff00] text-white p-2.5 font-mono text-xs uppercase outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Estado de Disponibilidad */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-white uppercase font-bold">
              ESTADO DEL PRODUCTO
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full bg-[#121212] border border-[#262626] focus:border-[#d4ff00] text-white p-2.5 font-mono text-xs uppercase outline-none cursor-pointer"
            >
              {ESTADOS_PRODUCTO.map((s) => (
                <option key={s.value} value={s.value}>
                  [{s.label.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Favorito */}
          <div className="space-y-1.5 font-mono text-xs flex flex-col justify-end">
            <button
              type="button"
              onClick={() => setIsFavorite((prev) => !prev)}
              className={`w-full py-2.5 px-3 border flex items-center justify-between font-mono text-xs uppercase transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-[#1a2500] border-[#d4ff00] text-[#d4ff00]'
                  : 'bg-[#121212] border-[#262626] text-[#828282] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-[#d4ff00]' : ''}`} />
                <span>MARCAR COMO FAVORITO</span>
              </span>
              <span className="text-[10px]">{isFavorite ? '[SÍ]' : '[NO]'}</span>
            </button>
          </div>
        </div>

        {/* BLOQUE 3: COPY COMERCIAL (TEXTO PARA COMPARTIR) */}
        <div className="border border-[#262626] bg-[#0d0d0d] p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4ff00]" />
              <span>TERMINAL DE COPY COMERCIAL (VENTAS)</span>
            </span>
            <span className="text-[#d4ff00] text-[11px]">
              [LONGITUD: {description.length} CARACTERES]
            </span>
          </div>
          <p className="text-[#828282] text-[11px]">
            // Este es el texto que se copiará al portapapeles y se enviará junto con las fotografías a WhatsApp, Facebook o catálogo.
          </p>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="🔥 ¡PRODUCTO DISPONIBLE! 🔥&#10;Estado impecable, incluye accesorios.&#10;💰 Precio: $650 USD&#10;¡Escríbeme para apartarlo!"
            className="w-full bg-black border border-[#262626] focus:border-[#d4ff00] text-neutral-200 p-3 font-mono text-xs leading-relaxed outline-none resize-y"
          />
        </div>

        {/* BLOQUE 4: NOTAS INTERNAS CONFIDENCIALES */}
        <div className="border border-dashed border-[#404040] bg-[#080808] p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="text-white font-bold uppercase tracking-wider">
              [NOTAS DEL VENDEDOR // PRIVADO / NIVEL 0]
            </span>
            <span className="text-[#828282] text-[10px]">NO SE COMPARTE NUNCA</span>
          </div>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Costo base, proveedor, margen de ganancia o detalles técnicos privados..."
            className="w-full bg-[#121212] border border-[#262626] focus:border-[#d4ff00] text-neutral-300 p-2.5 font-mono text-xs outline-none resize-y"
          />
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row items-stretch justify-end gap-3 pt-3 border-t border-[#262626] font-mono text-xs uppercase font-bold">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-3 border border-[#262626] bg-[#121212] hover:bg-white hover:text-black hover:border-white text-white transition-colors cursor-pointer"
          >
            [CANCELAR]
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="px-6 py-3 bg-[#d4ff00] hover:bg-[#c2ea00] text-black border border-[#d4ff00] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>GUARDANDO EN INDEXEDDB...</span>
            ) : (
              <span>[GUARDAR PRODUCTO]</span>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
