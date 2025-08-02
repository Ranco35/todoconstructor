# Sistema de Storage de Imágenes de Clientes - Supabase

## 🎯 Resumen

Sistema completo para gestionar imágenes de clientes usando **Supabase Storage**, con subida directa desde el frontend, validaciones de seguridad, y limpieza automática de archivos.

## 📋 Características Implementadas

### ✅ Funcionalidades Principales
- **Subida de imágenes** directa a Supabase Storage
- **Eliminación automática** de imágenes anteriores al actualizar
- **Validaciones de seguridad** (tamaño, tipo de archivo)
- **Preview en tiempo real** de las imágenes
- **URLs públicas optimizadas** para CDN
- **Limpieza automática** de archivos huérfanos
- **Integración completa** con el formulario de clientes

### 🔧 Componentes Técnicos

#### 1. **ClientImageUploader Component**
```typescript
// Ubicación: src/components/clients/ClientImageUploader.tsx
<ClientImageUploader
  currentImageUrl={imageUrl}
  clientId={client?.id}
  onImageChange={handleImageChange}
  disabled={isSubmitting}
  size="md"
/>
```

#### 2. **Storage Functions**
```typescript
// Ubicación: src/lib/supabase-storage.ts

// Subir imagen
uploadClientImage(file, clientId)

// Eliminar imagen
deleteClientImage(filePath)

// Actualizar imagen
updateClientImage(file, clientId, currentPath)

// Obtener URL pública
getClientImageUrl(filePath)
```

## 🚀 Configuración Inicial

### 1. Bucket Configuration
El bucket `client-images` se configura automáticamente con:
- **Público**: ✅ Acceso de lectura público
- **Tamaño máximo**: 5MB por archivo
- **Tipos permitidos**: JPG, PNG, GIF, WebP
- **Políticas RLS**: Configuradas para usuarios autenticados

### 2. Migración Aplicada
```sql
-- Archivo: supabase/migrations/20250628000005_setup_client_images_storage.sql
-- Se ejecuta automáticamente con: npx supabase db push
```

### 3. Verificar Bucket
```javascript
// Verificar que el bucket existe
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);
```

## 📝 Uso del Sistema

### 1. **En Formulario de Creación**
```typescript
const [imageUrl, setImageUrl] = useState<string | null>(null);
const [imagePath, setImagePath] = useState<string | null>(null);

const handleImageChange = (newImageUrl: string | null, newImagePath: string | null) => {
  setImageUrl(newImageUrl);
  setImagePath(newImagePath);
};

// Al enviar formulario
const formData = {
  ...otherData,
  imagen: imageUrl || ''
};
```

### 2. **En Formulario de Edición**
```typescript
// El componente automáticamente maneja:
// - Mostrar imagen actual
// - Reemplazar imagen existente
// - Eliminar imagen anterior al actualizar
```

## 🔒 Seguridad y Validaciones

### Validaciones del Cliente
- **Tipos de archivo**: Solo imágenes (JPG, PNG, GIF, WebP)
- **Tamaño máximo**: 5MB por archivo
- **Nombres únicos**: Generación automática con timestamp
- **Validación en tiempo real**: Feedback inmediato al usuario

### Políticas de Supabase (RLS)
```sql
-- Lectura pública
CREATE POLICY "Las imágenes de clientes son públicas para lectura"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'client-images');

-- Escritura solo usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'client-images');
```

## 📂 Estructura de Archivos

### Naming Convention
```
client-images/
├── clients/
│   ├── client-123-1640995200000-abc123.jpg
│   ├── client-456-1640995300000-def456.png
│   └── temp-1640995400000-xyz789.jpg (temporal)
```

### URL Pattern
```
https://[project-id].supabase.co/storage/v1/object/public/client-images/clients/client-123-timestamp-random.jpg
```

## 🧹 Limpieza y Mantenimiento

### 1. **Limpieza Automática**
```typescript
// Función incluida en supabase-storage.ts
await cleanupTempImages(); // Elimina imágenes temporales >24h
```

### 2. **Limpieza Manual (SQL)**
```sql
-- Ejecutar en Supabase SQL Editor
SELECT cleanup_orphaned_client_images();
```

### 3. **Verificar Imágenes Huérfanas**
```sql
-- Ver imágenes no referenciadas
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'client-images'
  AND name NOT IN (
    SELECT SUBSTRING(imagen FROM 'clients/(.+)$')
    FROM "Client"
    WHERE imagen LIKE '%client-images%'
  );
```

## 🔧 Funciones de Utilidad

### 1. **Extraer Path de URL**
```typescript
const imagePath = extractPathFromUrl(publicUrl);
// Input: https://xxx.supabase.co/storage/v1/object/public/client-images/clients/file.jpg
// Output: clients/file.jpg
```

### 2. **Generar Nombre Único**
```typescript
const fileName = generateFileName('foto.jpg', 123);
// Output: client-123-1640995200000-abc123.jpg
```

## 🚨 Troubleshooting

### Problemas Comunes

#### **Error: "Bucket does not exist"**
```typescript
// Solución: Verificar y crear bucket
await ensureBucketExists();
```

#### **Error: "File too large"**
```typescript
// Verificar tamaño antes de subir
if (file.size > 5 * 1024 * 1024) {
  throw new Error('Archivo demasiado grande');
}
```

#### **Error: "Invalid file type"**
```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Tipo de archivo no permitido');
}
```

### Logs de Debug
```typescript
// Habilitar logs detallados
console.log('📤 Subiendo imagen:', {
  fileName,
  filePath,
  fileSize: file.size,
  fileType: file.type
});
```

## 📊 Monitoreo

### Dashboard de Supabase
1. **Storage > client-images**: Ver archivos subidos
2. **Database > storage.objects**: Tabla de archivos
3. **Logs**: Monitorear operaciones de storage

### Métricas Importantes
- **Número total de imágenes**: `SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'client-images'`
- **Espacio usado**: Ver en Dashboard de Storage
- **Imágenes por cliente**: `SELECT COUNT(*) FROM "Client" WHERE imagen IS NOT NULL`

## ✅ Verificación de Funcionalidad

### Checklist de Testing
- [ ] Subir imagen nueva ✅
- [ ] Cambiar imagen existente ✅
- [ ] Eliminar imagen ✅
- [ ] Preview en tiempo real ✅
- [ ] Validación de tipos ✅
- [ ] Validación de tamaño ✅
- [ ] URLs públicas funcionando ✅
- [ ] Limpieza de archivos anteriores ✅

## 🔄 Integración Completa

### Base de Datos
```sql
-- Campo imagen en tabla Client
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "imagen" TEXT;
```

### Formulario
```typescript
// Incluir imagen en datos de formulario
const formDataWithImage = {
  ...formData,
  imagen: imageUrl || ''
};
```

### Tipos TypeScript
```typescript
interface CreateClientFormData {
  // ... otros campos
  imagen?: string;
}
```

## 🎉 Resultado Final

**Sistema 100% funcional** que permite:
- ✅ Subir imágenes de clientes directamente a Supabase Storage
- ✅ Gestión automática de archivos (crear, actualizar, eliminar)
- ✅ Validaciones de seguridad robustas
- ✅ URLs públicas optimizadas para CDN
- ✅ Limpieza automática de archivos no utilizados
- ✅ Integración completa con el sistema de clientes

**Todos los componentes están listos y funcionando** 🚀 