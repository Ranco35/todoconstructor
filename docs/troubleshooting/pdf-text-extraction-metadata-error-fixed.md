# Error de Extracción de Texto PDF - Metadata en lugar de Contenido Real

## Problema Resuelto

**Error Original**: `Error: El PDF no contiene texto legible o está corrupto. ChatGPT no puede procesar el contenido.`

**Error Secundario**: `ReferenceError: DOMMatrix is not defined`

## Descripción del Problema

### Problema Principal
El sistema de procesamiento de facturas PDF estaba extrayendo metadata y estructura interna del PDF (`%PDF-1.4 % 1 0 obj<</Producer(htmldoc...`) en lugar del contenido real de texto de la factura.

### Problema Secundario (DOMMatrix)
Después de implementar PDF.js, apareció un nuevo error donde PDF.js intentaba ejecutarse en el servidor (Next.js SSR) pero requería APIs del DOM como `DOMMatrix` que solo están disponibles en el navegador.

### Síntomas
- PDF aparentaba tener texto legible (94.8% según estadísticas)
- ChatGPT rechazaba el texto extraído como "no legible"
- Se veían códigos como `%PDF-1.4`, `obj<<`, `/Producer`, `/CreationDate`
- **Error de servidor**: `ReferenceError: DOMMatrix is not defined`
- **Warning**: "Please use the `legacy` build in Node.js environments"

### Causa Raíz
1. **Configuración incorrecta de PDF.js**: El worker no se estaba cargando correctamente
2. **Fallback defectuoso**: El sistema fallback usaba `TextDecoder` directamente sobre el ArrayBuffer del PDF, extrayendo estructura binaria en lugar de contenido
3. **Validación insuficiente**: No detectaba metadata de PDF como contenido inválido
4. **Importaciones estáticas problemáticas**: PDF.js se importaba estáticamente en server actions causando ejecución en servidor

## Solución Implementada

### 1. Configuración Correcta de PDF.js (Solo Cliente)

```typescript
// Verificar que estamos en el navegador
if (typeof window === 'undefined') {
  throw new Error('PDF.js solo puede ejecutarse en el navegador')
}

// Import dinámico de PDF.js solo en el navegador
const pdfjsLib = await import('pdfjs-dist')

// Configurar worker solo si no está ya configurado
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}
```

### 2. Importaciones Dinámicas en Componentes

**Archivo**: `src/components/purchases/PDFInvoiceUploader.tsx`

```typescript
// ❌ ANTES: Importación estática problemática
import { extractTextWithFallback } from '@/lib/pdf-text-extractor'

// ✅ AHORA: Import dinámico solo cuando se necesita
const { extractTextWithFallback } = await import('@/lib/pdf-text-extractor')
```

### 3. Separación de Funciones Server-Safe

**Archivo**: `src/lib/text-validator.ts`

Creamos funciones de validación y limpieza que no dependen de PDF.js para uso en server actions:

```typescript
import { validateExtractedText, filterInvoiceText, cleanCorruptText } from '@/lib/text-validator'
```

### 4. Corrección de Server Actions

**Archivo**: `src/actions/purchases/pdf-processor.ts`

```typescript
// ❌ ANTES: Importación de archivo con PDF.js
import { validateExtractedText } from '@/lib/pdf-text-extractor'

// ✅ AHORA: Importación de funciones independientes
import { validateExtractedText } from '@/lib/text-validator'
```

## Beneficios de la Solución

1. **Extracción precisa**: Solo texto real del contenido de la factura
2. **Compatibilidad SSR**: PDF.js solo se ejecuta en el navegador
3. **Detección de PDFs problemáticos**: Identifica PDFs escaneados como imágenes
4. **Errores informativos**: Mensajes claros sobre por qué falló la extracción
5. **Performance mejorada**: PDF.js optimizado con worker CDN
6. **Robustez**: Manejo de múltiples páginas y errores por página
7. **Separación limpia**: Funciones de servidor vs cliente claramente separadas

## Configuración Técnica

### Dependencias
- `pdfjs-dist: ^5.3.93` (ya instalado)
- Worker CDN automático según versión instalada

### Archivos Modificados
- `src/lib/pdf-text-extractor.ts` - Reescritura completa para solo cliente
- `src/lib/text-validator.ts` - **NUEVO**: Funciones server-safe
- `src/components/purchases/PDFInvoiceUploader.tsx` - Imports dinámicos
- `src/actions/purchases/pdf-processor.ts` - Importaciones corregidas
- Documentación de troubleshooting actualizada

### Características Implementadas

1. **Extracción con coordenadas**: Mantiene estructura de líneas basada en posición Y
2. **Opciones avanzadas**: `useSystemFonts`, `cMapUrl` para mejor compatibilidad
3. **Validación múltiple**: 
   - Verificación de metadata PDF
   - Mínimo de palabras legibles (10+)
   - Porcentaje de legibilidad (60%+)
   - Presencia de indicadores de factura
4. **Procesamiento por página**: Continúa aunque falle una página específica
5. **Importaciones seguras**: Solo en cliente cuando es necesario
6. **Separación servidor/cliente**: Funciones apropiadas para cada entorno

## Casos de Uso Soportados

✅ **PDFs con texto seleccionable** - Extracción perfecta  
✅ **Facturas electrónicas estándar** - Procesamiento completo  
✅ **PDFs multipágina** - Extracción de todas las páginas  
✅ **PDFs con fuentes especiales** - Compatibilidad mejorada  
✅ **Server-Side Rendering** - Sin errores de DOMMatrix  
✅ **Builds de producción** - Importaciones dinámicas seguras  

❌ **PDFs escaneados como imagen** - Error claro solicitando OCR  
❌ **PDFs corruptos** - Error informativo con causas  
❌ **PDFs protegidos** - Error claro sobre protección  

## Pruebas de Verificación

1. **Compilación exitosa** ✅ - Sin errores de DOMMatrix
2. **Subir PDF real de factura** ✅
3. **Verificar texto extraído legible** ✅  
4. **Confirmar que no hay metadata** ✅
5. **ChatGPT procesa exitosamente** ✅
6. **SSR funciona correctamente** ✅

## Estructura del Sistema

```
Cliente (Navegador)
├── PDFInvoiceUploader.tsx (client component)
│   ├── Import dinámico: pdf-text-extractor.ts
│   └── Extracción de PDF con PDF.js
│
Servidor (Next.js)  
├── pdf-processor.ts (server action)
│   ├── Import estático: text-validator.ts
│   └── Validación y limpieza sin PDF.js
│
Compartido
└── text-validator.ts (funciones independientes)
    ├── validateExtractedText()
    ├── filterInvoiceText()
    └── cleanCorruptText()
```

## Próximos Pasos (Opcional)

Para mejorar aún más el sistema:

1. **OCR para PDFs escaneados**: Integrar Tesseract.js
2. **Cache de worker**: Optimizar carga del worker
3. **Previsualización**: Mostrar texto extraído antes de enviar a IA
4. **Batch processing**: Procesar múltiples PDFs simultáneamente

## Estado: ✅ COMPLETAMENTE RESUELTO

El sistema ahora:
- Extrae correctamente el contenido real de los PDFs
- Funciona en entorno SSR sin errores de DOMMatrix
- ChatGPT puede procesar los datos sin problemas
- Compila y despliega sin errores de importación

Ambos errores originales están **completamente eliminados**.

---
**Fecha**: 23 de enero 2025  
**Archivos principales**: 
- `src/lib/pdf-text-extractor.ts`
- `src/lib/text-validator.ts` (nuevo)
- `src/components/purchases/PDFInvoiceUploader.tsx`
- `src/actions/purchases/pdf-processor.ts`

**Impacto**: Sistema de facturas 100% funcional en servidor y cliente 