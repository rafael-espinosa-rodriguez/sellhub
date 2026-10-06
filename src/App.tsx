import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { BottomNavigation } from './components/layout/BottomNavigation.tsx';
import { ToastContainer } from './components/common/Toast.tsx';
import type { ActiveTab, ToastMessage } from './types/navigation.ts';
import { ProductRepository } from './repositories/productRepository.ts';
import { CategoryRepository } from './repositories/categoryRepository.ts';
import { getDatabase } from './storage/indexedDb.ts';
import type { Product, ProductCategory, ProductStatus, ProductImage } from './types/product.ts';
import { CatalogFilters, type SortOption } from './features/catalog/CatalogFilters.tsx';
import { ProductGrid } from './features/catalog/ProductGrid.tsx';
import { ProductForm } from './features/product-form/ProductForm.tsx';
import { ProductDetailModal } from './features/product-detail/ProductDetailModal.tsx';
import { ShareFallbackModal } from './features/sharing/ShareFallbackModal.tsx';
import { ShareService } from './services/shareService.ts';
import { BackupService } from './services/backupService.ts';
import { 
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalogo');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [imageCountMap, setImageCountMap] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [dbStatusDetails, setDbStatusDetails] = useState<string>('Inicializando base de datos local...');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProductImages, setEditingProductImages] = useState<ProductImage[]>([]);

  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductImages, setSelectedProductImages] = useState<ProductImage[]>([]);

  // Modal Fallback de Compartir (Fase 7)
  const [shareFallbackProduct, setShareFallbackProduct] = useState<{
    product: Product;
    images: ProductImage[];
  } | null>(null);

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('recientes');

  const fileImportInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'exito' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Carga reactiva de datos desde IndexedDB
  const loadCatalogData = useCallback(async () => {
    try {
      await getDatabase();
      setIsDbReady(true);
      const [allProducts, allCategories, primaryImages, counts] = await Promise.all([
        ProductRepository.getAll(),
        CategoryRepository.getAllCategories(),
        ProductRepository.getPrimaryImagesMap(),
        ProductRepository.getImageCountsMap(),
      ]);
      setProducts(allProducts);
      setCategories(allCategories);
      setImageMap(primaryImages);
      setImageCountMap(counts);
      setDbStatusDetails(`SellHubDB activa con ${allProducts.length} productos y ${allCategories.length} categorías.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido de persistencia.';
      setIsDbReady(false);
      setDbStatusDetails(`Fallo de almacenamiento local: ${msg}`);
      showToast('Error al cargar datos de IndexedDB local.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  // Atajos de teclado globales (Fase 10)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleOpenCreateForm();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Si se navega a favoritos desde el menú lateral
  useEffect(() => {
    if (activeTab === 'favoritos') {
      setOnlyFavorites(true);
    }
  }, [activeTab]);

  // Toggle Favorito en BD
  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const isFav = await ProductRepository.toggleFavorite(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: isFav } : p))
      );
      if (selectedProductForDetail && selectedProductForDetail.id === id) {
        setSelectedProductForDetail((prev) => prev ? { ...prev, isFavorite: isFav } : null);
      }
      showToast(
        isFav ? 'FAVORITO AGREGADO AL REGISTRO' : 'ELIMINADO DE FAVORITOS',
        'info'
      );
    } catch {
      showToast('ERROR AL ACTUALIZAR FAVORITO', 'error');
    }
  };

  // Copia rápida al portapapeles
  const handleCopyText = async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) {
      showToast('SIN CONTENIDO DE COPY COMERCIAL', 'info');
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('COPY COMERCIAL COPIADO AL PORTAPAPELES', 'exito');
    } catch {
      showToast('ERROR AL COPIAR TEXTO', 'error');
    }
  };

  // Abrir detalle de producto
  const handleSelectProduct = async (product: Product) => {
    try {
      const fullProduct = await ProductRepository.getByIdWithImages(product.id);
      if (fullProduct) {
        setSelectedProductForDetail(fullProduct);
        setSelectedProductImages(fullProduct.images || []);
      }
    } catch {
      showToast('ERROR AL ABRIR DETALLE DEL PRODUCTO', 'error');
    }
  };

  // Abrir formulario para Crear
  const handleOpenCreateForm = () => {
    setEditingProduct(null);
    setEditingProductImages([]);
    setIsFormOpen(true);
  };

  // Abrir formulario para Editar
  const handleOpenEditForm = async (product: Product) => {
    try {
      const full = await ProductRepository.getByIdWithImages(product.id);
      setEditingProduct(product);
      setEditingProductImages(full?.images || []);
      setSelectedProductForDetail(null);
      setIsFormOpen(true);
    } catch {
      showToast('ERROR AL CARGAR PRODUCTO PARA EDICIÓN', 'error');
    }
  };

  // Guardar Producto
  const handleSaveProduct = async (productPayload: Product, imagesPayload: ProductImage[]) => {
    try {
      await ProductRepository.saveProduct(productPayload, imagesPayload);
      await loadCatalogData();
      setIsFormOpen(false);
      setEditingProduct(null);
      setEditingProductImages([]);
      showToast(
        editingProduct ? 'PRODUCTO ACTUALIZADO CORRECTAMENTE' : 'PRODUCTO GUARDADO EN INDEXEDDB',
        'exito'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el producto.';
      showToast(`ERROR AL GUARDAR: ${msg}`, 'error');
      throw err;
    }
  };

  // Eliminar Producto
  const handleDeleteProduct = async (id: string) => {
    try {
      await ProductRepository.deleteProduct(id);
      await loadCatalogData();
      setSelectedProductForDetail(null);
      showToast('REGISTRO PURGADO DE LA BASE DE DATOS LOCAL', 'exito');
    } catch {
      showToast('ERROR AL ELIMINAR EL PRODUCTO', 'error');
    }
  };

  // Agregar categoría rápida
  const handleAddCategory = async (catName: string) => {
    const created = await CategoryRepository.addCategory(catName);
    const updated = await CategoryRepository.getAllCategories();
    setCategories(updated);
    showToast(`CATEGORÍA "${catName.toUpperCase()}" REGISTRADA`, 'exito');
    return created;
  };

  // Compartir producto con ShareService y Fallback Asistido (Fase 7)
  const handleShareProduct = async (product: Product, images: ProductImage[]) => {
    const shareText = product.description || `${product.name} - $${product.price} USD`;
    
    const result = await ShareService.share({
      title: product.name,
      text: shareText,
      images,
    });

    if (result.success) {
      showToast('PRODUCTO COMPARTIDO SATISFACTORIAMENTE', 'exito');
    } else if (result.requiresFallback) {
      // Abrir modal asistido en español sin perder fotos ni texto
      setShareFallbackProduct({ product, images });
    } else if (result.message) {
      showToast(result.message, 'info');
    }
  };

  // Acción rápida compartir desde tarjeta
  const handleQuickShare = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const images = await ProductRepository.getImagesByProductId(product.id);
      await handleShareProduct(product, images);
    } catch {
      handleSelectProduct(product);
    }
  };

  // Exportar Copia de Seguridad Local (Fase 9)
  const handleExportBackup = async () => {
    try {
      const result = await BackupService.exportBackup();
      showToast(`COPIA DE SEGURIDAD EXPORTADA (${(result.sizeBytes / 1024).toFixed(0)} KB)`, 'exito');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al exportar.';
      showToast(`ERROR AL EXPORTAR: ${msg}`, 'error');
    }
  };

  // Importar Copia de Seguridad Local (Fase 9)
  const handleImportBackupSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await BackupService.importBackup(file);
      await loadCatalogData();
      showToast(`RESTAURADOS: ${res.restoredProducts} PRODUCTOS Y ${res.restoredImages} FOTOS`, 'exito');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de importación.';
      showToast(`ERROR: ${msg}`, 'error');
    } finally {
      if (fileImportInputRef.current) fileImportInputRef.current.value = '';
    }
  };

  // Precargar catálogo de demostración
  const handleSeedExactCatalog = async () => {
    try {
      const demoItems: { product: Omit<Product, 'id'>; imageUrl: string }[] = [
        {
          product: {
            sku: 'CEL-0981',
            name: 'iPhone 13 Pro 128GB Grafito',
            price: 650.00,
            category: 'Celulares',
            description: '✨ *iPhone 13 Pro 128GB Grafito*\n💰 Precio especial: $650.00 USD\n📦 Estado: Disponible inmediata\n🔍 Incluye accesorios y batería 88%',
            notes: 'Batería 88% original. Libre para cualquier compañía. Incluye cargador rápido y funda de silicón.',
            status: 'disponible',
            isFavorite: true,
            createdAt: Date.now() - 3600000 * 24 * 2,
            updatedAt: Date.now() - 3600000 * 24 * 2,
          },
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUcMT17LHcUVJ82bl9mdRzy1uKh1jbLbfM-nscKEMY87-ETF-MVa7cTI7jGz8YRPH6eEXOCtEgOqS4NVfHsU9TIVg-EsUjiGfS9vZY5hwiEsXwxheC5mGVGd9xDRrk7tQTucyiSbFwOuMleZkLh-Wo4fOXFU53bu_5vOgFYZgZFZxjQpLViBjhegEgfWmdLBPhNdrJCh8hy_sV2EAr2TffjcplZ5ceiLdRC--pSL8z',
        },
        {
          product: {
            sku: 'COM-4412',
            name: 'MacBook Air M1 256GB Gris Espacial',
            price: 720.00,
            category: 'Computación',
            description: '💻 *MacBook Air M1 256GB Gris Espacial*\n💰 Precio: $720.00 USD\n⏳ Estado: En reserva hasta mañana\n🔋 45 ciclos de batería, cargador original',
            notes: '8GB RAM unificada, caja original y cargador de 30W. Sin ningún rayón.',
            status: 'reservado',
            isFavorite: false,
            createdAt: Date.now() - 3600000 * 24 * 3,
            updatedAt: Date.now() - 3600000 * 24 * 3,
          },
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwOgpkWNequ_7FD7BTuIy157_FFesqFCZ0rHrK_Wx-Qjp1D2cw6k0u67CqOfhQe5QO4v4mYMfOXSrHgcfW-a80sgg0jI9DEj4LMTm--IShQwQBZ6qkqvrzLpC8IzwgGulqsytpsz8s-6WFceSAJJwocbBDO2O44yoiVg4CrG2T2Gd54QNIbYiTt58z4oTiInlCI_bse3c9LEbb5Q22Q0NHMKtzCpCdiYOyTSDrGmaz',
        },
        {
          product: {
            sku: 'ELE-1209',
            name: 'Sony WH-1000XM4 Cancelación Ruido',
            price: 195.00,
            category: 'Electrónica',
            description: '🎧 *Sony WH-1000XM4 Cancelación de Ruido*\n💰 Precio: $195.00 USD\n📦 Estado: Disponible en estuche original\n🎵 Autonomía de 30 horas y audio Hi-Res',
            notes: 'Almohadillas como nuevas, cable auxiliar incluido, 30h de batería.',
            status: 'disponible',
            isFavorite: true,
            createdAt: Date.now() - 3600000 * 24 * 4,
            updatedAt: Date.now() - 3600000 * 24 * 4,
          },
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDimMLcTBwn56DT19RHnnNtSNkynme2lRhuy69Z6ZeRp586pMIq-Fu8ZQRrSZfb8ffN9uTLOEMxEH9wC2mvSDMFIXKw65AEQnVKfTvkvSKjdInSTohvooXnWgj_xFKFabxKS7OrufDxwPocqzl0IOjo6zGJFzLeKfFKc0dCy-lK5E1QLYZYXRMIxaJC8ncB4UTtd1-rncM7eDTktwJijrxIcW40Duq4gV764JEmysoB',
        },
        {
          product: {
            sku: 'HOG-5501',
            name: 'Cafetera Espresso De\'Longhi Dedica',
            price: 145.00,
            category: 'Hogar',
            description: '☕ *Cafetera De\'Longhi Dedica EC680M*\n💰 Precio venta: $145.00 USD\n🏷️ Estado: Vendido\n✨ Acero inoxidable con vaporizador profesional',
            notes: '15 bares de presión, vaporizador profesional para leche, accesorios completos.',
            status: 'vendido',
            isFavorite: false,
            createdAt: Date.now() - 3600000 * 24 * 5,
            updatedAt: Date.now() - 3600000 * 24 * 5,
          },
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwfN6Q3IxCG3jBj0dwz3cv57OWAJOa_c8hChhOzO2R1Nst-w3qdxsVBlXyX_8E3vPibzy-Z7Q9bX8RoqeXCGT5chDHPUAE7IBJD4dQR5baFdJtKaiWcGdyEsQWxYTZNTHFszUaZxlVxWJumqGxdo9qfGUfX8Bzyw-EPX4Cw8GfgivL6CQnU7tTdZNYOY_qTszdIqhi1bPk0I7KpPHYXUMuerwv5GxVZX4b5867y9QF',
        },
        {
          product: {
            sku: 'ACC-3301',
            name: 'Apple Watch Series 7 45mm Midnight',
            price: 230.00,
            category: 'Accesorios',
            description: '⌚ *Apple Watch Series 7 45mm Midnight*\n💰 Precio directo: $230.00 USD\n📦 Estado: Disponible con correa deportiva\n🔋 Salud 94%, cargador magnético rápido USB-C',
            notes: 'Pantalla siempre activa, sensor ECG y SpO2, salud batería 94%.',
            status: 'disponible',
            isFavorite: true,
            createdAt: Date.now() - 3600000 * 24 * 6,
            updatedAt: Date.now() - 3600000 * 24 * 6,
          },
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiJdsnRo8gGLWb932v_h9EW_dLDjCKyICsVEe60jmYqD04rBawlB6gqHuZy-C6H36ZNt0kwLZN_A5NrDiX0AZmodInDWBuIZdSPQZ4OPO7MG80rfoTVHH-gZ-QSz2n3elqMOdQVF1ZPAKB19dZfylqBEOQh1aSM1Mgxjt7KB1k4sC1UulaDHylvOMGNCAZQyhD5nJZQ97mL_HRNsra6hz7Jt3_E6mHBGjJiM9dc621',
        },
        {
          product: {
            sku: 'COM-8874',
            name: 'Monitor Gamer LG UltraGear 27\'\' IPS',
            price: 280.00,
            category: 'Computación',
            description: '🖥️ *Monitor Gamer LG UltraGear 27 pulgadas*\n💰 Precio catálogo: $280.00 USD\n🛡️ Estado: En revisión interna\n⚡ 144Hz 1ms IPS G-Sync compatible, base original',
            notes: 'Resolución QHD, 144Hz, HDR10 compatible, soporte y fuente incluidos.',
            status: 'oculto',
            isFavorite: false,
            createdAt: Date.now() - 3600000 * 24 * 7,
            updatedAt: Date.now() - 3600000 * 24 * 7,
          },
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7LIRV0JpQ5fF7cAETYdyKX_5T6goIA1WobSatfdMLRIP0t6pZbCoNz3Fby8STu4hp7ZLCXOfEgF2XrKFFOKODDcPdT2OHZRu02Bb2ZNPfGGOmlbE4BDIQVric3wcMo5fbrZbM7Iqjw16tYa2p2yZ1htYqfTEjqcfey83B_q_Cgz9tbYIyr2v7248I9t-K2U3jnqRnCrZBOGDkrWCc2l1MxVREjL0IwrMJ9pSQ5geX',
        },
      ];

      for (let i = 0; i < demoItems.length; i++) {
        const item = demoItems[i];
        const prodId = `item-${Date.now()}-${i}`;
        
        let blob: Blob = new Blob([''], { type: 'image/jpeg' });
        try {
          const res = await fetch(item.imageUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          blob = await new Promise((r) => canvas.toBlob((b) => r(b || new Blob()), 'image/jpeg'));
        }

        const images: ProductImage[] = [
          {
            id: `img-${prodId}-0`,
            productId: prodId,
            blob,
            mimeType: 'image/jpeg',
            fileName: `${item.product.name}.jpg`,
            isPrimary: true,
            sortOrder: 0,
            createdAt: Date.now(),
          },
        ];

        await ProductRepository.saveProduct(
          {
            ...item.product,
            id: prodId,
          },
          images
        );
      }

      await loadCatalogData();
      showToast('CATÁLOGO TÉCNICO INICIALIZADO EN INDEXEDDB', 'exito');
    } catch {
      showToast('ERROR AL CARGAR MUESTRAS', 'error');
    }
  };

  // Cálculos de KPIs en Vivo
  const totalSkus = products.length;
  const availableCount = products.filter((p) => p.status === 'disponible').length;
  const reservedCount = products.filter((p) => p.status === 'reservado').length;
  const estimatedValue = products.reduce((acc, p) => acc + (p.price || 0), 0);
  const favoriteCount = products.filter((p) => p.isFavorite).length;

  // Filtrado y Ordenación
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          p.category.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedStatus) {
      result = result.filter((p) => p.status === (selectedStatus as ProductStatus));
    }

    if (onlyFavorites) {
      result = result.filter((p) => p.isFavorite);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'recientes':
          return b.createdAt - a.createdAt;
        case 'precio-menor':
          return a.price - b.price;
        case 'precio-mayor':
          return b.price - a.price;
        case 'nombre':
          return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchTerm, selectedCategory, selectedStatus, onlyFavorites, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setOnlyFavorites(false);
    setSortBy('recientes');
  };

  return (
    <div className="min-h-screen bg-[#050505] font-mono text-[#e5e2e1] antialiased selection:bg-[#d4ff00] selection:text-black">
      {/* Header Técnico Brutalista */}
      <Header
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === 'catalogo') setOnlyFavorites(false);
          if (tab === 'favoritos') setOnlyFavorites(true);
        }}
        productCount={totalSkus}
        onOpenCreateModal={handleOpenCreateForm}
      />

      {/* Sidebar Técnico de Control (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === 'catalogo') setOnlyFavorites(false);
          if (tab === 'favoritos') setOnlyFavorites(true);
        }}
        productCount={totalSkus}
        favoriteCount={favoriteCount}
        categoryCount={categories.length}
      />

      {/* Contenedor Principal */}
      <div className="md:pl-60 flex flex-col min-h-screen pt-14 bg-[#050505]">
        <main className="flex-1 w-full p-4 lg:p-6 pb-24">
          {/* VISTA 1: CATÁLOGO / FAVORITOS */}
          {(activeTab === 'catalogo' || activeTab === 'favoritos') && (
            <div className="space-y-6">
              {products.length === 0 ? (
                <div className="w-full py-16 flex flex-col items-center justify-center text-center border border-[#262626] bg-[#0a0a0a]">
                  <div className="w-12 h-12 bg-[#141414] border border-[#262626] flex items-center justify-center text-[#d4ff00] mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-xs text-[#d4ff00] uppercase tracking-widest">
                    [INVENTARIO_VACÍO]
                  </div>
                  <h3 className="font-title font-bold text-xl text-white mt-1 uppercase">
                    NO HAY ARTÍCULOS EN LA BASE DE DATOS
                  </h3>
                  <p className="font-mono text-xs text-[#828282] max-w-md mt-1 mb-6 leading-relaxed">
                    Puedes inicializar los artículos del diseño exacto o crear tu primer producto con fotografías y copy comercial.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleSeedExactCatalog}
                      className="px-5 py-2.5 bg-[#d4ff00] hover:bg-[#c2ea00] text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      [CARGAR CATÁLOGO DE DEMOSTRACIÓN]
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCreateForm}
                      className="px-5 py-2.5 bg-[#141414] hover:bg-white hover:text-black border border-[#262626] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      [CREAR PRODUCTO]
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <CatalogFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    onlyFavorites={onlyFavorites}
                    onToggleOnlyFavorites={() => setOnlyFavorites((prev) => !prev)}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    categories={categories}
                    totalSkus={totalSkus}
                    availableCount={availableCount}
                    reservedCount={reservedCount}
                    estimatedValue={estimatedValue}
                    favoriteCount={favoriteCount}
                    onOpenCreateModal={handleOpenCreateForm}
                  />

                  <ProductGrid
                    products={filteredProducts}
                    imageMap={imageMap}
                    imageCountMap={imageCountMap}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectProduct={handleSelectProduct}
                    onQuickCopy={(p, e) => handleCopyText(p.description, e)}
                    onQuickShare={handleQuickShare}
                    onResetFilters={handleResetFilters}
                  />
                </>
              )}
            </div>
          )}

          {/* VISTA 2: RESPALDO Y AJUSTES (FASE 9 IMPLEMENTADA) */}
          {activeTab === 'respaldo' && (
            <div className="space-y-6">
              <div className="border border-[#262626] bg-[#0a0a0a] p-5">
                <div className="flex items-center gap-2 font-mono text-[10px] text-[#828282] uppercase tracking-widest">
                  <span className="w-2 h-2 bg-[#d4ff00]" />
                  <span>SISTEMA // PERSISTENCIA LOCAL Y RESPALDO (100% OFFLINE)</span>
                </div>
                <h1 className="font-title font-bold text-2xl text-white uppercase mt-1">
                  AJUSTES / EXP.JSON
                </h1>
                <p className="font-mono text-xs text-[#828282] mt-0.5">
                  // Copia de seguridad 100% en cliente sin servidores remotos. Exporta e importa tus productos con imágenes.
                </p>
              </div>

              {/* Input oculto para importación de JSON */}
              <input
                ref={fileImportInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackupSelected}
                className="hidden"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#262626] bg-[#0d0d0d] p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <span className="text-white font-bold uppercase">[ESTADO DE LA BASE DE DATOS]</span>
                    <span className="text-[#d4ff00]">[SELLHUB_LOCAL]</span>
                  </div>
                  <p className="text-[#828282] leading-relaxed text-[11px]">
                    {dbStatusDetails}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={loadCatalogData}
                      className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#262626] bg-[#141414] hover:bg-white hover:text-black text-white text-xs uppercase cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#d4ff00]" />
                      <span>[VERIFICAR ÍNDICES]</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSeedExactCatalog}
                      className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#262626] bg-[#141414] hover:bg-[#d4ff00] hover:text-black text-white text-xs uppercase cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>[RECARGAR DEMO]</span>
                    </button>
                  </div>
                </div>

                <div className="border border-[#262626] bg-[#0d0d0d] p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <span className="text-white font-bold uppercase">[MÓDULO BACKUP LOCAL]</span>
                    <span className="text-white">[{totalSkus} SKUS]</span>
                  </div>
                  <p className="text-[#828282] leading-relaxed text-[11px]">
                    El respaldo incluye productos, categorías, copies y todas las fotografías binarias codificadas. Puedes guardarlo en una memoria USB o transferirlo a otro dispositivo.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#d4ff00] hover:bg-[#c2ea00] text-black font-bold text-xs uppercase cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>[EXPORTAR COPIA JSON]</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileImportInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-white hover:border-[#d4ff00] bg-[#141414] hover:bg-[#1a1a1a] text-white hover:text-[#d4ff00] font-bold text-xs uppercase cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>[RESTAURAR COPIA]</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Guía de Exportación a Android con Capacitor */}
              <div className="border border-[#262626] bg-[#0a0a0a] p-5 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#d4ff00]" />
                    <span className="text-white font-bold uppercase">[EXPORTACIÓN ANDROID / CAPACITOR (FASES 11-13)]</span>
                  </div>
                  <span className="text-[#d4ff00]">[LISTO PARA EMPAQUETAR]</span>
                </div>
                <p className="text-[#828282] text-[11px] leading-relaxed">
                  Esta Web App cuenta con su archivo <code className="text-white">capacitor.config.ts</code> preconfigurado y arquitectura desacoplada lista para Android Studio.
                </p>
                <div className="p-3 bg-[#050505] border border-[#262626] text-[11px] text-[#e5e2e1] space-y-1">
                  <div>1. Ejecutar en terminal: <span className="text-[#d4ff00]">npm run build</span></div>
                  <div>2. Inicializar Capacitor: <span className="text-[#d4ff00]">npx cap add android</span></div>
                  <div>3. Sincronizar aplicación: <span className="text-[#d4ff00]">npx cap sync</span></div>
                  <div>4. Abrir en Android Studio: <span className="text-[#d4ff00]">npx cap open android</span></div>
                  <div>5. Generar APK firmado en Build → Generate Signed Bundle / APK.</div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 3: CATEGORÍAS */}
          {activeTab === 'categorias' && (
            <div className="space-y-6">
              <div className="border border-[#262626] bg-[#0a0a0a] p-5">
                <div className="flex items-center gap-2 font-mono text-[10px] text-[#828282] uppercase tracking-widest">
                  <span className="w-2 h-2 bg-[#d4ff00]" />
                  <span>TAXONOMÍA // ÍNDICE DE CATEGORÍAS REGISTRADAS</span>
                </div>
                <h1 className="font-title font-bold text-2xl text-white uppercase mt-1">
                  CATEGORÍAS DE CATÁLOGO
                </h1>
                <p className="font-mono text-xs text-[#828282] mt-0.5">
                  // Administra las secciones comerciales de tu inventario local.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat, idx) => {
                  const count = products.filter((p) => p.category === cat.name).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setActiveTab('catalogo');
                        showToast(`FILTRANDO POR ${cat.name.toUpperCase()}`, 'info');
                      }}
                      className="p-4 border border-[#262626] bg-[#0d0d0d] hover:bg-[#141414] hover:border-[#d4ff00] cursor-pointer transition-colors group flex items-center justify-between font-mono"
                    >
                      <div>
                        <div className="text-[10px] text-[#828282] uppercase">
                          [{String(idx + 1).padStart(2, '0')}]
                        </div>
                        <h3 className="font-title text-base font-bold text-white uppercase group-hover:text-[#d4ff00] transition-colors mt-0.5">
                          {cat.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-[#1a1a1a] border border-[#262626] text-white text-xs font-bold">
                          {count} {count === 1 ? 'ÍTEM' : 'ÍTEMS'}
                        </span>
                        <div className="text-[9px] text-[#828282] mt-1 group-hover:text-white uppercase">
                          VER &gt;&gt;
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Footer Técnico Inferior */}
        <footer className="w-full bg-[#050505] border-t border-[#262626] py-3 px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[#828282] font-mono text-[10px] uppercase">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#d4ff00]" />
              <span>SELLHUB // MOTOR LOCAL OFFLINE</span>
            </div>
            <div>
              <span>REGISTRO CRIPTOGRÁFICO EN DISPOSITIVO • CERO TRÁFICO A SERVIDORES CENTRALES</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Navegación Inferior Mobile */}
      <BottomNavigation
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === 'catalogo') setOnlyFavorites(false);
          if (tab === 'favoritos') setOnlyFavorites(true);
        }}
        productCount={totalSkus}
        onOpenCreate={handleOpenCreateForm}
      />

      {/* MODAL: FORMULARIO CREAR / EDITAR PRODUCTO */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm p-3 sm:p-6 flex items-start justify-center">
            <div className="w-full max-w-4xl my-auto">
              <ProductForm
                initialProduct={editingProduct}
                initialImages={editingProductImages}
                categories={categories}
                onSave={handleSaveProduct}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingProduct(null);
                  setEditingProductImages([]);
                }}
                onAddCategory={handleAddCategory}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FICHA DE DETALLE DE PRODUCTO */}
      <AnimatePresence>
        {selectedProductForDetail && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-start justify-center">
            <ProductDetailModal
              product={selectedProductForDetail}
              images={selectedProductImages}
              onClose={() => setSelectedProductForDetail(null)}
              onEdit={handleOpenEditForm}
              onDelete={handleDeleteProduct}
              onToggleFavorite={async (id) => {
                await handleToggleFavorite(id);
              }}
              onCopyText={handleCopyText}
              onShare={handleShareProduct}
            />
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ASISTIDO DE COMPARTIR FALLBACK (FASE 7) */}
      <AnimatePresence>
        {shareFallbackProduct && (
          <ShareFallbackModal
            product={shareFallbackProduct.product}
            images={shareFallbackProduct.images}
            onClose={() => setShareFallbackProduct(null)}
            onCopyText={handleCopyText}
          />
        )}
      </AnimatePresence>

      {/* Notificaciones Toasts Brutalistas */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
