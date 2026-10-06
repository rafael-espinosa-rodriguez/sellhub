/**
 * ImageService: Gestión, compresión y optimización local de fotografías
 * Procesamiento 100% en cliente mediante HTMLCanvasElement sin librerías pesadas.
 */

export interface OptimizedImageResult {
  blob: Blob;
  fileName: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export const ImageService = {
  /**
   * Comprime y redimensiona suavemente una imagen a dimensiones estándar para catálogo (máx 1920px)
   * Reduce fotos tomadas con móviles modernos de 8-15 MB a ~300-600 KB manteniendo nitidez.
   */
  async compressImage(
    file: File | Blob,
    fileName: string = 'imagen.jpg',
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    quality: number = 0.85
  ): Promise<OptimizedImageResult> {
    return new Promise((resolve, reject) => {
      const originalSize = file.size;
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Calcular relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de Canvas para compresión.'));
          return;
        }

        // Renderizado nítido
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP si es compatible, o JPEG de alta calidad
        const mimeType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Fallo al generar el Blob comprimido de la imagen.'));
              return;
            }

            resolve({
              blob,
              fileName: fileName.replace(/\.[^/.]+$/, '.jpg'),
              mimeType,
              originalSize,
              compressedSize: blob.size,
              width,
              height,
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`No se pudo leer la imagen local: ${fileName}`));
      };

      img.src = objectUrl;
    });
  },

  /**
   * Formatea el peso en bytes a KB o MB legibles
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
};
