import { DB_NAME, DB_VERSION, STORES, INDEXES } from './dbConstants.ts';
import { CATEGORIAS_PREDETERMINADAS } from '../types/product.ts';

let dbInstance: IDBDatabase | null = null;

export function getDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no es compatible con este entorno de navegación.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. ObjectStore de Productos
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
        productStore.createIndex(INDEXES.PRODUCTS_BY_CATEGORY, 'category', { unique: false });
        productStore.createIndex(INDEXES.PRODUCTS_BY_STATUS, 'status', { unique: false });
        productStore.createIndex(INDEXES.PRODUCTS_BY_FAVORITE, 'isFavorite', { unique: false });
        productStore.createIndex(INDEXES.PRODUCTS_BY_CREATED, 'createdAt', { unique: false });
      }

      // 2. ObjectStore de Fotografías de Productos (Blobs binarios)
      if (!db.objectStoreNames.contains(STORES.PRODUCT_IMAGES)) {
        const imageStore = db.createObjectStore(STORES.PRODUCT_IMAGES, { keyPath: 'id' });
        imageStore.createIndex(INDEXES.IMAGES_BY_PRODUCT, 'productId', { unique: false });
        imageStore.createIndex(INDEXES.IMAGES_BY_PRODUCT_PRIMARY, ['productId', 'isPrimary'], { unique: false });
      }

      // 3. ObjectStore de Categorías
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        // Precargar categorías predeterminadas
        for (const cat of CATEGORIAS_PREDETERMINADAS) {
          categoryStore.add(cat);
        }
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      reject(new Error(`Error al abrir la base de datos local: ${error?.message || 'Desconocido'}`));
    };
  });
}

export async function executeTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  callback: (transaction: IDBTransaction) => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  const tx = db.transaction(storeNames, mode);

  return new Promise((resolve, reject) => {
    let result: T;

    callback(tx)
      .then((res) => {
        result = res;
      })
      .catch((err) => {
        tx.abort();
        reject(err);
      });

    tx.oncomplete = () => {
      resolve(result);
    };

    tx.onerror = () => {
      reject(new Error(`Error en la transacción local: ${tx.error?.message || 'Error no especificado'}`));
    };

    tx.onabort = () => {
      reject(new Error('La transacción local fue cancelada.'));
    };
  });
}
