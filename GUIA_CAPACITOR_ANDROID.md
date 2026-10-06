# GUÍA OFICIAL DE EXPORTACIÓN: SELLHUB A ANDROID CON CAPACITOR
### Fases 11, 12 y 13 — De Web App Local a APK / AAB para Google Play y Distribución Directa

Este documento describe el procedimiento paso a paso para tomar la aplicación web **SellHub** desarrollada en Google AI Studio y compilarla como una aplicación Android nativa mediante **Capacitor**.

---

## 1. Arquitectura y Compatibilidad (Fase 11)

SellHub fue concebida desde el primer momento con arquitectura **Local-First**, utilizando IndexedDB en el navegador para datos e imágenes y abstracciones de servicios (`ShareService`, `ImageService`, `BackupService`). 

Al ejecutarse dentro de Capacitor en Android:
* La aplicación corre sobre el WebView moderno del sistema con persistencia local permanente en sandbox privado.
* El archivo de configuración `capacitor.config.ts` ya está creado en la raíz del proyecto con el ID de aplicación `com.sellhub.app`.

---

## 2. Preparación del Entorno Local

Asegúrate de contar con:
1. **Node.js**: v18 o superior.
2. **Android Studio**: Versión Hedgehog o superior con Android SDK Platform 34+.
3. **Java JDK**: JDK 17 o 21 configurado en tus variables de entorno (`JAVA_HOME`).

---

## 3. Comandos de Inicialización y Empaquetado

Ejecuta los siguientes comandos en tu terminal dentro de la carpeta del proyecto exportado:

```bash
# 1. Instalar dependencias base
npm install

# 2. Instalar el CLI y núcleo de Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Compilar la aplicación web estática para producción (carpeta dist/)
npm run build

# 4. Agregar la plataforma Android al proyecto
npx cap add android

# 5. Sincronizar el código compilado y plugins con la carpeta nativa android/
npx cap sync
```

---

## 4. Configuración de Permisos en Android (`AndroidManifest.xml`)

Abre el archivo `android/app/src/main/AndroidManifest.xml` y verifica que los permisos necesarios estén declarados antes de `<application>`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permisos para compartir y almacenar archivos locales si se requiere -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="SellHub"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        ...
    </application>
</manifest>
```

---

## 5. Pruebas de Validación del Módulo Compartir (Fase 12)

Abre el proyecto en Android Studio con:

```bash
npx cap open android
```

Conecta tu dispositivo Android mediante USB con la depuración USB activa, o inicia un emulador Android con Google Play. Pulsa **Run 'app'** (`Shift + F10`).

### Casos de prueba a validar:

* **Caso 1: Producto con 1 fotografía + copy comercial**
  - Entra al producto en la app en tu teléfono Android.
  - Pulsa **`[COMPARTIR PRODUCTO]`**.
  - En el Sharesheet nativo de Android, selecciona **WhatsApp**.
  - **Resultado:** WhatsApp se abre con la fotografía seleccionada y el copy comercial colocado automáticamente en el pie de foto.
* **Caso 2: Producto con múltiples fotografías + copy comercial**
  - Entra a un producto con 3 o 4 fotos.
  - Pulsa **`[COMPARTIR PRODUCTO]`**.
  - Elige WhatsApp o Telegram.
  - **Resultado:** Se adjunta el lote de 4 fotos con el copy comercial en la primera imagen.
* **Caso 3: Producto sin fotografías**
  - Pulsa **`[COMPARTIR PRODUCTO]`** en un ítem sin imágenes.
  - **Resultado:** Se comparte directamente el texto formateado al chat o red seleccionada.
* **Caso 4: Publicación en Facebook Marketplace**
  - Pulsa **`[MARKETPLACE]`** en la ficha del producto.
  - **Resultado:** El copy comercial se copia inmediatamente al portapapeles y se abre Facebook Marketplace para pegar el texto y subir las fotos.
* **Caso 5: Compartir con dispositivo desconectado de Internet (Modo Avión)**
  - Activa el Modo Avión en el teléfono.
  - Entra a SellHub, busca productos, edita, agrega fotos y prueba la navegación.
  - **Resultado:** La aplicación funciona al 100% de forma local sin errores de red.

---

## 6. Generación de APK y AAB para Producción (Fase 13)

### Para generar APK de instalación directa (para compartir por WhatsApp o descargar):

1. En Android Studio, ve al menú: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
2. Una vez completado, Android Studio mostrará la notificación *"APK(s) generated successfully"*.
3. Haz clic en **Locate** para encontrar tu archivo `app-debug.apk` o `app-release.apk`.
4. Este APK lo puedes instalar directamente en cualquier teléfono Android activando "Instalar apps de fuentes desconocidas".

### Para generar AAB firmado para subir a Google Play Store:

1. En Android Studio, ve al menú: **Build** → **Generate Signed Bundle / APK...**
2. Selecciona **Android App Bundle** y pulsa **Next**.
3. Elige tu archivo de clave (.jks o .keystore) existente o haz clic en **Create new...** si es la primera vez.
4. Selecciona la variante **release**.
5. Haz clic en **Finish**.
6. El archivo resultante `.aab` ubicado en `android/app/release/app-release.aab` es el paquete final listo para subir a la consola de Google Play Console.
