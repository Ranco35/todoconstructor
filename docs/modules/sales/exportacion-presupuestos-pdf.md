# Exportación de Presupuestos a PDF

## Funcionalidad Implementada

Se ha implementado una función completa para exportar presupuestos a PDF con formato profesional que incluye:

### ✅ Características del PDF

- **Header profesional** con logo de Termas LLifén
- **Información completa del presupuesto** (número, fechas, vendedor)
- **Datos del cliente** (nombre, ciudad, NIF)
- **Tabla detallada de productos** con precios netos e IVA
- **Resumen financiero** con monto neto, IVA y total
- **Notas adicionales** y términos de pago
- **Footer profesional** con información de contacto

### 🎨 Diseño del PDF

- **Formato A4** estándar
- **Colores corporativos** (verde para headers, azul para resumen)
- **Tipografía profesional** con tamaños jerárquicos
- **Tablas organizadas** con alternancia de colores
- **Espaciado optimizado** para legibilidad

## Cómo Usar

### 1. Botón de Exportar

En el formulario de presupuesto, encontrarás un botón verde **"Exportar PDF"** junto a los botones de acción principales.

### 2. Proceso de Exportación

1. **Completa el presupuesto** con productos y datos del cliente
2. **Haz clic en "Exportar PDF"**
3. **Se descarga automáticamente** el archivo `presupuesto-{numero}.pdf`
4. **El PDF incluye** todos los datos del formulario

### 3. Ubicación del Logo

Para que el logo aparezca en el PDF, súbelo en:
```
public/images/logo-termas.png
```

**Especificaciones del logo:**
- **Formato**: PNG con fondo transparente
- **Tamaño**: 200-300px de ancho
- **Calidad**: Alta resolución para impresión

## Estructura del PDF

### Header
```
TERMAS LLIFEN
HOTEL & SPA

ENCUENTRA EL DESCANSO QUE ESTABAS BUSCANDO
Hotel Spa Termas LLifén
LLifen sn Futrono Chile
```

### Información del Presupuesto
- **Número de presupuesto**
- **Fecha de creación**
- **Fecha de vencimiento**
- **Vendedor**

### Datos del Cliente
- **Nombre completo**
- **Ciudad**
- **NIF/RUT**

### Tabla de Productos
| DESCRIPCIÓN | CANTIDAD | PRECIO UN. | IMPUESTOS | IMPORTE |
|-------------|----------|------------|-----------|---------|
| Producto 1  | 2        | $50.000    | IVA 19%   | $100.000|
| Producto 2  | 1        | $30.000    | IVA 19%   | $30.000 |

### Resumen Financiero
- **Monto Neto**: $130.000
- **IVA 19%**: $24.700
- **TOTAL**: $154.700

### Footer
```
Gracias por su preferencia
Hotel Spa Termas LLifén - LLifen sn Futrono Chile
```

## Archivos Modificados

### Nuevos Archivos
- `src/utils/pdfExport.ts` - Función principal de exportación
- `docs/modules/sales/exportacion-presupuestos-pdf.md` - Esta documentación

### Archivos Modificados
- `src/components/sales/BudgetForm.tsx` - Agregado botón de exportar
- `package.json` - Dependencias jsPDF y html2canvas

## Dependencias Instaladas

```bash
npm install jspdf html2canvas jspdf-autotable
```

**Dependencias utilizadas:**
- `jspdf` - Librería principal para generar PDFs
- `html2canvas` - Para capturar elementos HTML (futuras mejoras)
- `jspdf-autotable` - Plugin para crear tablas profesionales en PDF

## Características Técnicas

### Funcionalidades
- ✅ **Exportación automática** al hacer clic
- ✅ **Formato profesional** similar a la imagen de referencia
- ✅ **Inclusión de logo** (cuando esté disponible)
- ✅ **Datos completos** del cliente y presupuesto
- ✅ **Cálculos automáticos** de IVA y totales
- ✅ **Nombres de archivo** con número de presupuesto

### Compatibilidad
- ✅ **Navegadores modernos** (Chrome, Firefox, Safari, Edge)
- ✅ **Dispositivos móviles** y tablets
- ✅ **Impresión profesional** en A4

## Próximas Mejoras

### Funcionalidades Futuras
- [ ] **Vista previa** del PDF antes de descargar
- [ ] **Múltiples formatos** (A4, carta, personalizado)
- [ ] **Plantillas personalizables** para diferentes tipos de presupuesto
- [ ] **Envío por email** directo desde la aplicación
- [ ] **Firma digital** en el PDF
- [ ] **Código QR** para acceso rápido al presupuesto online

### Mejoras de Diseño
- [ ] **Más opciones de colores** corporativos
- [ ] **Gráficos y diagramas** en el PDF
- [ ] **Marca de agua** personalizada
- [ ] **Encabezados y pies de página** personalizables

## Solución de Problemas

### El PDF no se descarga
1. Verifica que tienes permisos de descarga en el navegador
2. Revisa la consola del navegador para errores
3. Asegúrate de que el presupuesto tiene datos válidos

### El logo no aparece
1. Verifica que el archivo existe en `public/images/logo-termas.png`
2. Asegúrate de que el formato es PNG
3. Revisa que el archivo no esté corrupto

### Errores de cálculo
1. Verifica que los precios están en formato numérico
2. Revisa que las cantidades son válidas
3. Asegúrate de que no hay valores nulos o undefined

## Contacto

Para reportar problemas o solicitar mejoras en la función de exportación, contacta al equipo de desarrollo. 