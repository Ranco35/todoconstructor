# Campos para Crear Producto

## 📋 Campos Básicos

### 1. Información General
- **Nombre** (`name`) - Requerido
  - Tipo: String
  - Descripción: Nombre del producto
  - Validación: No puede estar vacío

- **Código de Barras** (`barcode`) - Opcional
  - Tipo: String
  - Descripción: Código de barras del producto
  - Validación: Formato válido de código de barras

- **Descripción** (`description`) - Opcional
  - Tipo: String
  - Descripción: Descripción detallada del producto
  - Validación: Máximo 500 caracteres

- **Marca** (`brand`) - Opcional
  - Tipo: String
  - Descripción: Marca del producto
  - Validación: Máximo 100 caracteres

- **Imagen** (`image`) - Opcional
  - Tipo: String (URL)
  - Descripción: URL de la imagen del producto
  - Validación: URL válida

### 2. Precios y Costos
- **Precio de Costo** (`costprice`) - Opcional
  - Tipo: Float
  - Descripción: Precio de compra del producto
  - Validación: Número positivo

- **Precio de Venta** (`saleprice`) - Opcional
  - Tipo: Float
  - Descripción: Precio de venta al público
  - Validación: Número positivo

- **IVA** (`vat`) - Opcional
  - Tipo: Float
  - Descripción: Porcentaje de IVA
  - Validación: Número entre 0 y 100

### 3. Relaciones
- **Categoría** (`categoryid`) - Opcional
  - Tipo: Int
  - Descripción: ID de la categoría del producto
  - Validación: ID válido de categoría existente

- **Proveedor** (`supplierid`) - Opcional
  - Tipo: Int
  - Descripción: ID del proveedor del producto
  - Validación: ID válido de proveedor existente

### 4. Unidades de Medida
- **Unidad de Venta** (`salesunitid`) - Opcional
  - Tipo: Int
  - Descripción: ID de la unidad de medida para ventas
  - Validación: ID válido de unidad de medida

- **Unidad de Compra** (`purchaseunitid`) - Opcional
  - Tipo: Int
  - Descripción: ID de la unidad de medida para compras
  - Validación: ID válido de unidad de medida

### 5. Estado y Uso
- **Estado** (`stateid`) - Opcional
  - Tipo: Int
  - Descripción: ID del estado del producto
  - Validación: ID válido de estado

- **Uso** (`usageid`) - Opcional
  - Tipo: Int
  - Descripción: ID del tipo de uso del producto
  - Validación: ID válido de uso

### 6. Almacenamiento
- **Almacenamiento** (`storageid`) - Opcional
  - Tipo: Int
  - Descripción: ID del tipo de almacenamiento
  - Validación: ID válido de almacenamiento

### 7. Políticas y Advertencias
- **Política de Facturación** (`invoicepolicyid`) - Opcional
  - Tipo: Int
  - Descripción: ID de la política de facturación
  - Validación: ID válido de política

- **Advertencia de Línea de Venta** (`salelinewarnid`) - Opcional
  - Tipo: Int
  - Descripción: ID de la advertencia de línea de venta
  - Validación: ID válido de advertencia

## 📝 Notas Importantes

1. **Campos Requeridos**:
   - Solo el nombre es obligatorio
   - Los demás campos son opcionales pero recomendados

2. **Validaciones**:
   - Los precios deben ser números positivos
   - Las URLs deben ser válidas
   - Los IDs de relaciones deben existir

3. **Relaciones**:
   - Todas las relaciones son opcionales
   - Se recomienda completar al menos categoría y proveedor

## 🔄 Proceso de Creación

1. Validar campos requeridos
2. Validar formato de campos
3. Verificar existencia de relaciones
4. Crear producto en base de datos
5. Asignar stock inicial si es necesario

## 📅 Última Actualización
- Fecha: Diciembre 2024
- Versión: 1.0.0 