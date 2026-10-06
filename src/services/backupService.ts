import { ProductRepository } from '../repositories/productRepository.ts';
import { CategoryRepository } from '../repositories/categoryRepository.ts';
import { getDatabase, executeTransaction } from '../storage/indexedDb.ts';
import { STORES } from '../storage/dbConstants.ts';
import type { Product, ProductCategory, ProductImage } from '../types/product.ts';

export interface BackupManifest {
  app: 'SellHub';
  version: string;
  exportedAt: number;
  totalProducts: number;
  totalImages: number;
}

export interface SerializedBackupImage {
  id: string;
  productId: string;
  mimeType: string;
  fileName: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: number;
  base64Data: string;
}

export interface BackupPackage {
  manifest: BackupManifest;
  products: Product[];
  categories: ProductCategory[];
  images: SerializedBackupImage[];
}

export const BackupService = {
  /**
   * Convierte un Blob binario a cadena Base64
   */
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extraer la parte pura de Base64
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Convierte una cadena Base64 de vuelta a un Blob binario
   */
  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  },

  /**
   * Genera y descarga el archivo de copia de seguridad local en JSON
   */
  async exportBackup(): Promise<{ fileName: string; sizeBytes: number }> {
    const db = await getDatabase();

    const [products, categories] = await Promise.all([
      ProductRepository.getAll(),
      CategoryRepository.getAllCategories(),
    ]);

    // Obtener todas las imágenes binarias
    const allImages = await new Promise<ProductImage[]>((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCT_IMAGES, 'readonly');
      const store = tx.objectStore(STORES.PRODUCT_IMAGES);
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as ProductImage[]) || []);
      request.onerror = reject;
    });

    // Serializar imágenes a Base64
    const serializedImages: SerializedBackupImage[] = [];
    for (const img of allImages) {
      const base64Data = await this.blobToBase64(img.blob);
      serializedImages.push({
        id: img.id,
        productId: img.productId,
        mimeType: img.mimeType || 'image/jpeg',
        fileName: img.fileName,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
        base64Data,
      });
    }

    const backupData: BackupPackage = {
      manifest: {
        app: 'SellHub',
        version: '1.0',
        exportedAt: Date.now(),
        totalProducts: products.length,
        totalImages: serializedImages.length,
      },
      products,
      categories,
      images: serializedImages,
    };

    const jsonString = JSON.stringify(backupData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const nowStr = new Date().toISOString().split('T')[0];
    const fileName = `SellHub_Respaldo_${nowStr}.json`;

    // Disparar descarga en navegador
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return { fileName, sizeBytes: blob.size };
  },

  /**
   * Importa y restaura una copia de seguridad en IndexedDB
   */
  async importBackup(file: File): Promise<{ restoredProducts: number; restoredImages: number }> {
    const text = await file.text();
    let parsed: BackupPackage;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('El archivo seleccionado no es un JSON válido.');
    }

    if (!parsed.manifest || parsed.manifest.app !== 'SellHub') {
      throw new Error('El archivo no corresponde a una copia de seguridad válida de SellHub.');
    }

    const { products = [], categories = [], images = [] } = parsed;

    // Restaurar atómicamente en IndexedDB
    await executeTransaction(
      [STORES.PRODUCTS, STORES.CATEGORIES, STORES.PRODUCT_IMAGES],
      'readwrite',
      async (tx) => {
        const prodStore = tx.objectStore(STORES.PRODUCTS);
        const catStore = tx.objectStore(STORES.CATEGORIES);
        const imgStore = tx.objectStore(STORES.PRODUCT_IMAGES);

        // Limpiar datos actuales para evitar inconsistencias
        prodStore.clear();
        imgStore.clear();

        // Restaurar productos
        for (const p of products) {
          prodStore.put(p);
        }

        // Restaurar categorías
        for (const c of categories) {
          catStore.put(c);
        }

        // Restaurar imágenes
        for (const img of images) {
          const blob = BackupService.base64ToBlob(img.base64Data, img.mimeType);
          const restoredImage: ProductImage = {
            id: img.id,
            productId: img.productId,
            blob,
            mimeType: img.mimeType,
            fileName: img.fileName,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
            createdAt: img.createdAt,
          };
          imgStore.put(restoredImage);
        }
      }
    );

    return {
      restoredProducts: products.length,
      restoredImages: images.length,
    };
  },
};
