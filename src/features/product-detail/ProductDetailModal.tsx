import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Star, 
  Edit3, 
  Trash2, 
  Download, 
  Terminal, 
  Share2, 
  MessageSquare, 
  Store, 
  Image as ImageIcon,
  Check,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Copy
} from 'lucide-react';
import type { Product, ProductImage } from '../../types/product.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ImageViewerModal } from './ImageViewerModal.tsx';

interface ProductDetailModalProps {
  product: Product;
  images: ProductImage[];
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onCopyText: (text: string) => Promise<void>;
  onShare: (product: Product, images: ProductImage[]) => Promise<void>;
}

export function ProductDetailModal({
  product,
  images,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyText,
  onShare,
}: ProductDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copyBufferFeedback, setCopyBufferFeedback] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Generar Object URLs para las imágenes en memoria
  const imageUrls = images.map((img) => URL.createObjectURL(img.blob));
  const activeImageUrl = imageUrls[selectedImageIndex] || '';

  const displaySku = product.sku || `SKU-${product.id.slice(-6).toUpperCase()}`;

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLightboxOpen) {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, isLightboxOpen, onClose]);

  // Copiar copy comercial
  const handleCopyCopy = async () => {
    if (!product.description) return;
    await onCopyText(product.description);
    setCopyBufferFeedback(true);
    setTimeout(() => {
      setCopyBufferFeedback(false);
    }, 2500);
  };

  // Compartir producto completo (acción principal estrella)
  const handleTriggerShare = async () => {
    await onShare(product, images);
  };

  // Compartir solo copy comercial
  const handleShareCopyOnly = async () => {
    if (!product.description) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
        });
      } catch {
        await handleCopyCopy();
      }
    } else {
      await handleCopyCopy();
    }
  };

  // Compartir solo fotografías
  const handleSharePhotosOnly = async () => {
    if (images.length === 0) return;
    if (navigator.share) {
      try {
        const files = images.map(
          (img, i) =>
            new File([img.blob], img.fileName || `foto_${i + 1}.jpg`, {
              type: img.blob.type || 'image/jpeg',
            })
        );
        if (navigator.canShare && navigator.canShare({ files })) {
          await navigator.share({ files });
          return;
        }
      } catch {
        // Fallback a descarga
      }
    }
    handleDownloadPhotos();
  };

  const handleTriggerShareWhatsApp = () => {
    if (!product.description) return;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(product.description)}`, '_blank');
  };

  const handleTriggerShareFacebook = async () => {
    if (product.description) {
      await onCopyText(product.description);
    }
    window.open('https://www.facebook.com/marketplace/create', '_blank');
  };

  const handleDownloadPhotos = () => {
    images.forEach((img, i) => {
      const url = URL.createObjectURL(img.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.name.replace(/\s+/g, '_')}_foto_${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handleDeleteConfirm = async () => {
    if (window.confirm(`¿Confirmar purga permanente del producto "${product.name}" de la base de datos local? Esta acción no se puede deshacer.`)) {
      setIsDeleting(true);
      await onDelete(product.id);
      onClose();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-7xl bg-[#050505] border border-[#262626] my-auto shadow-2xl"
      >
        {/* BREADCRUMB / STATUS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0d0d0d] border-b border-[#262626]">
          <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-[#828282] hover:text-[#d4ff00] transition-colors uppercase font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>[CATÁLOGO]</span>
            </button>
            <span className="text-[#3d3d3d]">/</span>
            <span className="text-neutral-300 truncate tracking-wide">
              [ITEM_REF: {displaySku}]
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 font-mono text-xs uppercase transition-colors cursor-pointer"
            >
              <Star className={`w-3.5 h-3.5 ${product.isFavorite ? 'fill-[#d4ff00] text-[#d4ff00]' : 'text-[#828282]'}`} />
              <span>{product.isFavorite ? '[EN DESTACADOS]' : 'FAVORITO'}</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(product)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 font-mono text-xs uppercase transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>EDITAR</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              title="Eliminar producto"
              className="inline-flex items-center justify-center p-1.5 border border-red-900/60 bg-[#160b0b] text-red-400 hover:bg-red-950/80 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN 2-COLUMN BRUTALIST GRID */}
        <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT: GALERÍA INDUSTRIAL DE ALTA PRECISIÓN */}
          <section className="lg:col-span-5 flex flex-col space-y-4">
            {/* Marco de Imagen Principal con Botón Fullscreen */}
            <div className="border border-[#262626] bg-[#0a0a0a] p-1 relative">
              <div 
                onClick={() => images.length > 0 && setIsLightboxOpen(true)}
                className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center border border-[#1f1f1f] cursor-zoom-in group"
              >
                {activeImageUrl ? (
                  <img
                    src={activeImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-150 group-hover:scale-102"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-[#404040]">
                    <ImageIcon className="w-12 h-12 opacity-40" />
                    <span className="font-mono text-xs">[SIN FOTOGRAFÍA]</span>
                  </div>
                )}

                {/* Etiquetas superpuestas */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 font-mono text-[10px]">
                  <StatusBadge status={product.status} size="sm" />
                  <span className="bg-black/90 text-white border border-[#262626] px-2 py-0.5 tracking-wider">
                    [FOTOS: {String(images.length).padStart(2, '0')}_HD_RAW]
                  </span>
                </div>

                {/* Botón Pantalla Completa */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute bottom-2 right-2 p-1.5 bg-black/90 border border-[#262626] hover:border-white text-white transition-colors cursor-pointer"
                  title="Ver imagen a pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matriz de Miniaturas */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square overflow-hidden relative transition-all cursor-pointer bg-[#0d0d0d] ${
                      selectedImageIndex === idx
                        ? 'border-2 border-[#d4ff00] opacity-100'
                        : 'border border-[#262626] opacity-60 hover:opacity-100 hover:border-neutral-400'
                    }`}
                  >
                    <img
                      src={imageUrls[idx]}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 px-1 font-mono text-[9px] bg-black text-white font-bold border-t border-l border-[#262626]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Bloque Almacenamiento Local Técnico */}
            <div className="border border-[#262626] bg-[#0d0d0d] p-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-2 mb-2">
                <span className="text-white uppercase font-bold tracking-wider">
                  [ALMACENAMIENTO_LOCAL]
                </span>
                <span className="text-[#d4ff00]">
                  [BLOB: {images.length > 0 ? `${(images.reduce((acc, i) => acc + (i.blob?.size || 0), 0) / (1024 * 1024)).toFixed(1)}MB` : '0MB'}]
                </span>
              </div>
              <div className="text-[#828282] text-[11px] leading-relaxed mb-3">
                Archivos binarios HD residen en sandbox local indexado. Transmisión directa por WebShare API / Filesystem sin compresión remota.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPhotos}
                  disabled={images.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#262626] bg-[#141414] hover:bg-[#202020] text-neutral-200 font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#d4ff00]" />
                  <span>[EXPORTAR FOTOS]</span>
                </button>
                <button
                  type="button"
                  onClick={handleSharePhotosOnly}
                  disabled={images.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#262626] bg-[#141414] hover:bg-[#202020] text-neutral-200 font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#d4ff00]" />
                  <span>[COMPARTIR FOTOS]</span>
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT: FICHA TÉCNICA Y MÓDULO DE COMPARTIR */}
          <section className="lg:col-span-7 flex flex-col space-y-4">
            {/* Cabecera de Producto y Precios */}
            <div className="border border-[#262626] bg-[#0d0d0d] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626] font-mono text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-black border border-[#262626] text-neutral-300 font-bold uppercase">
                    [CAT: {product.category.toUpperCase()}]
                  </span>
                  <span className="text-[#3d3d3d]">|</span>
                  <span className="text-[#828282]">[ID: {displaySku}]</span>
                  <span className="text-[#3d3d3d]">|</span>
                  <span className="text-[#828282]">[REGISTRO: EN LOCAL]</span>
                </div>
                <span className="px-2 py-0.5 bg-[#d4ff00]/10 border border-[#d4ff00]/40 text-[#d4ff00] font-bold uppercase">
                  [STOCK: INMEDIATO]
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white uppercase mt-4 mb-3 font-title">
                {product.name}
              </h1>

              {/* Bloque Numérico de Precio Brutalista */}
              <div className="flex flex-wrap items-baseline gap-4 py-3 border-y border-[#262626] bg-[#080808] px-3 my-3">
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tighter tabular-nums">
                    ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-[#d4ff00] font-bold">USD</span>
                </div>
              </div>

              {/* Telemetría Técnica Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 font-mono text-xs">
                <div className="p-2 border border-[#262626] bg-[#121212]">
                  <div className="text-[10px] text-[#828282] uppercase tracking-wider">ESTADO</div>
                  <div className="text-white font-bold mt-0.5 text-xs text-[#d4ff00] uppercase">
                    {product.status}
                  </div>
                </div>
                <div className="p-2 border border-[#262626] bg-[#121212]">
                  <div className="text-[10px] text-[#828282] uppercase tracking-wider">CATEGORÍA</div>
                  <div className="text-white font-bold mt-0.5 text-xs uppercase truncate">
                    {product.category}
                  </div>
                </div>
                <div className="p-2 border border-[#262626] bg-[#121212]">
                  <div className="text-[10px] text-[#828282] uppercase tracking-wider">FOTOGRAFÍAS</div>
                  <div className="text-white font-bold mt-0.5 text-xs">
                    {images.length} ARCHIVOS
                  </div>
                </div>
                <div className="p-2 border border-[#262626] bg-[#121212]">
                  <div className="text-[10px] text-[#828282] uppercase tracking-wider">RED/VENTA</div>
                  <div className="text-white font-bold mt-0.5 text-xs">DISPONIBLE</div>
                </div>
              </div>
            </div>

            {/* TERMINAL BLOCK: COMMERCIAL COPY */}
            <div className="border border-[#262626] bg-[#0d0d0d] p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-2 font-mono text-xs text-white font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 bg-[#d4ff00]" />
                  <span>TERMINAL DE COPY COMERCIAL</span>
                </div>
                <span className="font-mono text-[11px] text-[#d4ff00] bg-black px-2 py-0.5 border border-[#262626]">
                  [LONGITUD: {product.description.length} CARACTERES]
                </span>
              </div>

              {/* Salida de Terminal Monospace */}
              <div className="mt-3 p-3 bg-black border border-[#262626] font-mono text-xs text-neutral-200 leading-relaxed select-all">
                <pre className="whitespace-pre-wrap font-mono">
                  {product.description || '// Sin copy comercial redactado.'}
                </pre>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCopy}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-white hover:border-[#d4ff00] bg-[#141414] hover:bg-[#1a1a1a] text-white hover:text-[#d4ff00] font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>[COPIAR TEXTO COMERCIAL]</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareCopyOnly}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#262626] bg-[#141414] hover:border-white text-[#828282] hover:text-white uppercase transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>[COMPARTIR SOLO COPY]</span>
                  </button>
                </div>

                {copyBufferFeedback && (
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-[#d4ff00] bg-black text-[#d4ff00] font-mono text-xs tracking-wider">
                    <Check className="w-4 h-4" />
                    <span>[BUFFER: COPIADO AL PORTAPAPELES]</span>
                  </div>
                )}
              </div>
            </div>

            {/* HIGH-CONTRAST MASTER SHARE SUITE */}
            <div className="border-2 border-[#d4ff00] bg-[#080808] p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626] font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#d4ff00] font-bold">[MÓDULO: DESPACHO RÁPIDO]</span>
                </div>
                <span className="text-[#828282]">
                  [CARGA: {images.length} FOTOS + PAYLOAD]
                </span>
              </div>

              {/* MONOLITHIC BRUTALIST PRIMARY CTA BUTTON */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleTriggerShare}
                  className="w-full py-4 px-4 bg-[#d4ff00] hover:bg-white text-black font-mono font-bold text-sm sm:text-base tracking-widest uppercase transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-none active:translate-y-0.5"
                >
                  <Share2 className="w-5 h-5 font-bold" />
                  <span>[COMPARTIR PRODUCTO ({images.length} FOTOS + COPY)]</span>
                </button>
              </div>

              {/* Disparadores Directos Secundarios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={handleSharePhotosOnly}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-[#262626] bg-[#121212] hover:bg-[#1a1a1a] hover:border-neutral-400 text-neutral-200 uppercase transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#d4ff00]" />
                  <span>[SOLO FOTOS]</span>
                </button>
                <button
                  type="button"
                  onClick={handleTriggerShareWhatsApp}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-[#262626] bg-[#121212] hover:bg-[#1a1a1a] hover:border-neutral-400 text-neutral-200 uppercase transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#d4ff00]" />
                  <span>[WHATSAPP]</span>
                </button>
                <button
                  type="button"
                  onClick={handleTriggerShareFacebook}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-[#262626] bg-[#121212] hover:bg-[#1a1a1a] hover:border-neutral-400 text-neutral-200 uppercase transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-[#d4ff00]" />
                  <span>[MARKETPLACE]</span>
                </button>
              </div>

              {/* Aviso Técnico / Fallback */}
              <div className="mt-3 p-3 bg-black border border-[#262626] font-mono text-[11px] text-[#828282] leading-relaxed">
                <span className="text-white font-bold">[FALLBACK TÉCNICO]:</span>{' '}
                El sistema invoca el motor de WebShare nativo del SO. Si el host no acepta el paquete combinado, las {images.length} imágenes se preparan para guardado y el texto comercial se transfiere inmediatamente al búfer del portapapeles para pegado instantáneo.
              </div>
            </div>

            {/* CONFIDENTIAL SELLER INTERNAL LEDGER */}
            {product.notes && (
              <div className="border border-dashed border-[#404040] bg-[#0a0a0a] p-3 sm:p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <span className="text-white font-bold tracking-wider">
                    [CONFIDENCIAL / NOTAS DEL VENDEDOR]
                  </span>
                  <span className="text-[#828282]">[NIVEL 0: PRIVADO]</span>
                </div>
                <div className="mt-2 text-neutral-300 text-[11px] leading-relaxed">
                  {product.notes}
                </div>
              </div>
            )}
          </section>
        </div>
      </motion.div>

      {/* Lightbox a Pantalla Completa */}
      {isLightboxOpen && (
        <ImageViewerModal
          images={images.map((img, i) => ({ url: imageUrls[i], fileName: img.fileName }))}
          initialIndex={selectedImageIndex}
          productName={product.name}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}
