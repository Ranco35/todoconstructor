# Guía de Build y Despliegue

## Resumen

Esta guía proporciona los pasos necesarios para realizar builds exitosos y despliegues sin errores en el proyecto Admintermas.

## Proceso de Build

### 1. Preparación

```bash
# Instalar dependencias
npm install

# Generar cliente de Prisma
npx prisma generate

# Verificar variables de entorno
cp .env.example .env
# Configurar variables necesarias en .env
```

### 2. Verificaciones Previas

```bash
# Verificar tipos de TypeScript
npm run type-check

# Verificar ESLint
npm run lint

# Verificar que no hay errores de compilación
npm run build --dry-run
```

### 3. Build Local

```bash
# Build completo
npm run build

# Verificar que el build fue exitoso
# Debe mostrar: ✓ Compiled successfully
# Debe mostrar: ✓ Linting and checking validity of types
```

## Errores Comunes y Soluciones

### 1. Errores de TypeScript

#### Imports No Utilizados
```bash
# Error: 'NextRequest' is defined but never used
# Solución: Eliminar import no utilizado
import { NextResponse } from 'next/server'; // ✅
import { NextRequest, NextResponse } from 'next/server'; // ❌
```

#### Props No Válidos
```bash
# Error: Property 'totalCount' does not exist on type
# Solución: Eliminar prop no definido en la interfaz
<ProductTable products={products} /> // ✅
<ProductTable products={products} totalCount={count} /> // ❌
```

#### Tipos Incompatibles
```bash
# Error: Type 'number' is not assignable to type 'string'
# Solución: Convertir tipos
id={productId.toString()} // ✅
id={productId} // ❌
```

### 2. Errores de ESLint

#### Variables No Utilizadas
```bash
# Error: 'expenses' is defined but never used
# Solución: Usar console.log temporal o comentarios
console.log('Props disponibles:', { expenses, purchases }); // ✅
const expenses = []; // ❌ sin usar
```

#### Orden de Declaración
```bash
# Error: Block-scoped variable 'loadData' used before its declaration
# Solución: Mover declaración antes del uso
const loadData = useCallback(() => {}, []); // ✅
useEffect(() => { loadData(); }, [loadData]); // ✅

useEffect(() => { loadData(); }, [loadData]); // ❌
const loadData = useCallback(() => {}, []); // ❌
```

## Despliegue en Vercel

### 1. Configuración

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### 2. Variables de Entorno

Configurar en Vercel Dashboard:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- Otras variables específicas del proyecto

### 3. Comandos de Despliegue

```bash
# Despliegue automático (conectado a GitHub)
# Se ejecuta automáticamente en push a main

# Despliegue manual
vercel --prod

# Verificar estado del despliegue
vercel ls
```

## Warnings Esperados

### Dynamic Server Usage
```
Error: Dynamic server usage: Route /dashboard/suppliers/create couldn't be rendered statically because it used `cookies`.
```

**Explicación**: Normal para páginas con autenticación. No afecta la funcionalidad.

**Solución**: No requiere acción. Es comportamiento esperado.

### Prisma Tips
```
Tip: Interested in query caching in just a few lines of code? Try Accelerate today!
```

**Explicación**: Sugerencias de Prisma para optimización.

**Solución**: Opcional. No afecta la funcionalidad.

## Checklist de Despliegue

### Antes del Build
- [ ] Todas las dependencias están instaladas
- [ ] Variables de entorno configuradas
- [ ] Prisma client generado
- [ ] No hay errores de TypeScript
- [ ] No hay errores de ESLint

### Durante el Build
- [ ] Compilación exitosa
- [ ] Linting exitoso
- [ ] Generación de páginas estáticas
- [ ] Optimización completada

### Después del Build
- [ ] Verificar rutas generadas
- [ ] Verificar tamaño del bundle
- [ ] Probar funcionalidad crítica
- [ ] Verificar variables de entorno en producción

## Monitoreo Post-Despliegue

### 1. Logs de Vercel
```bash
# Ver logs en tiempo real
vercel logs

# Ver logs de una función específica
vercel logs --function=api/route
```

### 2. Métricas de Rendimiento
- First Load JS
- Bundle size
- Page load times
- Error rates

### 3. Alertas
- Configurar alertas para errores 500
- Monitorear tiempo de respuesta
- Verificar disponibilidad de la base de datos

## Troubleshooting

### Build Falla
1. Verificar errores de TypeScript: `npm run type-check`
2. Verificar errores de ESLint: `npm run lint`
3. Verificar dependencias: `npm install`
4. Limpiar cache: `rm -rf .next && npm run build`

### Despliegue Falla
1. Verificar variables de entorno en Vercel
2. Verificar logs de build en Vercel Dashboard
3. Verificar conectividad con la base de datos
4. Verificar permisos de archivos

### Errores en Producción
1. Verificar logs de Vercel
2. Verificar variables de entorno
3. Verificar conectividad de servicios externos
4. Verificar configuración de Prisma

## Comandos de Mantenimiento

```bash
# Limpiar cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Regenerar Prisma
npx prisma generate
npx prisma db push

# Verificar estado general
npm run type-check
npm run lint
npm run build
```

## Notas Importantes

- Siempre hacer build local antes de push
- Verificar que el build pasa en CI/CD
- Mantener variables de entorno actualizadas
- Documentar cambios en la configuración
- Monitorear métricas de rendimiento post-despliegue 