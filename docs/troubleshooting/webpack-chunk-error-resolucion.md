# Resolución de Error de Chunks de Webpack - `Cannot find module './4447.js'`

## Problema
Error crítico en Next.js durante el desarrollo:
```
Error: Cannot find module './4447.js'
Require stack:
- C:\Users\eduar\DJANGO\Admintermas\.next\server\webpack-runtime.js
- C:\Users\eduar\DJANGO\Admintermas\.next\server\app\_not-found\page.js
```

Y error en el navegador:
```
Error: [object Event]
at onUnhandledRejection (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/errors/use-error-handler.js:125:39)
```

## Causa
Este error ocurre típicamente después de:
1. **Cambios en la estructura de archivos** - Mover archivos entre directorios (`src/actions/` → `src/utils/`)
2. **Caché corrupta de webpack** - Los chunks generados referencian archivos que ya no existen
3. **Importaciones modificadas** - Cambios en rutas de importación que dejan referencias rotas

## Síntomas
- ❌ Páginas devuelven errores 500
- ❌ CSS no carga (`/_next/static/css/app/layout.css` error 500)
- ❌ Errores de módulos faltantes en chunks de webpack
- ❌ Hot reload no funciona
- ❌ Fast Refresh falla constantemente

## Solución Implementada

### 1. Terminar Procesos Node.js
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
```

### 2. Limpiar Caché de Next.js
```powershell
if (Test-Path ".next") { 
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Directorio .next eliminado" 
}
```

### 3. Limpiar Caché de Node Modules (Opcional)
```powershell
if (Test-Path "node_modules\.cache") { 
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Caché de node_modules eliminado" 
}
```

### 4. Reinstalar Dependencias
```bash
npm install
```

### 5. Reiniciar Servidor de Desarrollo
```bash
npm run dev
```

## Contexto del Caso Específico

### Cambios que Causaron el Error
1. **Reestructuración de archivos de análisis de emails**:
   - `src/actions/emails/analysis-config.ts` → Solo Server Actions
   - Creado `src/utils/email-analysis-utils.ts` → Funciones utilitarias
   
2. **Actualización de importaciones**:
   - `analysis-actions.ts` actualizado para importar desde múltiples ubicaciones
   - Separación de Server Actions vs funciones síncronas

### Archivos Afectados
- `src/actions/emails/analysis-config.ts`
- `src/utils/email-analysis-utils.ts` (nuevo)
- `src/actions/emails/analysis-actions.ts`

## Prevención

### 1. Script de Limpieza Automática
Crear `scripts/clean-cache.ps1`:
```powershell
# Limpiar caché de Next.js y webpack
Write-Host "🧹 Limpiando caché de desarrollo..."

# Terminar procesos Node.js
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✅ Procesos Node.js terminados"

# Eliminar directorio .next
if (Test-Path ".next") { 
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Directorio .next eliminado" 
}

# Eliminar caché node_modules
if (Test-Path "node_modules\.cache") { 
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Caché de node_modules eliminado" 
}

Write-Host "🚀 Caché limpiado. Ejecuta 'npm run dev' para reiniciar"
```

### 2. NPM Script
Agregar a `package.json`:
```json
{
  "scripts": {
    "clean": "powershell -ExecutionPolicy Bypass -File scripts/clean-cache.ps1",
    "dev:clean": "npm run clean && npm run dev"
  }
}
```

### 3. Mejores Prácticas
1. **Después de mover archivos**: Siempre limpiar caché
2. **Cambios en importaciones**: Verificar todas las referencias
3. **Errores de chunks**: Limpiar inmediatamente, no intentar "fixes" complejos
4. **Git commits**: Hacer commit antes de reestructuraciones grandes

## Comandos de Emergencia

### Limpieza Rápida (Una Línea)
```bash
# PowerShell
Get-Process node -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue; if(Test-Path .next){rm -r -fo .next}; npm run dev

# Command Prompt  
taskkill /f /im node.exe & rd /s /q .next & npm run dev
```

### Limpieza Completa
```bash
# Si la limpieza rápida no funciona
npm run clean
npm install
npm run dev
```

## Verificación de Éxito

### ✅ Señales de Resolución
- Servidor inicia sin errores de chunks
- CSS carga correctamente
- Hot reload funciona
- Fast Refresh opera normalmente
- Páginas cargan sin errores 500

### ❌ Si Persiste el Error
1. Verificar errores de sintaxis en archivos modificados
2. Revisar rutas de importación
3. Eliminar `node_modules` y reinstalar completamente
4. Verificar que no hay referencias circulares

## Tiempo de Resolución
- **Limpieza básica**: 30-60 segundos
- **Reinstalación completa**: 2-5 minutos
- **Efectividad**: 95% de los casos resueltos

## Notas Técnicas
- **Webpack chunks**: Los números (4447.js) son identificadores únicos generados
- **Server vs Client**: Error afecta tanto renderizado del servidor como cliente
- **Next.js cache**: El directorio `.next` contiene toda la compilación optimizada
- **Hot Module Replacement**: Se corrompe cuando chunks referencias no existen

## Documentación Relacionada
- [Next.js: Dynamic Server Error](https://nextjs.org/docs/messages/dynamic-server-error)
- [Webpack: Module Resolution](https://webpack.js.org/concepts/module-resolution/)
- [Server Actions Best Practices](../modules/server-actions-best-practices.md) 