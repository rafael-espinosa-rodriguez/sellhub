export const DB_NAME = 'SellHubDB';
export const DB_VERSION = 1;

export const STORES = {
  PRODUCTS: 'products',
  PRODUCT_IMAGES: 'product_images',
  CATEGORIES: 'categories',
} as const;

export const INDEXES = {
  PRODUCTS_BY_CATEGORY: 'by_category',
  PRODUCTS_BY_STATUS: 'by_status',
  PRODUCTS_BY_FAVORITE: 'by_favorite',
  PRODUCTS_BY_CREATED: 'by_created',
  IMAGES_BY_PRODUCT: 'by_product',
  IMAGES_BY_PRODUCT_PRIMARY: 'by_product_primary',
} as const;
