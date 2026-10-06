import type { Product, ProductImage } from '../types/product.ts';

export interface SharePayload {
  title: string;
  text: string;
  images: ProductImage[];
}

export interface ShareResult {
  success: boolean;
  requiresFallback?: boolean;
  message?: string;
}

export interface IShareService {
  canShareCombined(images: ProductImage[], text: string): boolean;
  share(payload: SharePayload): Promise<ShareResult>;
}

export const ShareService: IShareService = {
  /**
   * Determina si el entorno actual soporta compartir archivos y texto simultáneamente
   */
  canShareCombined(images: ProductImage[], text: string): boolean {
    if (typeof navigator === 'undefined' || !navigator.share) {
      return false;
    }

    if (images.length === 0) {
      return true;
    }

    if (!navigator.canShare) {
      return false;
    }

    try {
      const dummyFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      return navigator.canShare({
        files: [dummyFile],
        text: text || 'test',
        title: 'test',
      });
    } catch {
      return false;
    }
  },

  /**
   * Orquesta la compartición nativa o delega en fallback asistido
   */
  async share(payload: SharePayload): Promise<ShareResult> {
    const { title, text, images } = payload;

    // Caso 1: Sin soporte de Web Share API en este navegador
    if (typeof navigator === 'undefined' || !navigator.share) {
      return {
        success: false,
        requiresFallback: true,
        message: 'Tu navegador actual no soporta la API nativa de compartir.',
      };
    }

    // Convertir Blobs de imágenes a instancias File
    const files: File[] = images
      .filter((img) => img.blob)
      .map(
        (img, idx) =>
          new File([img.blob], img.fileName || `foto_${idx + 1}.jpg`, {
            type: img.mimeType || 'image/jpeg',
          })
      );

    // Caso 2: Producto sin fotografías (solo texto/copy)
    if (files.length === 0) {
      try {
        await navigator.share({
          title,
          text,
        });
        return { success: true };
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          return { success: false, message: 'Compartir cancelado por el usuario.' };
        }
        return { success: false, requiresFallback: true };
      }
    }

    // Caso 3: Producto con fotos y texto (intento combinado)
    try {
      const shareData: ShareData = {
        title,
        text,
        files,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { success: true };
      } else {
        // El navegador no acepta archivos + texto en la misma llamada
        return {
          success: false,
          requiresFallback: true,
          message: 'Este navegador no permite enviar archivos y texto en una sola llamada.',
        };
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return { success: false, message: 'Compartir cancelado.' };
      }
      return {
        success: false,
        requiresFallback: true,
        message: 'No se pudo compartir de forma combinada.',
      };
    }
  },
};
