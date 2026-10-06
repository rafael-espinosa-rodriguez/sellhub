import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface ImageViewerModalProps {
  images: { url: string; fileName?: string }[];
  initialIndex: number;
  productName: string;
  onClose: () => void;
}

export function ImageViewerModal({
  images,
  initialIndex,
  productName,
  onClose,
}: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = [initialIndex, (idx: number) => {}];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (images.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md select-none"
      >
        {/* Barra Superior */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3 font-mono text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#d4ff00]" />
            <span className="uppercase font-bold tracking-wider">
              [VISOR HD]: {productName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#828282]">
              FOTO [{String(initialIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}]
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-[#141414] hover:bg-white hover:text-black border border-[#262626] text-white font-mono text-xs uppercase cursor-pointer transition-colors"
            >
              [CERRAR ESC]
            </button>
          </div>
        </div>

        {/* Imagen Central en Alta Resolución */}
        <div className="flex-1 flex items-center justify-center relative my-4 overflow-hidden">
          <motion.img
            key={initialIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            src={images[initialIndex]?.url}
            alt={`${productName} HD`}
            className="max-h-[82vh] max-w-full object-contain border border-[#262626] bg-[#050505]"
          />
        </div>

        {/* Barra Inferior */}
        <div className="border-t border-[#262626] pt-3 flex items-center justify-between font-mono text-xs text-[#828282]">
          <span>// Archivo local renderizado a resolución original</span>
          <button
            type="button"
            onClick={() => {
              const a = document.createElement('a');
              a.href = images[initialIndex]?.url || '';
              a.download = `${productName}_foto_${initialIndex + 1}.jpg`;
              a.click();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#262626] bg-[#121212] hover:bg-[#d4ff00] hover:text-black text-white text-[11px] uppercase transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>[DESCARGAR ESTA FOTO]</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
