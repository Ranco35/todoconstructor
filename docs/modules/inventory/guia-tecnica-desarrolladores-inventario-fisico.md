# Guía Técnica para Desarrolladores - Sistema de Inventario Físico con Excel

## Introducción

Esta guía está dirigida a desarrolladores que necesiten mantener, extender o resolver problemas en el sistema de inventario físico basado en Excel. Incluye detalles técnicos de implementación, patrones de código y guías de troubleshooting.

## Arquitectura Técnica

### Stack Tecnológico

```typescript
// Tecnologías principales
- Framework: Next.js 14 con App Router
- Lenguaje: TypeScript
- Base de datos: PostgreSQL (via Supabase)
- Autenticación: Supabase Auth
- Excel Processing: ExcelJS + XLSX
- Styling: Tailwind CSS + shadcn/ui
- State Management: React useState/useEffect
```

### Estructura de Archivos

```
src/
├── actions/inventory/
│   └── inventory-physical.ts        # ⭐ Lógica principal del sistema
├── app/api/inventory/physical/
│   ├── template/route.ts           # Generación de plantillas
│   ├── import/route.ts             # Importación de archivos
│   ├── count/route.ts              # Conteo de productos
│   ├── history/route.ts            # Historial de inventarios
│   └── stats/route.ts              # Estadísticas generales
├── components/inventory/
│   ├── InventoryPhysicalForm.tsx   # ⭐ Formulario principal
│   └── InventoryPhysicalHistory.tsx # Historial y reportes
└── app/dashboard/inventory/physical/
    ├── page.tsx                    # Página principal
    └── history/page.tsx            # Página de historial
```

## Detalles de Implementación

### 1. Generación de Plantillas Excel (ExcelJS)

**Función principal**: `exportInventoryPhysicalTemplate()`

```typescript
// Configuración de ExcelJS
const workbook = new ExcelJS.Workbook()
const worksheet = workbook.addWorksheet('Inventario Fisico')

// Título principal con merge y estilo
worksheet.mergeCells('A1:I1')
const titleCell = worksheet.getCell('A1')
titleCell.value = `TOMA FÍSICA DE INVENTARIO - ${(warehouse.name || 'BODEGA').toUpperCase()}`
titleCell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4472C4' } // Azul corporativo
}
```

**Características técnicas**:
- **Merge de celdas**: A1:I1 para título principal
- **Colores corporativos**: #4472C4 (azul), #FFFF00 (amarillo)
- **Fonts dinámicos**: Tamaños y estilos responsivos
- **Bordes**: Thin borders en todas las celdas de datos
- **Anchos de columna**: Optimizados para contenido

### 2. Parser Inteligente de Excel

**Función principal**: `parseInventoryPhysicalExcel()`

```typescript
// Algoritmo de detección de headers
for (let rowIndex = 0; rowIndex <= range.e.r; rowIndex++) {
  const row: string[] = [];
  // ... leer fila completa ...
  
  // Buscar fila que contenga "SKU"
  if (row.some(cell => cell.toLowerCase().includes('sku'))) {
    headerRowIndex = rowIndex;
    headers = row;
    console.log('🔍 [PARSER] Headers encontrados en fila', rowIndex + 1);
    break;
  }
}
```

**Características del parser**:
- **Detección automática**: Busca headers dinámicamente
- **Fallback robusto**: Método alternativo si falla detección
- **Mapeo flexible**: Múltiples variaciones de nombres de columna
- **Logging detallado**: Para debugging y monitoreo

### 3. Manejo de Estado React

**Componente principal**: `InventoryPhysicalForm.tsx`

```typescript
// Estados principales
const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null)
const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
const [includeAllProducts, setIncludeAllProducts] = useState(false)
const [warehouseProductCount, setWarehouseProductCount] = useState<number | null>(null)
const [categoryProductCount, setCategoryProductCount] = useState<number | null>(null)
const [result, setResult] = useState<InventoryPhysicalResult | null>(null)

// Conteo automático al seleccionar bodega
const handleWarehouseChange = (warehouseId: number | undefined) => {
  setSelectedWarehouseId(warehouseId || null)
  setWarehouseProductCount(null)
  if (warehouseId) {
    getWarehouseProductCount(warehouseId) // Llamada automática
  }
}
```

### 4. Interfaces TypeScript

```typescript
// Producto de inventario físico
interface InventoryPhysicalProduct {
  sku: string;
  nombre: string;
  cantidadReal: number;
  comentario?: string;
  bodega?: string;
  marca?: string;
  descripcion?: string;
  codigoProveedor?: string;
  imagen?: string;
  cantidadActual?: number;
}

// Resultado de importación
interface InventoryPhysicalImportResult {
  success: boolean;
  updated: number;
  errors: number;
  differences: Array<{
    sku: string;
    nombre: string;
    stockAnterior: number;
    stockContado: number;
    diferencia: number;
    comentario?: string;
  }>;
  errorDetails: string[];
}

// Historial de inventario
interface InventoryPhysicalHistory {
  id: number;
  warehouseId: number;
  warehouseName: string;
  userId: string;
  userName: string;
  fecha: string;
  comentarios: string;
  diferencias: Array<...>;
  totalActualizados: number;
  totalErrores: number;
}
```

## Base de Datos

### Tabla Principal: InventoryPhysicalHistory

```sql
CREATE TABLE "InventoryPhysicalHistory" (
  id SERIAL PRIMARY KEY,
  "warehouseId" INTEGER NOT NULL REFERENCES "Warehouse"(id),
  "userId" TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT NOW(),
  comentarios TEXT,
  diferencias JSONB,
  "totalActualizados" INTEGER DEFAULT 0,
  "totalErrores" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX "InventoryPhysicalHistory_warehouseId_idx" ON "InventoryPhysicalHistory"("warehouseId");
CREATE INDEX "InventoryPhysicalHistory_userId_idx" ON "InventoryPhysicalHistory"("userId");
CREATE INDEX "InventoryPhysicalHistory_fecha_idx" ON "InventoryPhysicalHistory"(fecha);

-- RLS (Row Level Security)
ALTER TABLE "InventoryPhysicalHistory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view inventory history" ON "InventoryPhysicalHistory"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert inventory history" ON "InventoryPhysicalHistory"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Consultas Principales

```sql
-- Obtener historial con información de bodega y usuario
SELECT 
  iph.*,
  w.name as "warehouseName",
  u.name as "userName"
FROM "InventoryPhysicalHistory" iph
LEFT JOIN "Warehouse" w ON iph."warehouseId" = w.id
LEFT JOIN "User" u ON iph."userId" = u.id
WHERE iph."warehouseId" = $1
ORDER BY iph.fecha DESC;

-- Estadísticas generales
SELECT 
  COUNT(*) as "totalTomas",
  SUM("totalActualizados") as "totalProductosActualizados",
  SUM("totalErrores") as "totalErrores",
  AVG(array_length(diferencias, 1)) as "promedioDiferencias"
FROM "InventoryPhysicalHistory";

-- Bodegas más activas
SELECT 
  w.name,
  COUNT(*) as count
FROM "InventoryPhysicalHistory" iph
JOIN "Warehouse" w ON iph."warehouseId" = w.id
GROUP BY w.id, w.name
ORDER BY count DESC
LIMIT 5;
```

## API Endpoints

### 1. POST /api/inventory/physical/template

```typescript
// Generar plantilla Excel
export async function POST(request: NextRequest) {
  try {
    const { warehouseId, categoryId, includeAllProducts } = await request.json()

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'warehouseId es requerido' },
        { status: 400 }
      )
    }

    const buffer = await exportInventoryPhysicalTemplate(warehouseId, categoryId, includeAllProducts)
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventario-fisico-con-colores.xlsx"`
      }
    })
  } catch (error) {
    console.error('Error generando plantilla:', error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
}
```

### 2. POST /api/inventory/physical/import

```typescript
// Procesar archivo de inventario
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const warehouseId = Number(formData.get('warehouseId'))
    const comentarios = formData.get('comentarios') as string

    if (!file || !warehouseId) {
      return NextResponse.json(
        { error: 'Archivo y bodega son requeridos' },
        { status: 400 }
      )
    }

    const fileBuffer = await file.arrayBuffer()
    const currentUser = await getCurrentUser()
    
    const result = await importInventoryPhysicalExcel({
      fileBuffer,
      warehouseId,
      userId: currentUser.id,
      comentarios
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en importación:', error)
    return NextResponse.json(
      { error: `Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
}
```

## Patrones de Código

### 1. Manejo de Errores

```typescript
// Patrón de manejo de errores granular
for (const prod of productosRaw) {
  try {
    // Validación individual
    if (!sku) {
      errors++;
      errorDetails.push(`Producto sin SKU: ${nombre}`);
      continue; // Continuar con siguiente producto
    }

    // Procesamiento con logging
    console.log(`🔍 [PROCESANDO] SKU: ${sku} | Nombre: ${nombre} | Stock Contado: ${stockContado}`);
    
    // Operación de BD
    const { data: product, error: prodError } = await supabase
      .from('Product')
      .select('id')
      .eq('sku', sku)
      .single();
    
    if (prodError || !product) {
      errors++;
      errorDetails.push(`No se encontró producto con SKU: ${sku}`);
      continue;
    }

    // Éxito
    updated++;
    console.log(`✅ [ACTUALIZADO] SKU: ${sku} actualizado exitosamente`);
    
  } catch (error) {
    errors++;
    errorDetails.push(`Error procesando ${sku}: ${error.message}`);
    console.error(`❌ [ERROR] Error en ${sku}:`, error);
  }
}
```

### 2. Logging Estructurado

```typescript
// Sistema de logging con emojis y contexto
console.log('🔍 [PARSER] Hojas detectadas:', workbook.SheetNames);
console.log('🔍 [PARSER] Usando hoja:', worksheetName);
console.log('🔍 [PARSER] Headers encontrados en fila', rowIndex + 1, ':', headers);
console.log('🔍 [PARSER] Producto parseado:', product.nombre, '| SKU:', product.sku, '| Cantidad Real:', product.cantidadReal);
console.log('🔍 [PARSER] Total productos parseados:', products.length);

console.log(`🔍 [PROCESANDO] SKU: ${sku} | Nombre: ${nombre} | Stock Contado: ${stockContado}`);
console.log(`✅ [BD] Producto encontrado: ID ${product.id} para SKU ${sku}`);
console.log(`📊 [COMPARACIÓN] SKU: ${sku} | Stock Anterior: ${stockAnterior} | Stock Contado: ${stockContado}`);
console.log(`🔄 [ACTUALIZANDO] SKU: ${sku} de ${stockAnterior} a ${stockContado}`);
console.log(`✅ [ACTUALIZADO] SKU: ${sku} actualizado exitosamente`);
console.log(`⚪ [SIN CAMBIOS] SKU: ${sku} - Stock igual (${stockAnterior})`);
console.log(`❌ [ERROR] Producto ${sku} no asignado a bodega ${warehouseId}`, wpError);
```

### 3. Validaciones Robustas

```typescript
// Validaciones en capas
function validateInventoryProduct(product: InventoryPhysicalProduct): ValidationResult {
  const errors: string[] = [];

  // Capa 1: Validaciones básicas
  if (!product.sku || product.sku.trim() === '') {
    errors.push('SKU es obligatorio');
  }

  // Capa 2: Validaciones de tipo
  if (isNaN(product.cantidadReal) || product.cantidadReal < 0) {
    errors.push('Cantidad real debe ser un número positivo');
  }

  // Capa 3: Validaciones de negocio
  if (product.sku && product.sku.length > 50) {
    errors.push('SKU no puede exceder 50 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Debugging y Troubleshooting

### 1. Problemas Comunes

#### Parser no encuentra headers
```typescript
// Verificar en logs:
🔍 [PARSER] Headers encontrados en fila X: [...]

// Si no aparece, verificar:
- Columna "SKU" existe en Excel
- No hay espacios extra en nombre de columna
- Archivo no está corrupto
```

#### Productos no se actualizan
```typescript
// Verificar secuencia:
🔍 [PROCESANDO] SKU: xxx
✅ [BD] Producto encontrado: ID xxx
📊 [COMPARACIÓN] Stock Anterior: X | Stock Contado: Y
🔄 [ACTUALIZANDO] SKU: xxx

// Si falla en algún paso, revisar:
- Producto existe en BD
- Producto asignado a bodega
- Permisos de usuario
- Conexión a BD
```

#### Archivos Excel corruptos
```typescript
// Síntomas:
Error parseando Excel de inventario físico: [Error details]

// Soluciones:
1. Verificar formato .xlsx (no .xls)
2. Abrir y guardar en Excel nativo
3. Verificar tamaño < 10MB
4. Verificar estructura de columnas
```

### 2. Herramientas de Debug

#### Logging de Producto Específico
```typescript
// Para debuggear producto específico, agregar:
if (row.some(cell => cell && cell.includes('SKU_ESPECIFICO'))) {
  console.log('🔍 [DEBUG] Datos completos de la fila:');
  console.log('🔍 [DEBUG] Headers:', JSON.stringify(headers, null, 2));
  console.log('🔍 [DEBUG] Row data:', JSON.stringify(row, null, 2));
  console.log('🔍 [DEBUG] Mapped rowData:', JSON.stringify(rowData, null, 2));
}
```

#### Verificación de BD
```sql
-- Verificar producto existe
SELECT * FROM "Product" WHERE sku = 'SKU_ESPECIFICO';

-- Verificar asignación a bodega
SELECT * FROM "Warehouse_Product" 
WHERE "productId" = (SELECT id FROM "Product" WHERE sku = 'SKU_ESPECIFICO')
AND "warehouseId" = WAREHOUSE_ID;

-- Verificar historial
SELECT * FROM "InventoryPhysicalHistory" 
WHERE "warehouseId" = WAREHOUSE_ID 
ORDER BY fecha DESC LIMIT 5;
```

### 3. Performance Monitoring

```typescript
// Medir tiempo de operaciones
const startTime = Date.now();
const result = await importInventoryPhysicalExcel({ ... });
const processingTime = Date.now() - startTime;
console.log(`⏱️ [PERFORMANCE] Procesamiento completado en ${processingTime}ms`);

// Métricas por producto
const avgTimePerProduct = processingTime / result.updated;
console.log(`⏱️ [PERFORMANCE] Promedio por producto: ${avgTimePerProduct}ms`);
```

## Extensiones y Mejoras

### 1. Agregar Nueva Validación

```typescript
// En parseInventoryPhysicalExcel()
const product: InventoryPhysicalProduct = {
  // ... campos existentes ...
  
  // Nueva validación
  customField: validateCustomField(rowData['Custom Field'])
};

function validateCustomField(value: any): string {
  if (!value) return '';
  // Lógica de validación personalizada
  return value.toString().trim();
}
```

### 2. Nuevo Endpoint de API

```typescript
// En src/app/api/inventory/physical/validate/route.ts
export async function POST(request: NextRequest) {
  try {
    const { warehouseId, file } = await request.json();
    
    // Validar archivo sin procesar
    const validationResult = await validateInventoryFile(file, warehouseId);
    
    return NextResponse.json(validationResult);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. Componente UI Adicional

```typescript
// En src/components/inventory/InventoryValidationPreview.tsx
export default function InventoryValidationPreview({ file, warehouseId }: Props) {
  const [validation, setValidation] = useState(null);
  
  useEffect(() => {
    if (file && warehouseId) {
      validateFile(file, warehouseId).then(setValidation);
    }
  }, [file, warehouseId]);
  
  return (
    <div>
      {/* Vista previa de validación */}
    </div>
  );
}
```

## Testing

### 1. Unit Tests

```typescript
// tests/inventory-physical.test.ts
describe('parseInventoryPhysicalExcel', () => {
  it('should parse valid Excel file', () => {
    const mockBuffer = createMockExcelBuffer();
    const result = parseInventoryPhysicalExcel(mockBuffer);
    
    expect(result).toHaveLength(42);
    expect(result[0]).toMatchObject({
      sku: 'vaji-te-5808',
      nombre: 'Taza Café',
      cantidadReal: 15
    });
  });
  
  it('should handle missing headers gracefully', () => {
    const mockBuffer = createMockExcelBufferNoHeaders();
    expect(() => parseInventoryPhysicalExcel(mockBuffer)).not.toThrow();
  });
});
```

### 2. Integration Tests

```typescript
// tests/api/inventory-physical.test.ts
describe('/api/inventory/physical/import', () => {
  it('should process valid inventory file', async () => {
    const formData = new FormData();
    formData.append('file', mockExcelFile);
    formData.append('warehouseId', '1');
    
    const response = await fetch('/api/inventory/physical/import', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.updated).toBeGreaterThan(0);
  });
});
```

## Mantenimiento

### 1. Actualizaciones Regulares

- **Dependency updates**: Mantener ExcelJS y XLSX actualizados
- **Performance monitoring**: Revisar métricas mensualmente
- **Log rotation**: Limpiar logs antiguos automáticamente
- **Database maintenance**: Vacuum e índices optimizados

### 2. Monitoreo

```typescript
// Métricas a monitorear
- Tiempo promedio de procesamiento por producto
- Tasa de errores por archivo
- Volumen de inventarios procesados
- Uso de memoria durante procesamiento
- Tamaño promedio de archivos Excel
```

### 3. Backup y Recovery

```sql
-- Backup de historial crítico
pg_dump --table=InventoryPhysicalHistory production_db > inventory_backup.sql

-- Verificación de integridad
SELECT COUNT(*) FROM "InventoryPhysicalHistory" WHERE diferencias IS NULL;
```

## Conclusión

Esta guía técnica proporciona toda la información necesaria para mantener y extender el sistema de inventario físico. El código está estructurado de manera modular y bien documentado, facilitando futuras mejoras y resolución de problemas.

### Recursos Adicionales

- **Documentación ExcelJS**: https://github.com/exceljs/exceljs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

*Guía actualizada: 02 de Enero 2025*  
*Sistema: Hotel/Spa Admintermas - Módulo de Inventarios*  
*Versión: 1.0.0* 