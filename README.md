# SellHub — Catálogo Comercial Local-First y Despacho Rápido

> **SellHub** es una aplicación web y móvil responsive de alto rendimiento, diseñada bajo la arquitectura **Local-First (100% Offline)**. Permite a vendedores independientes, comercios y distribuidores organizar su catálogo de productos, gestionar galerías de fotografías locales y **compartir con un solo toque las fotografías y el copy comercial** directamente hacia WhatsApp, Facebook Marketplace, Telegram y redes sociales sin depender de internet ni de servidores externos.

---

## ⚡ Características Principales

* **🔒 100% Local y Privada (Air-Gapped por diseño):** Cero servidores remotos, cero servicios cloud, cero telemetría. Tus productos, precios, márgenes de ganancia y fotografías se almacenan físicamente en el dispositivo mediante **IndexedDB**.
* **🚀 Despacho Rápido (Compartir Fotos + Copy):** Orquesta la Web Share API Nivel 2 y la Sharesheet nativa de Android para enviar simultáneamente el lote de fotografías de un producto junto con su copy comercial a WhatsApp o redes sociales.
* **🛡️ Asistente de Fallback Inteligente:** Si un navegador no permite enviar archivos y texto en la misma llamada nativa, SellHub copia el texto automáticamente al portapapeles y prepara las fotos sin pérdida de datos.
* **🖼️ Optimización Automática de Fotografías:** Motor en cliente con `HTMLCanvasElement` que comprime y redimensiona fotos pesadas de móviles (de 8–15 MB a ~300–500 KB) garantizando máxima nitidez, ordenación manual (`←` / `→`) y selección de foto de portada.
* **🔍 Búsqueda y Filtros en Tiempo Real:** Filtra al instante por nombre, SKU, categoría, disponibilidad comercial (`Disponible`, `Reservado`, `Vendido`, `Oculto`) y destacados (`Favoritos`).
* **📦 Copia de Seguridad Local (Exportar / Importar):** Respaldo completo en un archivo `.json` que incluye productos, categorías y todas las fotografías binarias codificadas para migrar de dispositivo sin conexión a la red.
* **📱 PWA & Preparada para Capacitor:** Funciona como Progressive Web App instalable en el escritorio/móvil y está arquitecturada para compilarse como **APK / AAB nativo para Android** mediante Capacitor.
* **🖤 Diseño Técnico Monolith Brutalist:** Estética de alto contraste inspirada en consolas industriales y diseño suizo (`#050505`, `#d4ff00`, `Space Grotesk` y `JetBrains Mono`), con transiciones fluidas mediante Framer Motion.
* **🇪🇸 100% en Español:** Toda la interfaz de usuario, validaciones, mensajes y errores están redactados en español claro.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 19 + TypeScript.
* **Estilos:** Tailwind CSS + Enfoque Mobile-First.
* **Animaciones:** Motion / Framer Motion.
* **Persistencia:** IndexedDB nativo tipado (`SellHubDB`).
* **Iconografía:** Lucide React.
* **PWA:** Web App Manifest + Service Worker nativo (Cache-First).
* **Empaquetado Nativo:** Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).

---

## 📂 Estructura del Proyecto

```text
sellhub/
├── public/
│   ├── manifest.json            # Manifiesto de instalación PWA
│   └── sw.js                    # Service Worker para modo offline
├── src/
│   ├── components/
│   │   ├── common/              # Insignias de estado, Toast brutalista
│   │   └── layout/              # Header, Sidebar desktop, BottomNavigation móvil
│   ├── features/
│   │   ├── catalog/             # Cuadrícula, KPIs, filtros y tarjetas de producto
│   │   ├── product-form/        # Formulario crear/editar con reordenamiento de fotos
│   │   ├── product-detail/      # Ficha técnica, visor HD a pantalla completa
│   │   └── sharing/             # Modal asistido de fallback para compartir
│   ├── repositories/            # Acceso atómico a productos e imágenes en IndexedDB
│   ├── services/
│   │   ├── imageService.ts      # Compresión y redimensionado Canvas en cliente
│   │   ├── shareService.ts      # Orquestación de Web Share API L2 y fallback
│   │   └── backupService.ts     # Serialización y restauración de copias JSON
│   ├── storage/                 # Inicialización y esquemas de IndexedDB
│   ├── types/                   # Modelos de datos TypeScript
│   ├── utils/                   # Formateadores de moneda y fechas
│   ├── App.tsx                  # Orquestador principal de vistas
│   ├── index.css                # Reglas y variables de diseño brutalista
│   └── main.tsx                 # Entrada React
├── capacitor.config.ts          # Configuración oficial para empaquetado Android
├── GUIA_CAPACITOR_ANDROID.md    # Manual paso a paso para generar APK / AAB
└── package.json
```

---

## 🚀 Inicio Rápido (Desarrollo Web)

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/TU_USUARIO/sellhub.git
cd sellhub
npm install
```

### 2. Iniciar el servidor de desarrollo local
```bash
npm run dev
```
Abre en tu navegador: `http://localhost:3000`

### 3. Compilar para producción
```bash
npm run build
```

---

## 📱 Empaquetar para Android (APK / AAB)

SellHub ya cuenta con `capacitor.config.ts` preconfigurado. Para generar tu aplicación Android:

```bash
# 1. Compilar los archivos web
npm run build

# 2. Instalar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Inicializar la plataforma nativa
npx cap add android

# 4. Sincronizar archivos y abrir en Android Studio
npx cap sync
npx cap open android
```

Desde Android Studio:
* **Generar APK para instalación directa:** `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`.
* **Generar AAB para Google Play Store:** `Build` → `Generate Signed Bundle / APK...`.

Consulta el archivo [`GUIA_CAPACITOR_ANDROID.md`](./GUIA_CAPACITOR_ANDROID.md) para más detalles sobre permisos y validación de casos en WhatsApp.

---

## 🔒 Privacidad de Datos

SellHub **no recopila datos personales, no utiliza cookies de rastreo ni envía información a servidores externos**. Todo el catálogo, las notas de precios y las fotografías residen exclusivamente en el almacenamiento local del dispositivo del usuario.

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
