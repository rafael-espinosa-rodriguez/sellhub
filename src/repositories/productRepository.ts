import { STORES, INDEXES } from '../storage/dbConstants.ts';
import { executeTransaction, getDatabase } from '../storage/indexedDb.ts';
import type { 
  Product, 
  ProductImage, 
  ProductWithImages, 
  ProductStatus 
} from '../types/product.ts';

export const ProductRepository = {
  /**
   * Obtiene todos los productos registrados ordenados por fecha de creación descendente
   */
  async getAll(): Promise<Product[]> {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const products = (request.result as Product[]) || [];
        // Orden por defecto: más recientes primero
        products.sort((a, b) => b.createdAt - a.createdAt);
        resolve(products);
      };

      request.onerror = () => {
        reject(new Error('Error al cargar la lista de productos de IndexedDB.'));
      };
    });
  },

  /**
   * Obtiene un producto por ID junto con todas sus imágenes asociadas
   */
  async getByIdWithImages(id: string): Promise<ProductWithImages | null> {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PRODUCTS, STORES.PRODUCT_IMAGES], 'readonly');
      const productStore = tx.objectStore(STORES.PRODUCTS);
      const imageStore = tx.objectStore(STORES.PRODUCT_IMAGES);
      const imageIndex = imageStore.index(INDEXES.IMAGES_BY_PRODUCT);

      const productRequest = productStore.get(id);
      const imagesRequest = imageIndex.getAll(IDBKeyRange.only(id));

      let product: Product | null = null;
      let images: ProductImage[] = [];

      productRequest.onsuccess = () => {
        product = productRequest.result || null;
      };

      imagesRequest.onsuccess = () => {
        images = imagesRequest.result || [];
      };

      tx.oncomplete = () => {
        if (!product) {
          resolve(null);
          return;
        }

        // Ordenar fotos por sortOrder ascendente
        images.sort((a, b) => a.sortOrder - b.sortOrder);

        const primaryImage = images.find((img) => img.isPrimary) || images[0];
        let primaryImageUrl: string | undefined = undefined;

        if (primaryImage && primaryImage.blob) {
          primaryImageUrl = URL.createObjectURL(primaryImage.blob);
        }

        resolve({
          ...product,
          images,
          primaryImageUrl,
        });
      };

      tx.onerror = () => {
        reject(new Error(`No se pudo obtener el producto con ID: ${id}`));
      };
    });
  },

  /**
   * Obtiene las imágenes asociadas a un producto
   */
  async getImagesByProductId(productId: string): Promise<ProductImage[]> {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCT_IMAGES, 'readonly');
      const imageStore = tx.objectStore(STORES.PRODUCT_IMAGES);
      const imageIndex = imageStore.index(INDEXES.IMAGES_BY_PRODUCT);
      const request = imageIndex.getAll(IDBKeyRange.only(productId));

      request.onsuccess = () => {
        const images = (request.result as ProductImage[]) || [];
        images.sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(images);
      };

      request.onerror = () => {
        reject(new Error('No se pudieron obtener las imágenes del producto.'));
      };
    });
  },

  /**
   * Obtiene la imagen principal de cada producto para vistas rápidas de catálogo
   */
  async getPrimaryImagesMap(): Promise<Record<string, string>> {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCT_IMAGES, 'readonly');
      const store = tx.objectStore(STORES.PRODUCT_IMAGES);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = (request.result as ProductImage[]) || [];
        const map: Record<string, string> = {};

        // Agrupar por producto y seleccionar la principal o la primera
        for (const img of images) {
          if (!map[img.productId] || img.isPrimary) {
            // Liberar previas si hubiera antes de asignar
            if (map[img.productId]) {
              URL.revokeObjectURL(map[img.productId]);
            }
            map[img.productId] = URL.createObjectURL(img.blob);
          }
        }

        resolve(map);
      };

      request.onerror = () => {
        reject(new Error('No se pudieron recuperar las miniaturas principales.'));
      };
    });
  },

  /**
   * Obtiene el conteo de imágenes por cada producto
   */
  async getImageCountsMap(): Promise<Record<string, number>> {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCT_IMAGES, 'readonly');
      const store = tx.objectStore(STORES.PRODUCT_IMAGES);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = (request.result as ProductImage[]) || [];
        const countMap: Record<string, number> = {};

        for (const img of images) {
          countMap[img.productId] = (countMap[img.productId] || 0) + 1;
        }

        resolve(countMap);
      };

      request.onerror = () => {
        reject(new Error('No se pudo calcular el conteo de imágenes por producto.'));
      };
    });
  },

  /**
   * Guarda o actualiza un producto junto con sus imágenes en una única transacción atómica
   */
  async saveProduct(
    product: Product,
    images: ProductImage[]
  ): Promise<ProductWithImages> {
    const now = Date.now();
    const preparedProduct: Product = {
      ...product,
      updatedAt: now,
      createdAt: product.createdAt || now,
    };

    await executeTransaction(
      [STORES.PRODUCTS, STORES.PRODUCT_IMAGES],
      'readwrite',
      async (tx) => {
        const productStore = tx.objectStore(STORES.PRODUCTS);
        const imageStore = tx.objectStore(STORES.PRODUCT_IMAGES);

        // 1. Guardar o actualizar registro de producto
        productStore.put(preparedProduct);

        // 2. Eliminar fotos previas de este producto si fuera actualización
        const imageIndex = imageStore.index(INDEXES.IMAGES_BY_PRODUCT);
        const existingKeysRequest = imageIndex.getAllKeys(IDBKeyRange.only(product.id));

        await new Promise<void>((resKey, rejKey) => {
          existingKeysRequest.onsuccess = () => {
            const keys = existingKeysRequest.result;
            for (const key of keys) {
              imageStore.delete(key);
            }
            resKey();
          };
          existingKeysRequest.onerror = () => rejKey(existingKeysRequest.error);
        });

        // 3. Insertar las imágenes actualizadas con su clave foránea productId
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const preparedImage: ProductImage = {
            ...img,
            productId: product.id,
            sortOrder: i,
            isPrimary: img.isPrimary || (i === 0 && !images.some((x) => x.isPrimary)),
            createdAt: img.createdAt || now,
          };
          imageStore.put(preparedImage);
        }
      }
    );

    return {
      ...preparedProduct,
      images,
    };
  },

  /**
   * Elimina un producto y todas sus fotografías de forma atómica
   */
  async deleteProduct(id: string): Promise<void> {
    await executeTransaction(
      [STORES.PRODUCTS, STORES.PRODUCT_IMAGES],
      'readwrite',
      async (tx) => {
        const productStore = tx.objectStore(STORES.PRODUCTS);
        const imageStore = tx.objectStore(STORES.PRODUCT_IMAGES);

        // 1. Eliminar producto
        productStore.delete(id);

        // 2. Eliminar imágenes vinculadas
        const imageIndex = imageStore.index(INDEXES.IMAGES_BY_PRODUCT);
        const keysRequest = imageIndex.getAllKeys(IDBKeyRange.only(id));

        await new Promise<void>((resKey, rejKey) => {
          keysRequest.onsuccess = () => {
            const keys = keysRequest.result;
            for (const key of keys) {
              imageStore.delete(key);
            }
            resKey();
          };
          keysRequest.onerror = () => rejKey(keysRequest.error);
        });
      }
    );
  },

  /**
   * Alterna el estado de favorito de un producto de forma instantánea
   */
  async toggleFavorite(id: string): Promise<boolean> {
    let nextFavoriteState = false;

    await executeTransaction(STORES.PRODUCTS, 'readwrite', async (tx) => {
      const store = tx.objectStore(STORES.PRODUCTS);
      const request = store.get(id);

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          const product = request.result as Product | undefined;
          if (product) {
            nextFavoriteState = !product.isFavorite;
            product.isFavorite = nextFavoriteState;
            product.updatedAt = Date.now();
            store.put(product);
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });

    return nextFavoriteState;
  },

  /**
   * Actualiza el estado de disponibilidad del producto
   */
  async updateStatus(id: string, status: ProductStatus): Promise<void> {
    await executeTransaction(STORES.PRODUCTS, 'readwrite', async (tx) => {
      const store = tx.objectStore(STORES.PRODUCTS);
      const request = store.get(id);

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          const product = request.result as Product | undefined;
          if (product) {
            product.status = status;
            product.updatedAt = Date.now();
            store.put(product);
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  },

  /**
   * Devuelve el total de productos almacenados
   */
  async count(): Promise<number> {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('No se pudo contar los productos.'));
      };
    });
  },
};
