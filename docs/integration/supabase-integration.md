# Integración con Supabase

## Descripción General

Este documento describe la integración del proyecto Admintermas con Supabase, una plataforma de backend-as-a-service que proporciona una base de datos PostgreSQL en la nube con autenticación, autorización y APIs en tiempo real.

## Configuración

### Credenciales de Supabase

- **URL del Proyecto**: `https://bvzfuibqlprrfbudnauc.supabase.co`
- **Clave Anónima**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTI2MDEsImV4cCI6MjA2NjEyODYwMX0.XPfzqVORUTShEkQXCD07_Lv0YqqG2oZXsiG1Dh9BMLY`

### Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bvzfuibqlprrfbudnauc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTI2MDEsImV4cCI6MjA2NjEyODYwMX0.XPfzqVORUTShEkQXCD07_Lv0YqqG2oZXsiG1Dh9BMLY
```

## Estructura de Archivos

### Configuración Principal

- `src/lib/supabase.ts` - Cliente principal de Supabase con tipos TypeScript
- `src/lib/supabase-utils.ts` - Utilidades para operaciones CRUD

### Componentes

- `src/components/shared/SupabaseTest.tsx` - Componente para probar la conexión
- `src/app/supabase-test/page.tsx` - Página de prueba de conexión

### Scripts

- `scripts/migrate-to-supabase.js` - Script para migrar datos desde Prisma a Supabase

## Instalación

### 1. Instalar Dependencias

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Variables de Entorno

Crear el archivo `.env.local` con las credenciales de Supabase.

### 3. Probar la Conexión

Visitar `/supabase-test` en el navegador para verificar la conexión.

## Uso

### Cliente de Supabase

```typescript
import { supabase } from '@/lib/supabase'

// Ejemplo de consulta
const { data, error } = await supabase
  .from('category')
  .select('*')
```

### Utilidades CRUD

```typescript
import { categoryUtils, productUtils } from '@/lib/supabase-utils'

// Obtener todas las categorías
const categories = await categoryUtils.getAll()

// Crear una nueva categoría
const newCategory = await categoryUtils.create({
  name: 'Nueva Categoría',
  description: 'Descripción de la categoría'
})

// Actualizar categoría
await categoryUtils.update(1, { name: 'Categoría Actualizada' })

// Eliminar categoría
await categoryUtils.delete(1)
```

## Migración de Datos

### Ejecutar Migración

```bash
node scripts/migrate-to-supabase.js
```

Este script migrará los siguientes datos desde la base de datos local a Supabase:

- Categorías
- Proveedores
- Usuarios
- Almacenes
- Productos

### Tablas Migradas

1. **category** - Categorías de productos con jerarquía
2. **supplier** - Proveedores con información completa
3. **user** - Usuarios del sistema
4. **warehouse** - Almacenes y bodegas
5. **product** - Productos con relaciones

## Tipos TypeScript

El archivo `src/lib/supabase.ts` incluye tipos TypeScript completos para todas las tablas:

```typescript
export interface Database {
  public: {
    Tables: {
      category: {
        Row: {
          id: number
          name: string
          description: string | null
          parentId: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      // ... más tablas
    }
  }
}
```

## Funciones Disponibles

### Categorías (categoryUtils)

- `getAll()` - Obtener todas las categorías
- `getById(id)` - Obtener categoría por ID
- `create(category)` - Crear nueva categoría
- `update(id, updates)` - Actualizar categoría
- `delete(id)` - Eliminar categoría

### Productos (productUtils)

- `getAll()` - Obtener todos los productos con relaciones
- `getById(id)` - Obtener producto por ID
- `create(product)` - Crear nuevo producto
- `update(id, updates)` - Actualizar producto
- `delete(id)` - Eliminar producto

### Proveedores (supplierUtils)

- `getAll()` - Obtener todos los proveedores
- `getById(id)` - Obtener proveedor por ID
- `create(supplier)` - Crear nuevo proveedor
- `update(id, updates)` - Actualizar proveedor
- `delete(id)` - Eliminar proveedor

### Usuarios (userUtils)

- `getAll()` - Obtener todos los usuarios
- `getById(id)` - Obtener usuario por ID
- `create(user)` - Crear nuevo usuario
- `update(id, updates)` - Actualizar usuario
- `delete(id)` - Eliminar usuario

### Almacenes (warehouseUtils)

- `getAll()` - Obtener todos los almacenes
- `getById(id)` - Obtener almacén por ID
- `create(warehouse)` - Crear nuevo almacén
- `update(id, updates)` - Actualizar almacén
- `delete(id)` - Eliminar almacén

## Pruebas

### Componente de Prueba

El componente `SupabaseTest` proporciona:

- Verificación de conexión en tiempo real
- Estado visual de la conexión
- Botón para probar conexión manualmente
- Manejo de errores

### Página de Prueba

Visitar `/supabase-test` para:

- Ver el estado de la conexión
- Probar la conectividad
- Ver información de configuración

## Seguridad

### Row Level Security (RLS)

Supabase utiliza RLS para controlar el acceso a los datos. Las políticas deben configurarse en el dashboard de Supabase para:

- Permitir acceso anónimo a datos públicos
- Restringir acceso a datos sensibles
- Implementar autenticación de usuarios

### Claves de API

- **Clave Anónima**: Segura para usar en el navegador
- **Clave de Servicio**: Solo para operaciones del servidor

## Troubleshooting

### Problemas Comunes

1. **Error de conexión**
   - Verificar credenciales en `.env.local`
   - Comprobar conectividad a internet
   - Verificar estado del proyecto en Supabase

2. **Error de permisos**
   - Configurar RLS en Supabase
   - Verificar políticas de acceso
   - Usar clave de servicio para operaciones administrativas

3. **Error de tipos TypeScript**
   - Regenerar tipos desde Supabase
   - Verificar estructura de tablas
   - Actualizar archivo de tipos

### Logs y Debugging

```typescript
// Habilitar logs de Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    debug: true
  }
})
```

## Próximos Pasos

1. **Configurar Autenticación**: Implementar sistema de login con Supabase Auth
2. **Configurar RLS**: Establecer políticas de seguridad
3. **Migrar Completamente**: Mover todas las operaciones a Supabase
4. **Implementar Tiempo Real**: Usar suscripciones en tiempo real
5. **Optimizar Rendimiento**: Implementar caché y optimizaciones

## Referencias

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de TypeScript](https://supabase.com/docs/guides/api/typescript-support)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Cliente JavaScript](https://supabase.com/docs/reference/javascript) 