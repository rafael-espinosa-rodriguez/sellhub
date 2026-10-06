import { STORES } from '../storage/dbConstants.ts';
import { executeTransaction, getDatabase } from '../storage/indexedDb.ts';
import type { ProductCategory } from '../types/product.ts';
import { CATEGORIAS_PREDETERMINADAS } from '../types/product.ts';

export const CategoryRepository = {
  async getAllCategories(): Promise<ProductCategory[]> {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CATEGORIES, 'readonly');
      const store = tx.objectStore(STORES.CATEGORIES);
      const request = store.getAll();

      request.onsuccess = () => {
        const categories = request.result as ProductCategory[];
        if (!categories || categories.length === 0) {
          resolve(CATEGORIAS_PREDETERMINADAS);
        } else {
          resolve(categories);
        }
      };

      request.onerror = () => {
        reject(new Error('No se pudieron cargar las categorías locales.'));
      };
    });
  },

  async addCategory(name: string): Promise<ProductCategory> {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');
    const newCategory: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      slug,
      isCustom: true,
    };

    await executeTransaction(STORES.CATEGORIES, 'readwrite', async (tx) => {
      const store = tx.objectStore(STORES.CATEGORIES);
      store.add(newCategory);
    });

    return newCategory;
  },
};
