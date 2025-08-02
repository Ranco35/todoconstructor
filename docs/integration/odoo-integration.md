# 🔗 Integración con Odoo - Sincronización de Productos

## Descripción General

Esta integración permite conectar tu sistema AdminTermas con Odoo para sincronizar productos de manera automática, incluyendo imágenes, precios, stock y categorías.

## 🚀 Funcionalidades Implementadas

### ✅ Conexión con API de Odoo
- Verificación automática de conectividad
- Manejo de errores de conexión
- Configuración flexible de endpoints

### ✅ Sincronización de Productos
- **Datos del producto**: Nombre, SKU, código de barras, descripción
- **Precios**: Precio de venta y costo
- **Stock**: Cantidad disponible por bodega
- **Categorías**: Mapeo automático de categorías de Odoo
- **Imágenes**: Descarga automática de imágenes de productos
- **Tipos**: Mapeo de tipos (Almacenable, Consumible, Servicio)

### ✅ Interfaz de Usuario
- Dashboard completo de integración
- Visualización de productos en tiempo real
- Filtros y búsqueda avanzada
- Estadísticas de sincronización

## 📁 Estructura de Archivos

```
src/
├── types/odoo.ts                              # Tipos TypeScript para Odoo
├── actions/configuration/odoo-sync.ts          # Lógica de sincronización
├── app/
│   ├── api/odoo/sync/route.ts                 # API endpoint para sincronización
│   ├── productos/page.tsx                     # Página simple de productos
│   └── dashboard/configuration/products/odoo/ # Dashboard completo
│       ├── page.tsx                           # Página principal
│       └── OdooProductsClient.tsx             # Componente cliente
```

## 🛠 Configuración

### 1. URL de Odoo
La URL base está configurada en `src/types/odoo.ts`:

```typescript
export const DEFAULT_ODOO_CONFIG: Partial<OdooSyncConfig> = {
  baseUrl: 'https://ranco35-hotelspatermasllifen4-staging-productos-api-21685451.dev.odoo.com'
};
```

### 2. Mapeo de Tipos de Productos

```typescript
export const ODOO_PRODUCT_TYPE_MAPPING = {
  'product': 'ALMACENABLE',   // Productos con stock
  'consu': 'CONSUMIBLE',      // Consumibles
  'service': 'SERVICIO'       // Servicios
} as const;
```

## 🚀 Uso de la Integración

### 1. Dashboard Completo de Integración

**Ruta**: `/dashboard/configuration/products/odoo`

**Funcionalidades**:
- ✅ Verificación de conexión con Odoo
- ✅ Estadísticas de productos disponibles
- ✅ Vista previa de productos antes de importar
- ✅ Sincronización con/sin imágenes
- ✅ Filtros por tipo, stock, e imágenes
- ✅ Resultados detallados de sincronización

### 2. Página Simple de Productos

**Ruta**: `/productos`

**Funcionalidades**:
- ✅ Vista directa de productos desde Odoo
- ✅ Actualización en tiempo real
- ✅ Estadísticas básicas
- ✅ Información completa de productos

### 3. API Endpoints

#### Verificar Conexión
```bash
GET /api/odoo/sync
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Conexión exitosa con Odoo",
  "productCount": 156
}
```

#### Sincronizar Productos
```bash
POST /api/odoo/sync
Content-Type: application/json

{
  "includeImages": true,
  "force": false
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Sincronización exitosa: 12 productos creados, 8 actualizados, 15 imágenes descargadas",
  "stats": {
    "productsTotal": 20,
    "productsCreated": 12,
    "productsUpdated": 8,
    "productsErrors": 0,
    "imagesDownloaded": 15,
    "categoriesCreated": 3,
    "suppliersCreated": 0
  }
}
```

## 🔄 Proceso de Sincronización

### 1. Verificación de Conexión
- Se verifica que Odoo esté disponible
- Se obtiene el conteo de productos disponibles

### 2. Obtención de Productos
- Se consultan todos los productos activos desde Odoo
- Se incluyen campos: nombre, SKU, precios, stock, categorías, imágenes

### 3. Mapeo de Datos
- **Tipos**: Se mapean los tipos de Odoo a tipos locales
- **Categorías**: Se buscan/crean categorías por nombre
- **Bodegas**: Se asignan a la bodega "Principal" por defecto

### 4. Descarga de Imágenes (Opcional)
- Se descargan imágenes desde URLs de Odoo
- Se convierten a base64 para almacenamiento local
- Manejo de errores en caso de imágenes no disponibles

### 5. Importación al Sistema Local
- Se utiliza el sistema de importación existente
- Se crean/actualizan productos según SKU o ID
- Se asignan productos a bodegas con stock inicial

## 📊 Monitoreo y Logs

### Logs de Sincronización
```
🔄 Conectando con Odoo para obtener productos...
✅ Obtenidos 156 productos desde Odoo
📦 Procesando 156 productos de Odoo...
📥 Descargando imagen para: Producto A
🔄 Importando 156 productos al sistema local...
✅ Sincronización completada: { productsCreated: 12, productsUpdated: 8, imagesDownloaded: 15 }
```

### Estadísticas Disponibles
- Total de productos en Odoo
- Productos con stock disponible
- Productos con imágenes
- Valor total del inventario
- Distribución por tipos de productos

## ⚙️ Configuración Avanzada

### Personalizar Mapeo de Bodegas
En `src/actions/configuration/odoo-sync.ts`, modifica la función `mapOdooProductToImportData`:

```typescript
warehouseName: 'Principal', // Cambiar por tu bodega deseada
warehouses: [{
  warehouseName: 'Principal',
  quantity: odooProduct.qty_available || 0,
  minStock: 5,    // Personalizar stock mínimo
  maxStock: 100   // Personalizar stock máximo
}]
```

### Configurar Intervalos de Sincronización
```typescript
export const DEFAULT_ODOO_CONFIG: Partial<OdooSyncConfig> = {
  autoSync: true,        // Habilitar sincronización automática
  syncInterval: 60,      // Intervalo en minutos
  baseUrl: 'tu-odoo-url'
};
```

## 🔧 Solución de Problemas

### Error de Conexión
- Verificar que la URL de Odoo sea correcta
- Comprobar que el endpoint `/api/productos` esté disponible
- Revisar configuración de CORS en Odoo

### Productos No Se Importan
- Verificar que los productos en Odoo estén activos
- Comprobar que tengan nombres válidos
- Revisar logs de errores en consola

### Imágenes No Se Descargan
- Verificar que las URLs de imágenes sean públicas
- Comprobar que las imágenes no excedan el tamaño máximo
- Sincronizar sin imágenes como alternativa

## 📈 Próximos Pasos

- [ ] Sincronización automática programada
- [ ] Mapping bidireccional (Odoo ← → AdminTermas)
- [ ] Sincronización de categorías y proveedores
- [ ] Webhooks para actualizaciones en tiempo real
- [ ] Configuración de múltiples instancias de Odoo

## 🚀 Resultado Esperado

Con esta integración, cuando visites:
- `/productos` - Verás una grilla con los productos en tiempo real desde Odoo
- `/dashboard/configuration/products/odoo` - Tendrás control completo de la sincronización

¡La integración está lista para usar! 🎉 