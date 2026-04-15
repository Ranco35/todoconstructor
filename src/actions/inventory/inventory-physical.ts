import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server'

// Interfaz específica para productos de inventario físico
interface InventoryPhysicalProduct {
  sku: string;
  nombre: string;
  cantidadReal: number;
  cantidadRealProvista: boolean; // true si el usuario ingresó un valor en la celda
  comentario?: string;
  bodega?: string;
  marca?: string;
  descripcion?: string;
  codigoProveedor?: string;
  imagen?: string;
  cantidadActual?: number;
}

// Función para parsear Excel específicamente para inventario físico
async function parseInventoryPhysicalExcel(fileBuffer: ArrayBuffer): Promise<InventoryPhysicalProduct[]> {
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    console.log('🔍 [PARSER] Hojas detectadas:', workbook.SheetNames);
    
    // Buscar la hoja de inventario
    let worksheetName = workbook.SheetNames[0];
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('inventario') || 
          sheetName.toLowerCase().includes('fisico') ||
          sheetName.toLowerCase().includes('inventory')) {
        worksheetName = sheetName;
        break;
      }
    }
    
    console.log('🔍 [PARSER] Usando hoja:', worksheetName);
    const worksheet = workbook.Sheets[worksheetName];
    
    // NUEVO: Parser específico para estructura ExcelJS con títulos y headers
    // Convertir la hoja a array de arrays para manejo manual
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const products: InventoryPhysicalProduct[] = [];
    
    // Buscar la fila de headers (debe contener "SKU")
    let headerRowIndex = -1;
    let headers: string[] = [];
    
    for (let rowIndex = 0; rowIndex <= range.e.r; rowIndex++) {
      const row: string[] = [];
      for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = worksheet[cellAddress];
        row.push(cell ? (cell.v || '').toString().trim() : '');
      }
      
      // Verificar si esta fila contiene los headers (debe tener "SKU")
      if (row.some(cell => cell.toLowerCase().includes('sku'))) {
        headerRowIndex = rowIndex;
        headers = row;
        console.log('🔍 [PARSER] Headers encontrados en fila', rowIndex + 1, ':', headers);
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      console.log('🔍 [PARSER] No se encontraron headers con SKU. Intentando parseo tradicional...');
      // Fallback al método anterior
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      for (const row of jsonData) {
        const rowData = row as any;
        const rawCantidadReal = rowData['Cantidad Real (Conteo Físico)'] ??
          rowData['cantidad real (conteo físico)'] ??
          rowData['Stock contado'] ??
          rowData['stock contado'] ??
          rowData['Cantidad Real'] ??
          rowData['cantidad real'] ??
          undefined;
        const cantidadRealProvista = rawCantidadReal !== undefined && rawCantidadReal !== '' && rawCantidadReal !== null;
        const product: InventoryPhysicalProduct = {
          sku: (rowData['SKU'] || rowData['sku'] || '').toString().trim(),
          nombre: (rowData['Nombre Producto'] || rowData['Nombre'] || rowData['nombre'] || '').toString().trim(),
          cantidadReal: cantidadRealProvista ? Number(rawCantidadReal) : 0,
          cantidadRealProvista,
          comentario: (rowData['Comentarios'] || rowData['comentarios'] || '').toString().trim(),
          bodega: (rowData['Bodega'] || rowData['bodega'] || '').toString().trim(),
          marca: (rowData['Marca'] || rowData['marca'] || '').toString().trim(),
          descripcion: (rowData['Descripción'] || rowData['descripcion'] || '').toString().trim(),
          codigoProveedor: (rowData['Código Proveedor'] || rowData['codigo proveedor'] || '').toString().trim(),
          imagen: (rowData['Imagen'] || rowData['imagen'] || '').toString().trim(),
          cantidadActual: Number(rowData['Cantidad Actual'] || rowData['cantidad actual'] || 0)
        };

        if (product.sku) {
          products.push(product);
          console.log('🔍 [PARSER] Producto parseado (fallback):', product.nombre, '| SKU:', product.sku, '| Cantidad Real:', product.cantidadReal, '| Provista:', cantidadRealProvista);
        }
      }
      
      return products;
    }
    
    // Procesar filas de datos (empezar desde la fila siguiente a los headers)
    for (let rowIndex = headerRowIndex + 1; rowIndex <= range.e.r; rowIndex++) {
      const row: string[] = [];
      for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = worksheet[cellAddress];
        row.push(cell ? (cell.v || '').toString().trim() : '');
      }
      
      // Crear objeto con los headers como claves
      const rowData: any = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          rowData[header] = row[index];
        }
      });
      
      // Debug logging para ver los datos de la fila
      if (row.some(cell => cell && cell.includes('vaji-te-5808'))) {
        console.log('🔍 [DEBUG] Datos completos de la fila de vaji-te-5808:');
        console.log('🔍 [DEBUG] Headers:', JSON.stringify(headers, null, 2));
        console.log('🔍 [DEBUG] Row data:', JSON.stringify(row, null, 2));
        console.log('🔍 [DEBUG] Mapped rowData:', JSON.stringify(rowData, null, 2));
        console.log('🔍 [DEBUG] Cantidad Real value:', rowData['Cantidad Real (Conteo Físico)']);
        console.log('🔍 [DEBUG] Cantidad Real typeof:', typeof rowData['Cantidad Real (Conteo Físico)']);
        console.log('🔍 [DEBUG] Todas las claves del rowData:', Object.keys(rowData as object));
      }
      
      // Detectar si la celda de cantidad real fue llenada
      const rawCantidadReal2 = rowData['Cantidad Real (Conteo Físico)'] ??
        rowData['cantidad real (conteo físico)'] ??
        rowData['Stock contado'] ??
        rowData['stock contado'] ??
        rowData['Cantidad Real'] ??
        rowData['cantidad real'] ??
        undefined;
      const cantidadRealProvista2 = rawCantidadReal2 !== undefined && rawCantidadReal2 !== '' && rawCantidadReal2 !== null;

      // Mapear campos específicos del inventario físico
      const product: InventoryPhysicalProduct = {
        sku: (rowData['SKU'] || rowData['sku'] || '').toString().trim(),
        nombre: (rowData['Nombre Producto'] || rowData['Nombre'] || rowData['nombre'] || '').toString().trim(),
        cantidadReal: cantidadRealProvista2 ? Number(rawCantidadReal2) : 0,
        cantidadRealProvista: cantidadRealProvista2,
        comentario: (rowData['Comentarios'] || rowData['comentarios'] || '').toString().trim(),
        bodega: (rowData['Bodega'] || rowData['bodega'] || '').toString().trim(),
        marca: (rowData['Marca'] || rowData['marca'] || '').toString().trim(),
        descripcion: (rowData['Descripción'] || rowData['descripcion'] || '').toString().trim(),
        codigoProveedor: (rowData['Código Proveedor'] || rowData['codigo proveedor'] || '').toString().trim(),
        imagen: (rowData['Imagen'] || rowData['imagen'] || '').toString().trim(),
        cantidadActual: Number(rowData['Cantidad Actual'] || rowData['cantidad actual'] || 0)
      };

      // Solo agregar productos con SKU válido
      if (product.sku && product.sku !== '') {
        products.push(product);
        console.log('🔍 [PARSER] Producto parseado:', product.nombre, '| SKU:', product.sku, '| Cantidad Real:', product.cantidadReal, '| Provista:', cantidadRealProvista2);
      }
    }
    
    console.log('🔍 [PARSER] Total productos parseados:', products.length);
    return products;
  } catch (error) {
    console.error('Error parseando Excel de inventario físico:', error);
    throw new Error('Error al leer el archivo Excel. Verifique que el formato sea correcto.');
  }
}

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

export async function exportInventoryPhysicalTemplate(
  warehouseId: number | null | undefined,
  categoryId?: number,
  includeAllProducts?: boolean
) {
  try {
    console.log('🔍 [TEMPLATE] Iniciando generación de plantilla:', { warehouseId, categoryId, includeAllProducts })

    // Debe haber al menos una bodega o un modo "todos los productos de una categoría".
    // Si el modo es sólo bodega, warehouseId es obligatorio.
    if (!warehouseId && !(includeAllProducts && categoryId)) {
      throw new Error('Debes seleccionar una bodega, o una categoría con la opción "Todos los productos".')
    }

    const supabase = await getSupabaseServerClient()

    // Obtener información de la bodega (sólo si se seleccionó una)
    let warehouseName = ''
    if (warehouseId) {
      const { data: warehouse, error: warehouseError } = await supabase
        .from('Warehouse')
        .select('name')
        .eq('id', warehouseId)
        .single()

      if (warehouseError) {
        console.error('❌ [TEMPLATE] Error obteniendo información de bodega:', warehouseError)
        throw new Error(`Error obteniendo información de la bodega: ${warehouseError.message}`)
      }

      warehouseName = warehouse?.name || ''
      console.log('✅ [TEMPLATE] Bodega encontrada:', warehouseName)
    } else {
      console.log('ℹ️ [TEMPLATE] Descarga por categoría sin bodega específica')
    }

  let products: any[] = []
  let categoryName = ''

  if (includeAllProducts && categoryId) {
    // Obtener información de la categoría
    console.log('🔍 [TEMPLATE] Consultando información de categoría:', categoryId)
    const { data: category, error: categoryError } = await supabase
      .from('Category')
      .select('name')
      .eq('id', categoryId)
      .single()

    if (categoryError) {
      console.error('Error obteniendo información de categoría:', categoryError)
      throw new Error(`Error obteniendo información de la categoría: ${categoryError.message}`)
    }

    categoryName = category.name || ''

    // Obtener todos los productos de la categoría CON su stock real en la bodega
    console.log('🔍 [TEMPLATE] Consultando productos de categoría:', categoryId, 'con stock de bodega:', warehouseId)
    const { data: categoryProducts, error } = await supabase
      .from('Product')
      .select(`
        id, name, sku, brand, description, supplierid, image
      `)
      .eq('categoryid', categoryId)
      .not('name', 'is', null)
      .neq('name', '')

    if (error) {
      console.error('Error en consulta Product por categoría:', error)
      throw new Error(`Error obteniendo productos de la categoría: ${error.message}`)
    }

    console.log('🔍 [TEMPLATE] Productos de categoría encontrados:', categoryProducts?.length || 0)

    // Obtener stock real de la bodega para estos productos (sólo si hay bodega seleccionada)
    const productIds = categoryProducts?.map(p => p.id) || []
    let stockMap: Record<number, number> = {}

    if (warehouseId && productIds.length > 0) {
      const { data: warehouseStock, error: stockError } = await supabase
        .from('Warehouse_Product')
        .select('productId, quantity')
        .eq('warehouseId', warehouseId)
        .in('productId', productIds)

      if (stockError) {
        console.error('Error obteniendo stock de bodega:', stockError)
      } else if (warehouseStock) {
        stockMap = Object.fromEntries(warehouseStock.map(ws => [ws.productId, ws.quantity || 0]))
        console.log('🔍 [TEMPLATE] Stock encontrado para', warehouseStock.length, 'productos en bodega')
      }
    }

    // Formatear productos con su stock real (0 si no están asignados a la bodega, o si no hay bodega)
    products = categoryProducts?.map(product => ({
      quantity: stockMap[product.id] ?? 0,
      Product: product
    })) || []

    console.log('✅ [TEMPLATE] Productos de categoría con stock real:', products?.length || 0)
  } else {
    // Obtener productos y stock de la bodega (requiere bodega)
    if (!warehouseId) {
      throw new Error('Selecciona una bodega para descargar los productos asignados a ella')
    }
    console.log('🔍 [TEMPLATE] Consultando productos de bodega:', warehouseId)

    const { data: warehouseProducts, error } = await supabase
      .from('Warehouse_Product')
      .select(`
        quantity,
        Product!inner(id, name, sku, brand, description, supplierid, image)
      `)
      .eq('warehouseId', warehouseId)

    if (error) {
      console.error('❌ [TEMPLATE] Error en consulta Warehouse_Product:', error)
      throw new Error(`Error obteniendo productos de la bodega: ${error.message}`)
    }

    console.log('✅ [TEMPLATE] Productos encontrados:', warehouseProducts?.length || 0)
    console.log('🔍 [TEMPLATE] Primer producto de muestra:', warehouseProducts?.[0])
    products = warehouseProducts || []
  }

  console.log('Productos obtenidos:', products?.length || 0)

  // Validar que hay productos para exportar
  if (!products || products.length === 0) {
    const mensaje = includeAllProducts && categoryId 
      ? 'No hay productos en esta categoría.' 
      : 'No hay productos asignados a esta bodega. Por favor, asigne productos antes de generar la plantilla.'
    throw new Error(mensaje)
  }

  // Crear libro y hoja Excel con ExcelJS
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Inventario Fisico')
  
  // Preparar fecha
  const fecha = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // FILA 1: Título principal con merge y estilo azul
  worksheet.mergeCells('A1:I1')
  const titleCell = worksheet.getCell('A1')
  
  // Construir título con categoría si aplica
  let titleText = 'TOMA FÍSICA DE INVENTARIO'
  if (warehouseName) {
    titleText += ` - ${warehouseName.toUpperCase()}`
  } else if (includeAllProducts && categoryName) {
    titleText += ` - CATEGORÍA: ${categoryName.toUpperCase()}`
  } else {
    titleText += ' - BODEGA'
  }
  if (warehouseName && includeAllProducts && categoryName) {
    titleText += ` - CATEGORÍA: ${categoryName.toUpperCase()}`
  }
  
  titleCell.value = titleText
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  }
  titleCell.font = {
    color: { argb: 'FFFFFFFF' },
    bold: true,
    size: 14
  }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  
  // FILA 2: Vacía
  
  // FILA 3: Filtros
  const filtrosCell = worksheet.getCell('A3')
  const filtroPartes: string[] = []
  if (warehouseName) filtroPartes.push(`Bodega: ${warehouseName}`)
  if (includeAllProducts && categoryName) filtroPartes.push(`Categoría: ${categoryName}`)
  const filtroTexto = filtroPartes.length > 0
    ? `Filtros: ${filtroPartes.join(' | ')}`
    : 'Filtros:'
  filtrosCell.value = filtroTexto
  filtrosCell.font = { italic: true, size: 10 }
  
  // FILA 4: Fecha
  const fechaCell = worksheet.getCell('A4')
  fechaCell.value = `Fecha de generación: ${fecha}`
  fechaCell.font = { italic: true, size: 10 }
  
  // FILA 5: Vacía
  
  // FILA 6: Headers con estilo azul
  const headers = [
    'SKU', 'Bodega', 'Nombre Producto', 'Marca', 'Descripción', 
    'Código Proveedor', 'Imagen', 'Cantidad Actual', 'Cantidad Real (Conteo Físico)'
  ]
  
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(6, index + 1)
    cell.value = header
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  // FILAS DE DATOS: Productos
  let currentRow = 7
  products?.forEach((wp: any, index: number) => {
    // Log del primer producto para debug
    if (index === 0) {
      console.log('🔍 [TEMPLATE] Mapeando primer producto:', {
        sku: wp.Product?.sku,
        name: wp.Product?.name,
        brand: wp.Product?.brand,
        description: wp.Product?.description,
        supplierid: wp.Product?.supplierid,
        quantity: wp.quantity
      })
    }
    
    const rowData = [
      wp.Product?.sku || '',
      warehouseName || '',
      wp.Product?.name || '',
      wp.Product?.brand || '',
      wp.Product?.description || '',
      wp.Product?.supplierid || '',
      wp.Product?.image ? 'Con imagen' : 'Sin imagen',
      wp.quantity || 0,
      '' // Columna vacía para llenar manualmente
    ]
    
    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1)
      cell.value = value
      
      // Estilo especial para la columna "Cantidad Real (Conteo Físico)" (columna I = índice 8)
      if (colIndex === 8) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Amarillo
        }
      }
      
      // Bordes para todas las celdas de datos
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      
      // Alineación
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    
    currentRow++
  })

  // Configurar ancho de columnas
  worksheet.columns = [
    { width: 15 }, // SKU
    { width: 12 }, // Bodega
    { width: 25 }, // Nombre Producto
    { width: 12 }, // Marca
    { width: 20 }, // Descripción
    { width: 15 }, // Código Proveedor
    { width: 12 }, // Imagen
    { width: 15 }, // Cantidad Actual
    { width: 25 }  // Cantidad Real (Conteo Físico)
  ]

  // Generar buffer para descarga
  console.log('🔍 [TEMPLATE] Generando archivo Excel...')
  const buffer = await workbook.xlsx.writeBuffer()
  console.log('✅ [TEMPLATE] Archivo Excel generado exitosamente')
  return buffer
  
  } catch (error) {
    console.error('💥 [TEMPLATE] Error en exportInventoryPhysicalTemplate:', error)
    throw new Error(`Error generando plantilla de inventario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

export async function importInventoryPhysicalExcel({
  fileBuffer,
  warehouseId,
  userId,
  comentarios
}: {
  fileBuffer: ArrayBuffer;
  warehouseId: number;
  userId: string;
  comentarios?: string;
}): Promise<InventoryPhysicalImportResult> {
  // 🔑 CRÍTICO: Usar service role para bypassear RLS.
  // Con anon key + RLS, si el cookie de sesión falla el UPDATE
  // se resuelve sin error pero no modifica filas (stock queda intacto).
  const supabase = await getSupabaseServiceClient();

  try {
    // Parsear Excel específicamente para inventario físico
    const productosRaw = await parseInventoryPhysicalExcel(fileBuffer);
  let updated = 0;
  let errors = 0;
  const differences: InventoryPhysicalImportResult['differences'] = [];
  const errorDetails: string[] = [];
  const now = new Date().toISOString();

    // Validar que el archivo tenga datos
    if (!productosRaw || productosRaw.length === 0) {
      return {
        success: false,
        updated: 0,
        errors: 1,
        differences: [],
        errorDetails: ['El archivo Excel está vacío o no tiene datos válidos.']
      };
    }

  let skipped = 0;
  for (const prod of productosRaw) {
    const sku = prod.sku || '';
    const nombre = prod.nombre || '';
    const stockContado = prod.cantidadReal || 0;
    const comentario = prod.comentario || '';

    console.log(`🔍 [PROCESANDO] SKU: ${sku} | Nombre: ${nombre} | Stock Contado: ${stockContado} | Provista: ${prod.cantidadRealProvista}`);

    if (!sku) {
      errors++;
      errorDetails.push(`Producto sin SKU: ${nombre}`);
      console.log(`❌ [ERROR] Producto sin SKU: ${nombre}`);
      continue;
    }

    // Saltar productos donde no se ingresó cantidad real (celda vacía)
    if (!prod.cantidadRealProvista) {
      skipped++;
      console.log(`⏭️ [SALTADO] SKU: ${sku} - No se ingresó cantidad real, se mantiene stock actual`);
      continue;
    }
    
    // Validación de stock contado
    if (isNaN(stockContado) || stockContado < 0) {
      errors++;
      errorDetails.push(`Stock contado inválido para SKU ${sku}: ${stockContado}. Debe ser un número positivo.`);
      console.log(`❌ [ERROR] Stock inválido para ${sku}: ${stockContado}`);
      continue;
    }
    
    // Buscar producto por SKU (ilike para tolerar diferencias de mayúsculas/minúsculas y trim)
    const skuTrim = sku.trim();
    console.log(`🔍 [BD] Buscando producto con SKU: "${skuTrim}"`);
    const { data: productos, error: prodError } = await supabase
      .from('Product')
      .select('id, sku')
      .ilike('sku', skuTrim)
      .limit(2);

    if (prodError) {
      errors++;
      errorDetails.push(`Error buscando producto con SKU ${skuTrim}: ${prodError.message}`);
      console.log(`❌ [ERROR] Error BD buscando SKU ${skuTrim}:`, prodError);
      continue;
    }

    if (!productos || productos.length === 0) {
      errors++;
      errorDetails.push(`No se encontró producto con SKU: ${skuTrim}`);
      console.log(`❌ [ERROR] No se encontró producto con SKU: ${skuTrim}`);
      continue;
    }

    if (productos.length > 1) {
      errors++;
      errorDetails.push(`Hay más de un producto con SKU ${skuTrim}. Corrige duplicados antes de ajustar.`);
      console.log(`❌ [ERROR] SKU duplicado: ${skuTrim}`);
      continue;
    }

    const product = productos[0];
    console.log(`✅ [BD] Producto encontrado: ID ${product.id} para SKU ${skuTrim}`);

    // Buscar relación con bodega
    console.log(`🔍 [BD] Buscando relación producto ${product.id} con bodega ${warehouseId}`);
    const { data: wp, error: wpError } = await supabase
      .from('Warehouse_Product')
      .select('id, quantity')
      .eq('warehouseId', warehouseId)
      .eq('productId', product.id)
      .maybeSingle();

    if (wpError) {
      errors++;
      errorDetails.push(`Error consultando stock para SKU ${skuTrim}: ${wpError.message}`);
      console.log(`❌ [ERROR] BD stock ${skuTrim}:`, wpError);
      continue;
    }

    if (!wp) {
      errors++;
      errorDetails.push(`El producto con SKU ${skuTrim} no está asignado a esta bodega. Debe asignarse primero antes de ajustar el inventario.`);
      console.log(`❌ [ERROR] Producto ${skuTrim} no asignado a bodega ${warehouseId}`);
      continue;
    }

    const stockAnterior = Number(wp.quantity) || 0;
    console.log(`📊 [COMPARACIÓN] SKU: ${skuTrim} | Stock Anterior: ${stockAnterior} | Stock Contado: ${stockContado}`);

    if (stockAnterior !== stockContado) {
      console.log(`🔄 [ACTUALIZANDO] SKU: ${skuTrim} de ${stockAnterior} a ${stockContado}`);

      // Actualizar stock devolviendo la fila para verificar que realmente se modificó.
      // Con RLS, un UPDATE bloqueado se resuelve sin error pero sin cambios → data = []
      const { data: updatedRows, error: updateError } = await supabase
        .from('Warehouse_Product')
        .update({ quantity: stockContado, updatedAt: now })
        .eq('id', wp.id)
        .select('id, quantity');

      if (updateError) {
        errors++;
        errorDetails.push(`Error actualizando stock para SKU ${skuTrim}: ${updateError.message}`);
        console.log(`❌ [ERROR] Error actualizando stock para ${skuTrim}:`, updateError);
        continue;
      }

      if (!updatedRows || updatedRows.length === 0) {
        errors++;
        errorDetails.push(`El stock de ${skuTrim} no se pudo actualizar (posible bloqueo por permisos). Stock se mantiene en ${stockAnterior}.`);
        console.log(`❌ [ERROR] UPDATE sin filas afectadas para ${skuTrim} (RLS?)`);
        continue;
      }

      const nuevoStockConfirmado = Number(updatedRows[0]?.quantity ?? stockContado);
      if (nuevoStockConfirmado !== stockContado) {
        errors++;
        errorDetails.push(`El stock de ${skuTrim} quedó en ${nuevoStockConfirmado} (esperado ${stockContado}).`);
        console.log(`❌ [ERROR] Stock final distinto al esperado para ${skuTrim}: ${nuevoStockConfirmado} vs ${stockContado}`);
        continue;
      }

      updated++;
      differences.push({ sku: skuTrim, nombre, stockAnterior, stockContado, diferencia: stockContado - stockAnterior, comentario });
      console.log(`✅ [ACTUALIZADO] SKU: ${skuTrim} → ${nuevoStockConfirmado}`);
    } else {
      console.log(`⚪ [SIN CAMBIOS] SKU: ${skuTrim} - Stock igual (${stockAnterior})`);
      // Agregar a log cuando no hay diferencia pero con comentario
      if (comentario) {
        differences.push({ sku: skuTrim, nombre, stockAnterior, stockContado, diferencia: 0, comentario });
      }
    }
  }

  if (skipped > 0) {
    console.log(`⏭️ [RESUMEN] ${skipped} productos saltados por no tener cantidad real ingresada`);
  }

  // Registrar historial de inventario físico
  const { error: historyError } = await supabase.from('InventoryPhysicalHistory').insert({
    warehouseId,
    userId,
    fecha: now,
    comentarios: comentarios || '',
    diferencias: differences,
    totalActualizados: updated,
    totalErrores: errors
  });
  
  if (historyError) {
    console.error('Error registrando historial de inventario:', historyError);
    // No agregamos al resultado de errors porque el inventario ya fue actualizado
  }

  return {
    success: errors === 0,
    updated,
    errors,
    differences,
    errorDetails
  };
  
  } catch (error) {
    console.error('Error en importInventoryPhysicalExcel:', error);
    return {
      success: false,
      updated: 0,
      errors: 1,
      differences: [],
      errorDetails: [`Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`]
    };
  }
}

interface InventoryPhysicalHistory {
  id: number;
  warehouseId: number;
  warehouseName: string;
  userId: string;
  userName: string;
  fecha: string;
  comentarios: string;
  diferencias: Array<{
    sku: string;
    nombre: string;
    stockAnterior: number;
    stockContado: number;
    diferencia: number;
    comentario?: string;
  }>;
  totalActualizados: number;
  totalErrores: number;
}

export async function getInventoryPhysicalHistory({
  warehouseId,
  startDate,
  endDate,
  userId,
  limit = 50,
  offset = 0
}: {
  warehouseId?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ data: InventoryPhysicalHistory[]; total: number }> {
  const supabase = await getSupabaseServerClient();
  
  let query = supabase
    .from('InventoryPhysicalHistory')
    .select(`
      id,
      warehouseId,
      userId,
      fecha,
      comentarios,
      diferencias,
      totalActualizados,
      totalErrores,
      Warehouse:warehouseId(name),
      User:userId(name)
    `, { count: 'exact' })
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1);

  if (warehouseId) {
    query = query.eq('warehouseId', warehouseId);
  }
  if (startDate) {
    query = query.gte('fecha', startDate);
  }
  if (endDate) {
    query = query.lte('fecha', endDate);
  }
  if (userId) {
    query = query.eq('userId', userId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error obteniendo historial:', error);
    return { data: [], total: 0 };
  }

  const history = data?.map(item => ({
    id: item.id,
    warehouseId: item.warehouseId,
    warehouseName: item.Warehouse?.name || 'Bodega eliminada',
    userId: item.userId,
    userName: item.User?.name || 'Usuario eliminado',
    fecha: item.fecha,
    comentarios: item.comentarios,
    diferencias: item.diferencias || [],
    totalActualizados: item.totalActualizados,
    totalErrores: item.totalErrores
  })) || [];

  return {
    data: history,
    total: count || 0
  };
}

export async function getInventoryPhysicalStats(): Promise<{
  totalTomas: number;
  totalProductosActualizados: number;
  totalErrores: number;
  promedioDiferencias: number;
  bodegasMasActivas: Array<{ name: string; count: number }>;
}> {
  const supabase = await getSupabaseServerClient();
  
  // Estadísticas generales
  const { data: history, error } = await supabase
    .from('InventoryPhysicalHistory')
    .select(`
      totalActualizados,
      totalErrores,
      Warehouse:warehouseId(name)
    `);

  if (error || !history) {
    return {
      totalTomas: 0,
      totalProductosActualizados: 0,
      totalErrores: 0,
      promedioDiferencias: 0,
      bodegasMasActivas: []
    };
  }

  const totalTomas = history.length;
  const totalProductosActualizados = history.reduce((sum, item) => sum + (item.totalActualizados || 0), 0);
  const totalErrores = history.reduce((sum, item) => sum + (item.totalErrores || 0), 0);
  
  // Calcular promedio de diferencias
  const totalDiferencias = history.reduce((sum, item) => {
    const diferencias = item.diferencias || [];
    return sum + diferencias.length;
  }, 0);
  const promedioDiferencias = totalTomas > 0 ? totalDiferencias / totalTomas : 0;

  // Bodegas más activas
  const bodegaCounts: { [key: string]: number } = {};
  history.forEach(item => {
    const bodegaName = item.Warehouse?.name || 'Sin nombre';
    bodegaCounts[bodegaName] = (bodegaCounts[bodegaName] || 0) + 1;
  });

  const bodegasMasActivas = Object.entries(bodegaCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalTomas,
    totalProductosActualizados,
    totalErrores,
    promedioDiferencias: Math.round(promedioDiferencias * 100) / 100,
    bodegasMasActivas
  };
} 