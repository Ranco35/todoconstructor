# Configuración de Variables de Entorno para Website

## Problema Identificado

El error `Error fetching products by category: {}` se debe a que las variables de entorno de Supabase no están configuradas correctamente.

## Variables Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Cómo Obtener las Variables

### 1. NEXT_PUBLIC_SUPABASE_URL
- Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
- En la sección "Settings" → "API"
- Copia la "Project URL"

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- En la misma sección "Settings" → "API"
- Copia la "anon public" key

### 3. SUPABASE_SERVICE_ROLE_KEY
- En la misma sección "Settings" → "API"
- Copia la "service_role" key (manténla segura)

## Ejemplo de Configuración

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjQ2NDQwMCwiZXhwIjoxOTYyMDQwNDAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ2NDY0NDAwLCJleHAiOjE5NjIwNDA0MDB9.example
```

## Verificación

Después de configurar las variables, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## Errores Corregidos

### 1. Sintaxis de Relaciones Supabase
- **Antes**: `Category:categoryid (id, name)`
- **Después**: `Category (id, name)`

### 2. Filtros Duplicados
- **Antes**: Filtros contradictorios en `getProductsWithStock`
- **Después**: Solo filtro para stock > 0

### 3. Relaciones de Warehouse
- **Antes**: `Warehouse:warehouseId (id, name)`
- **Después**: `Warehouse (id, name)`

## Estado Actual

✅ **Errores de sintaxis corregidos**
✅ **Filtros optimizados**
✅ **Relaciones de base de datos corregidas**
⏳ **Pendiente**: Configurar variables de entorno

## Próximos Pasos

1. Configurar las variables de entorno
2. Reiniciar el servidor
3. Verificar que el website funcione correctamente
