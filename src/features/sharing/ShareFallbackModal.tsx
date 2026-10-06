import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Download, Share2, Check, AlertTriangle } from 'lucide-react';
import type { Product, ProductImage } from '../../types/product.ts';

interface ShareFallbackModalProps {
  product: Product;
  images: ProductImage[];
  onClose: () => void;
  onCopyText: (text: string) => Promise<void>;
}

export function ShareFallbackModal({
  product,
  images,
  onClose,
  onCopyText,
}: ShareFallbackModalProps) {
  const [copyDone, setCopyDone] = useState(false);

  const handleCopy = async () => {
    if (product.description) {
      await onCopyText(product.description);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2500);
    }
  };

  const handleShareFilesOnly = async () => {
    if (images.length === 0) return;
    const files = images.map(
      (img, i) =>
        new File([img.blob], img.fileName || `foto_${i + 1}.jpg`, {
          type: img.mimeType || 'image/jpeg',
        })
    );

    if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({ files });
      } catch {
        handleDownloadAll();
      }
    } else {
      handleDownloadAll();
    }
  };

  const handleDownloadAll = () => {
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

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-[#262626] font-mono text-xs shadow-2xl"
      >
        {/* Cabecera */}
        <div className="p-3 bg-[#0d0d0d] border-b border-[#262626] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="font-bold uppercase tracking-wider">[ASISTENTE DE COMPARTIR]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#828282] hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Explicativo en Español */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-[#141414] border border-[#262626] text-[#e5e2e1] leading-relaxed">
            <p className="font-bold text-white mb-1">
              Este navegador no permite adjuntar las fotografías y el texto simultáneamente en una sola acción.
            </p>
            <p className="text-[11px] text-[#828282]">
              Para no perder nada de contenido, puedes copiar el copy comercial y luego compartir o descargar las fotografías de forma separada:
            </p>
          </div>

          {/* Opciones asistidas */}
          <div className="space-y-2">
            {/* Paso 1: Copiar Copy */}
            <div className="p-3 border border-[#262626] bg-[#0d0d0d] flex items-center justify-between gap-3">
              <div>
                <span className="text-white font-bold block">1. COPIAR COPY COMERCIAL</span>
                <span className="text-[10px] text-[#828282]">
                  {product.description ? `${product.description.length} caracteres listos para pegar` : 'Sin copy registrado'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-white hover:bg-[#d4ff00] text-black font-bold uppercase transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copyDone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyDone ? '[COPIADO]' : '[COPIAR COPY]'}</span>
              </button>
            </div>

            {/* Paso 2: Compartir Fotografías */}
            <div className="p-3 border border-[#262626] bg-[#0d0d0d] flex items-center justify-between gap-3">
              <div>
                <span className="text-white font-bold block">2. COMPARTIR FOTOGRAFÍAS</span>
                <span className="text-[10px] text-[#828282]">
                  {images.length} fotos listas ({images.reduce((a, b) => a + (b.blob?.size || 0), 0) > 0 ? `${(images.reduce((a, b) => a + (b.blob?.size || 0), 0) / (1024 * 1024)).toFixed(1)}MB` : '0MB'})
                </span>
              </div>
              <button
                type="button"
                onClick={handleShareFilesOnly}
                disabled={images.length === 0}
                className="px-3 py-2 bg-[#d4ff00] hover:bg-[#c2ea00] text-black font-bold uppercase transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>[COMPARTIR FOTOS]</span>
              </button>
            </div>

            {/* Paso 3: Descargar todas las fotos */}
            <div className="p-3 border border-[#262626] bg-[#0d0d0d] flex items-center justify-between gap-3">
              <div>
                <span className="text-white font-bold block">3. O DESCARGAR FOTOS A DISCO</span>
                <span className="text-[10px] text-[#828282]">
                  Guardar archivos directamente en tu dispositivo
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={images.length === 0}
                className="px-3 py-2 border border-[#262626] bg-[#141414] hover:bg-white hover:text-black text-white uppercase transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>[DESCARGAR]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0d0d0d] border-t border-[#262626] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#262626] bg-[#121212] hover:bg-white hover:text-black text-white uppercase cursor-pointer"
          >
            [ENTENDIDO // CERRAR]
          </button>
        </div>
      </motion.div>
    </div>
  );
}
