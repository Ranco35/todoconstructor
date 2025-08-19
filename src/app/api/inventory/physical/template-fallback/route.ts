import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const XLSX = await import('xlsx')
    const { warehouseId, warehouseName } = await request.json()

    // Crear plantilla de ejemplo sin consultar la base de datos
    const rows = [
      {
        SKU: 'vaji-arco-005-9369',
        Bodega: warehouseName || 'Bodega Principal',
        'Nombre Producto': 'Copa de Vino Blanco',
        Marca: 'Arco',
        Descripción: 'Copa de cristal para vino blanco',
        'Código Proveedor': 'ARCO-001',
        Imagen: 'Con imagen',
        'Cantidad Actual': 25,
        'Cantidad Real (Conteo Físico)': ''
      },
      {
        SKU: 'vaji-te-005-5804',
        Bodega: warehouseName || 'Bodega Principal',
        'Nombre Producto': 'Taza de Té 22cl',
        Marca: 'Porcelana',
        Descripción: 'Taza de porcelana para té',
        'Código Proveedor': 'PORC-002',
        Imagen: 'Sin imagen',
        'Cantidad Actual': 15,
        'Cantidad Real (Conteo Físico)': ''
      },
      {
        SKU: 'vaji-te-001-3040',
        Bodega: warehouseName || 'Bodega Principal',
        'Nombre Producto': 'Cuchara de Té',
        Marca: 'Inox',
        Descripción: 'Cuchara pequeña para té',
        'Código Proveedor': 'INOX-003',
        Imagen: 'Sin imagen',
        'Cantidad Actual': 42,
        'Cantidad Real (Conteo Físico)': ''
      },
      {
        SKU: 'vaji-wolf-008',
        Bodega: warehouseName || 'Bodega Principal',
        'Nombre Producto': 'Cuchillo de Mesa',
        Marca: 'Wolfen',
        Descripción: 'Cuchillo de mesa acero inoxidable',
        'Código Proveedor': 'WOLF-004',
        Imagen: 'Con imagen',
        'Cantidad Actual': 38,
        'Cantidad Real (Conteo Físico)': ''
      },
      {
        SKU: 'vaji-tene-003',
        Bodega: warehouseName || 'Bodega Principal',
        'Nombre Producto': 'Tenedor de Mesa',
        Marca: 'Inox',
        Descripción: 'Tenedor de mesa acero inoxidable',
        'Código Proveedor': 'INOX-005',
        Imagen: 'Sin imagen',
        'Cantidad Actual': 33,
        'Cantidad Real (Conteo Físico)': ''
      }
    ]

    // Crear Excel con formato exacto de la imagen
    const workbook = XLSX.utils.book_new()
    
    // Crear datos para la hoja con título y encabezados
    const now = new Date()
    const fecha = now.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const warehouseDisplayName = warehouseName || 'Bodega Principal'
    
    // Crear array con título y datos
    const excelData: any[] = []
    
    // Título principal
    excelData.push([`TOMA FÍSICA DE INVENTARIO - ${warehouseDisplayName.toUpperCase()}`])
    excelData.push([]) // Fila vacía
    
    // Información adicional
    excelData.push([`Fecha de generación: ${fecha}`])
    excelData.push([`Productos de ejemplo para pruebas`])
    excelData.push([]) // Fila vacía
    
    // Headers
    const headers = [
      'SKU',
      'Bodega', 
      'Nombre Producto',
      'Marca',
      'Descripción',
      'Código Proveedor',
      'Imagen',
      'Cantidad Actual',
      'Cantidad Real (Conteo Físico)'
    ]
    excelData.push(headers)
    
    // Agregar los datos de productos
    rows.forEach(row => {
      excelData.push([
        row.SKU,
        row.Bodega,
        row['Nombre Producto'],
        row.Marca,
        row.Descripción,
        row['Código Proveedor'],
        row.Imagen,
        row['Cantidad Actual'],
        row['Cantidad Real (Conteo Físico)']
      ])
    })

    // Crear worksheet desde el array
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 15 }, // SKU
      { wch: 12 }, // Bodega
      { wch: 25 }, // Nombre Producto
      { wch: 12 }, // Marca
      { wch: 20 }, // Descripción
      { wch: 15 }, // Código Proveedor
      { wch: 12 }, // Imagen
      { wch: 12 }, // Cantidad Actual
      { wch: 20 }  // Cantidad Real
    ]
    worksheet['!cols'] = columnWidths

    // Aplicar estilos básicos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:I100')
    
    // Estilo para el título (primera fila)
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      }
    }
    
    // Estilo para los headers (fila 6)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EFEFEF" } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Fisico')

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = `inventario-fisico-${warehouseDisplayName.toLowerCase().replace(/\s+/g, '-')}-ejemplo.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error en template-fallback:', error)
    return NextResponse.json({
      error: 'Error generando plantilla',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 