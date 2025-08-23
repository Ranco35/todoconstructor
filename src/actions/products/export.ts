'use server';

// actions/products/export.ts
import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface ProductExportData {
  id: number;
  sku: string | null;
  name: string;
  type: string | null;
  description: string | null;
  brand: string | null;
  costPrice: number | null;
  salePrice: number | null;
  vat: number | null;
  barcode: string | null;
  categoryName: string | null;
  categoryId: number | null;
  supplierName: string | null;
  supplierId: number | null;
  supplierCode: string | null;
  currentStock: number | null;
  minStock: number | null;
  maxStock: number | null;
  warehouseName: string | null;
  warehouseId: number | null;
  unit: string | null; // Campo de unidad del producto
  salesunitid: number | null; // ID de unidad de venta
  salesUnitName: string | null; // 🔧 AGREGADO: Nombre de unidad de venta
  purchaseunitid: number | null; // ID de unidad de compra
  purchaseUnitName: string | null; // 🔧 AGREGADO: Nombre de unidad de compra
  // Campos POS
  isPOSEnabled: boolean;
  posCategoryName: string | null;
  posCategoryId: number | null;
  isForSale: boolean; // 🆕 NUEVO: Indica si el producto es para venta
  Warehouse_Products?: Array<{
    id: number;
    warehouseId: number;
    productId: number;
    quantity: number;
    minStock?: number | null;
    maxStock?: number | null;
    Warehouse?: {
      id: number;
      name: string;
    } | null;
  }> | null;
}

export async function getProductsForExport(filters?: { categoryId?: number; search?: string }): Promise<ProductExportData[]> {
  try {
    const supabase = await getSupabaseServerClient();
    
    console.log('Iniciando exportación de productos...', filters ? `Filtros: ${JSON.stringify(filters)}` : 'Sin filtros');
    
    // Construir consulta base
    let query = supabase
      .from('Product')
      .select(`
        *,
        Warehouse_Products:Warehouse_Product (
          id,
          warehouseId,
          productId,
          quantity,
          Warehouse (
            id,
            name
          )
        )
      `);
    
    // Aplicar filtro por categoría si se proporciona
    if (filters?.categoryId) {
      query = query.eq('categoryid', filters.categoryId);
    }
    
    // Aplicar filtro de búsqueda si se proporciona
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
    }
    
    const { data: products, error } = await query.order('id', { ascending: true });

    if (error) {
      console.error('Error en consulta Supabase:', error);
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }

    console.log(`Productos obtenidos: ${products?.length || 0}`);

    // Obtener información POS para todos los productos
    const productIds = (products || []).map(p => p.id);
    const posProductsMap = new Map<number, { categoryId: number; categoryName: string }>();
    
    // Comentado temporalmente - tabla POSProduct no existe
    /*
    if (productIds.length > 0) {
      const { data: posProducts } = await supabase
        .from('POSProduct')
        .select(`
          productId,
          categoryId,
          category:POSProductCategory (
            id,
            name
          )
        `)
        .in('productId', productIds)
        .eq('isActive', true);
      
      (posProducts || []).forEach(posProduct => {
        if (posProduct.productId && posProduct.category) {
          posProductsMap.set(posProduct.productId, {
            categoryId: posProduct.categoryId,
            categoryName: posProduct.category.name
          });
        }
      });
    }
    */
    
    // 🔧 AGREGADO: Obtener nombres de unidades de medida
    const { data: unitMeasures } = await supabase
      .from('UnitMeasure')
      .select('id, name')
      .eq('isActive', true);
    
    const unitMeasuresMap = new Map<number, string>();
    (unitMeasures || []).forEach(unit => {
      unitMeasuresMap.set(unit.id, unit.name);
    });

    if (!products || products.length === 0) {
      return [];
    }

    return (products || []).map(product => {
      // Calcular stock total sumando todas las bodegas
      const warehouseProducts = product.Warehouse_Products || [];
      const totalStock = warehouseProducts.reduce((sum, wp) => sum + (wp.quantity || 0), 0);
      
      // Tomar solo la primera bodega asociada (si existe) para mostrar en columnas individuales
      const firstWarehouse = warehouseProducts.length > 0 ? warehouseProducts[0] : null;
      
      // Obtener información POS
      const posInfo = posProductsMap.get(product.id);
      
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        type: product.type || '',
        description: product.description,
        brand: product.brand,
        costPrice: product.costprice,
        salePrice: product.saleprice,
        vat: product.vat,
        barcode: product.barcode,
        categoryName: null, // No hay relación Category en la BD
        categoryId: product.categoryid || null,
        supplierName: null, // No hay relación Supplier en la BD
        supplierId: product.supplierid || null,
        supplierCode: product.supplierCode || '',
        // Stock info - calculado real
        currentStock: totalStock,
        minStock: firstWarehouse?.minStock || null,
        maxStock: firstWarehouse?.maxStock || null,
        warehouseName: firstWarehouse?.Warehouse?.name || '',
        warehouseId: firstWarehouse?.Warehouse?.id || null,
        unit: product.unit || null, // Campo de unidad del producto
        salesunitid: product.salesunitid || null, // ID de unidad de venta
        salesUnitName: product.salesunitid ? unitMeasuresMap.get(product.salesunitid) || null : null, // 🔧 AGREGADO: Nombre de unidad de venta
        purchaseunitid: product.purchaseunitid || null, // ID de unidad de compra
        purchaseUnitName: product.purchaseunitid ? unitMeasuresMap.get(product.purchaseunitid) || null : null, // 🔧 AGREGADO: Nombre de unidad de compra
        // Campos POS
        isPOSEnabled: product.isPOSEnabled || false,
        posCategoryName: posInfo?.categoryName || null,
        posCategoryId: posInfo?.categoryId || null,
        isForSale: product.isForSale ?? true, // 🆕 NUEVO: Por defecto es para venta
        // Información completa de todas las bodegas
        Warehouse_Products: warehouseProducts.map(wp => ({
          id: wp.id,
          warehouseId: wp.warehouseId,
          productId: wp.productId,
          quantity: wp.quantity,
          minStock: wp.minStock,
          maxStock: wp.maxStock,
          Warehouse: wp.Warehouse
        }))
      };
    });
  } catch (error) {
    console.error('Error exportando productos:', error);
    throw new Error('Error al exportar productos');
  }
}

// NUEVA FUNCIÓN: Obtener productos por IDs específicos
export async function getProductsByIds(ids: number[]): Promise<ProductExportData[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('Product')
      .select(`
        *,
        Warehouse_Products:Warehouse_Product (
          id,
          warehouseId,
          productId,
          quantity,
          Warehouse (
            id,
            name
          )
        )
      `)
      .in('id', ids);
    const { data: products, error } = await query.order('id', { ascending: true });
    if (error) {
      console.error('Error en consulta por IDs:', error);
      throw new Error(`Error obteniendo productos por IDs: ${error.message}`);
    }
    // Obtener info POS igual que en getProductsForExport
    const posProductsMap = new Map<number, { categoryId: number; categoryName: string }>();
    // Comentado temporalmente - tabla POSProduct no existe
    /*
    if (products && products.length > 0) {
      const { data: posProducts } = await supabase
        .from('POSProduct')
        .select(`
          productId,
          categoryId,
          category:POSProductCategory (
            id,
            name
          )
        `)
        .in('productId', products.map(p => p.id))
        .eq('isActive', true);
      (posProducts || []).forEach(posProduct => {
        if (posProduct.productId && posProduct.category) {
          posProductsMap.set(posProduct.productId, {
            categoryId: posProduct.categoryId,
            categoryName: posProduct.category.name
          });
        }
      });
    }
    */
    return (products || []).map(product => {
      const warehouseProducts = product.Warehouse_Products || [];
      const totalStock = warehouseProducts.reduce((sum, wp) => sum + (wp.quantity || 0), 0);
      const firstWarehouse = warehouseProducts.length > 0 ? warehouseProducts[0] : null;
      const posInfo = posProductsMap.get(product.id);
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        type: product.type || '',
        description: product.description,
        brand: product.brand,
        costPrice: product.costprice,
        salePrice: product.saleprice,
        vat: product.vat,
        barcode: product.barcode,
        categoryName: null, // No hay relación Category en la BD
        categoryId: product.categoryid || null,
        supplierName: null, // No hay relación Supplier en la BD
        supplierId: product.supplierid || null,
        supplierCode: product.supplierCode || '',
        currentStock: totalStock,
        minStock: firstWarehouse?.minStock || null,
        maxStock: firstWarehouse?.maxStock || null,
        warehouseName: firstWarehouse?.Warehouse?.name || '',
        warehouseId: firstWarehouse?.Warehouse?.id || null,
        unit: product.unit || null, // Campo de unidad del producto
        isPOSEnabled: product.isPOSEnabled || false,
        posCategoryName: posInfo?.categoryName || null,
        posCategoryId: posInfo?.categoryId || null,
        isForSale: product.isForSale ?? true, // 🆕 NUEVO: Por defecto es para venta
        Warehouse_Products: warehouseProducts.map(wp => ({
          id: wp.id,
          warehouseId: wp.warehouseId,
          productId: wp.productId,
          quantity: wp.quantity,
          minStock: wp.minStock,
          maxStock: wp.maxStock,
          Warehouse: wp.Warehouse
        }))
      };
    });
  } catch (error) {
    console.error('Error exportando productos por IDs:', error);
    throw new Error('Error al exportar productos por IDs');
  }
}

// Modificar generateProductsExcel para aceptar ids: number[]
export async function generateProductsExcel(
  params?: { categoryId?: number; search?: string; ids?: number[] }
): Promise<Buffer> {
  const XLSX = await import('xlsx');
  let products: ProductExportData[] = [];
  if (params?.ids && params.ids.length > 0) {
    products = await getProductsByIds(params.ids);
  } else {
    products = await getProductsForExport(params);
  }
  
  // Crear workbook
  const workbook = XLSX.utils.book_new();
  
  // 1. Detectar todas las bodegas únicas en todos los productos
  const allWarehousesSet = new Set<string>();
  products.forEach(product => {
    (product.Warehouse_Products || []).forEach(wp => {
      if (wp.Warehouse?.name) {
        allWarehousesSet.add(wp.Warehouse.name);
      }
    });
  });
  const allWarehouses = Array.from(allWarehousesSet);

  // 2. Armar los datos para la hoja de productos
  const productData = products.map(product => {
    // Info básica
    const base = {
      'ID': product.id,
      'SKU': product.sku || '',
      'Nombre': product.name,
      'Tipo Producto': product.type || '',
      'Descripción': product.description || '',
      'Marca': product.brand,
      'Precio Costo': product.costPrice || '',
      'Precio Venta': product.salePrice || '',
      'IVA (%)': product.vat || '',
      'Código Barras': product.barcode || '',
      'Categoría': product.categoryName || '',
      'ID Categoría': product.categoryId || '',
      'Proveedor': product.supplierName || '',
      'Código del Proveedor': product.supplierCode || '',
      'ID Proveedor': product.supplierId || '',
      'Stock Total': product.currentStock || 0,
      'Stock Mínimo': product.minStock || '',
      'Stock Máximo': product.maxStock || '',
      'Bodegas Asignadas': (product.Warehouse_Products || []).map(wp => wp.Warehouse?.name).filter(Boolean).join(', '),
      'Cantidad de Bodegas': (product.Warehouse_Products || []).length,
      'Bodega Principal': product.warehouseName || '',
      'ID Bodega Principal': product.warehouseId || '',
      // Campos POS
      'Punto de Venta': product.isPOSEnabled ? 'SI' : 'NO',
      'Categoría POS': product.posCategoryName || '',
      'ID Categoría POS': product.posCategoryId || '',
      'Es para Venta': product.isForSale ? 'SI' : 'NO', // 🆕 NUEVO: Campo para venta
      'Unidad': product.unit || '',
      'ID Unidad Venta': product.salesunitid || '',
      'Unidad Venta': product.salesUnitName || '', // 🔧 AGREGADO: Nombre de unidad de venta
      'ID Unidad Compra': product.purchaseunitid || '',
      'Unidad Compra': product.purchaseUnitName || '' // 🔧 AGREGADO: Nombre de unidad de compra
    };
    // 3. Agregar columna de stock por cada bodega
    allWarehouses.forEach(whName => {
      const found = (product.Warehouse_Products || []).find(wp => wp.Warehouse?.name === whName);
      base[`Stock ${whName}`] = found ? found.quantity || 0 : 0;
    });
    return base;
  });

  // 4. Crear hoja de productos
  const productSheet = XLSX.utils.json_to_sheet(productData);
  
  // 5. Definir anchos de columna (básicos + dinámicos)
  const baseWidths = [
    { wch: 8 },   // ID
    { wch: 15 },  // SKU
    { wch: 30 },  // Nombre
    { wch: 15 },  // Tipo
    { wch: 40 },  // Descripción
    { wch: 15 },  // Marca
    { wch: 12 },  // P. Costo
    { wch: 12 },  // P. Venta
    { wch: 8 },   // IVA
    { wch: 15 },  // Código Barras
    { wch: 20 },  // Categoría
    { wch: 12 },  // ID Cat
    { wch: 20 },  // Proveedor
    { wch: 15 },  // Código Prov
    { wch: 12 },  // ID Prov
    { wch: 12 },  // Stock Total
    { wch: 12 },  // Stock Min
    { wch: 12 },  // Stock Max
    { wch: 40 },  // Bodegas Asignadas
    { wch: 15 },  // Cantidad Bodegas
    { wch: 20 },  // Bodega Principal
    { wch: 15 },  // ID Bodega Principal
    { wch: 15 },  // Unidad
    { wch: 15 },  // ID Unidad Venta
    { wch: 15 },  // Unidad Venta
    { wch: 15 },  // ID Unidad Compra
    { wch: 15 },  // Unidad Compra
  ];
  // Ancho para cada bodega
  const warehouseWidths = allWarehouses.map(() => ({ wch: 14 }));
  productSheet['!cols'] = [...baseWidths, ...warehouseWidths];
  
  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(workbook, productSheet, 'Productos');
  
  // Generar buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Función para generar plantilla Excel con ejemplos
export async function generateProductTemplate(): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  
  // Datos de ejemplo para cada tipo de producto con TODOS los campos
  const templateData = [
    // Headers row está implícito en json_to_sheet
    {
      'SKU': 'ELEC-MON-001',
      'Nombre': 'Monitor LED 24 pulgadas', // OBLIGATORIO
      'Tipo Producto': 'INVENTARIO', // OBLIGATORIO
      'Descripción': 'Monitor LED de 24 pulgadas Full HD con entrada HDMI y VGA',
      'Marca': 'Samsung',
      'Precio Costo': 150.00,
      'Precio Venta': 199.99, // OBLIGATORIO
      'IVA (%)': 12,
      'Código Barras': '1234567890123',
      'Categoría': 'Electrónicos',
      'ID Categoría': '',
      'Proveedor': 'Distribuidor Tech',
      'ID Proveedor': '',
      'Stock Actual': 50,
      'Stock Mínimo': 10,
      'Stock Máximo': 100,
      'Bodega': 'Bodega Principal',
      'ID Bodega': '',
      // NUEVAS COLUMNAS PARA MÚLTIPLES BODEGAS
      'Bodegas': 'Bodega Principal, Almacén General',
      'Stock Bodega Principal': 30,
      'Min Bodega Principal': 5,
      'Max Bodega Principal': 50,
      'Stock Almacén General': 20,
      'Min Almacén General': 3,
      'Max Almacén General': 30,
      // Campos POS
      'Punto de Venta': 'SI',
      'Categoría POS': 'Electrónicos',
      'ID Categoría POS': '',
      'Es para Venta': 'SI', // 🆕 NUEVO: Campo para venta
      // Campos de Equipos (solo para INVENTARIO)
      'Es Equipo': 'SI',
      'Modelo': 'S24C314',
      'Número Serie': 'MON24001',
      'Fecha Compra': '2024-01-15',
      'Garantía Hasta': '2026-01-15',
      'Vida Útil (años)': 5,
      'Intervalo Mantenimiento (días)': 180,
      'Último Mantenimiento': '2024-06-15',
      'Próximo Mantenimiento': '2024-12-15',
      'Costo Mantenimiento': 25.00,
      'Proveedor Mantenimiento': 'TechService',
      'Ubicación Actual': 'Oficina Principal',
      'Responsable': 'Juan Pérez',
      'Estado Operacional': 'OPERATIVO',
      'Unidad': 'Pieza',
              'ID Unidad Venta': '1',
        'Unidad Venta': 'Unidad',
        'ID Unidad Compra': '1',
        'Unidad Compra': 'Unidad'
    },
    {
      'SKU': 'OFIC-PAP-002',
      'Nombre': 'Papel Bond A4', // OBLIGATORIO
      'Tipo Producto': 'ALMACENABLE', // OBLIGATORIO
      'Descripción': 'Resma de papel bond A4 75g/m² blanco para impresión',
      'Marca': 'Xerox',
      'Precio Costo': 3.50,
      'Precio Venta': 5.99, // OBLIGATORIO
      'IVA (%)': 12,
      'Código Barras': '9876543210987',
      'Categoría': 'Oficina',
      'ID Categoría': '',
      'Proveedor': 'Papelería Central',
      'ID Proveedor': '',
      'Stock Actual': 200,
      'Stock Mínimo': 50,
      'Stock Máximo': 500,
      'Bodega': 'Almacén General',
      'ID Bodega': '',
      // NUEVAS COLUMNAS PARA MÚLTIPLES BODEGAS
      'Bodegas': 'Almacén General',
      'Stock Almacén General': 200,
      'Min Almacén General': 50,
      'Max Almacén General': 500,
      // Campos POS
      'Punto de Venta': 'NO',
      'Categoría POS': '',
      'ID Categoría POS': '',
      // Campos de Equipos (vacíos para productos no-equipo)
      'Es Equipo': 'NO',
      'Modelo': '',
      'Número Serie': '',
      'Fecha Compra': '',
      'Garantía Hasta': '',
      'Vida Útil (años)': '',
      'Intervalo Mantenimiento (días)': '',
      'Último Mantenimiento': '',
      'Próximo Mantenimiento': '',
      'Costo Mantenimiento': '',
      'Proveedor Mantenimiento': '',
      'Ubicación Actual': '',
      'Responsable': '',
      'Estado Operacional': '',
      'Unidad': '',
      'ID Unidad Venta': '',
      'Unidad Venta': '',
      'ID Unidad Compra': '',
      'Unidad Compra': ''
    },
    {
      'SKU': 'SERV-CONS-003',
      'Nombre': 'Consultoría IT', // OBLIGATORIO
      'Tipo Producto': 'SERVICIO', // OBLIGATORIO
      'Descripción': 'Servicio de consultoría en tecnología por hora',
      'Marca': '',
      'Precio Costo': 0,
      'Precio Venta': 80.00, // OBLIGATORIO
      'IVA (%)': 12,
      'Código Barras': '',
      'Categoría': 'Servicios',
      'ID Categoría': '',
      'Proveedor': '',
      'ID Proveedor': '',
      'Stock Actual': '',
      'Stock Mínimo': '',
      'Stock Máximo': '',
      'Bodega': '',
      'ID Bodega': '',
      // NUEVAS COLUMNAS PARA MÚLTIPLES BODEGAS (vacías para servicios)
      'Bodegas': '',
      // Campos POS
      'Punto de Venta': 'SI',
      'Categoría POS': 'Servicios',
      'ID Categoría POS': '',
      // Campos de Equipos (vacíos para servicios)
      'Es Equipo': 'NO',
      'Modelo': '',
      'Número Serie': '',
      'Fecha Compra': '',
      'Garantía Hasta': '',
      'Vida Útil (años)': '',
      'Intervalo Mantenimiento (días)': '',
      'Último Mantenimiento': '',
      'Próximo Mantenimiento': '',
      'Costo Mantenimiento': '',
      'Proveedor Mantenimiento': '',
      'Ubicación Actual': '',
      'Responsable': '',
      'Estado Operacional': '',
      'Unidad': '',
      'ID Unidad Venta': '',
      'Unidad Venta': '',
      'ID Unidad Compra': '',
      'Unidad Compra': ''
    },
    {
      'SKU': 'COMBO-OFFICE-001',
      'Nombre': 'Kit Oficina Completo', // OBLIGATORIO
      'Tipo Producto': 'COMBO', // OBLIGATORIO
      'Descripción': 'Combo con escritorio, silla y lámpara para oficina',
      'Marca': 'OfficeMax',
      'Precio Costo': 200.00,
      'Precio Venta': 299.99, // OBLIGATORIO
      'IVA (%)': 12,
      'Código Barras': '5555666677778',
      'Categoría': 'Mobiliario',
      'ID Categoría': '',
      'Proveedor': 'Muebles Corp',
      'ID Proveedor': '',
      'Stock Actual': 15,
      'Stock Mínimo': 3,
      'Stock Máximo': 25,
      'Bodega': 'Bodega Principal',
      'ID Bodega': '',
      // NUEVAS COLUMNAS PARA MÚLTIPLES BODEGAS
      'Bodegas': 'Bodega Principal, Almacén General',
      'Stock Bodega Principal': 10,
      'Min Bodega Principal': 2,
      'Max Bodega Principal': 15,
      'Stock Almacén General': 5,
      'Min Almacén General': 1,
      'Max Almacén General': 10,
      // Campos de Equipos (vacíos para combos)
      'Es Equipo': 'NO',
      'Modelo': '',
      'Número Serie': '',
      'Fecha Compra': '',
      'Garantía Hasta': '',
      'Vida Útil (años)': '',
      'Intervalo Mantenimiento (días)': '',
      'Último Mantenimiento': '',
      'Próximo Mantenimiento': '',
      'Costo Mantenimiento': '',
      'Proveedor Mantenimiento': '',
      'Ubicación Actual': '',
      'Responsable': '',
      'Estado Operacional': '',
      'Unidad': '',
      'ID Unidad': ''
    },
    {
      'SKU': '', // Dejar vacío para auto-generar
      'Nombre': 'Producto Ejemplo Sin SKU', // OBLIGATORIO
      'Tipo Producto': 'CONSUMIBLE', // OBLIGATORIO
      'Descripción': 'Este producto no tiene SKU, se generará automáticamente',
      'Marca': 'Generic',
      'Precio Costo': 10.00,
      'Precio Venta': 15.99, // OBLIGATORIO
      'IVA (%)': 12,
      'Código Barras': '',
      'Categoría': 'Varios',
      'ID Categoría': '',
      'Proveedor': '',
      'ID Proveedor': '',
      'Stock Actual': 30,
      'Stock Mínimo': 5,
      'Stock Máximo': 50,
      'Bodega': 'Bodega Principal',
      'ID Bodega': '',
      // NUEVAS COLUMNAS PARA MÚLTIPLES BODEGAS
      'Bodegas': 'Bodega Principal',
      'Stock Bodega Principal': 30,
      'Min Bodega Principal': 5,
      'Max Bodega Principal': 50,
      // Campos de Equipos (vacíos)
      'Es Equipo': 'NO',
      'Modelo': '',
      'Número Serie': '',
      'Fecha Compra': '',
      'Garantía Hasta': '',
      'Vida Útil (años)': '',
      'Intervalo Mantenimiento (días)': '',
      'Último Mantenimiento': '',
      'Próximo Mantenimiento': '',
      'Costo Mantenimiento': '',
      'Proveedor Mantenimiento': '',
      'Ubicación Actual': '',
      'Responsable': '',
      'Estado Operacional': '',
      'Unidad': '',
      'ID Unidad Venta': '',
      'Unidad Venta': '',
      'ID Unidad Compra': '',
      'Unidad Compra': ''
    }
  ];

  // Crear hoja de plantilla
  const templateSheet = XLSX.utils.json_to_sheet(templateData);
  
  // Definir campos obligatorios para marcar en amarillo
  const requiredFields = ['Nombre', 'Tipo Producto', 'Precio Venta'];
  
  // Aplicar formato amarillo a campos obligatorios en el header
  const headerRowNum = 1; // Primera fila
  const headerRange = XLSX.utils.decode_range(templateSheet['!ref'] || 'A1');
  
  // Crear estilos para campos obligatorios
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = templateSheet[cellAddress];
    
    if (cell && requiredFields.includes(cell.v)) {
      // Marcar celda como obligatoria (amarillo)
      if (!cell.s) cell.s = {};
      cell.s.fill = {
        fgColor: { rgb: "FFFF00" }, // Amarillo
        bgColor: { rgb: "FFFF00" }
      };
      cell.s.font = { bold: true };
    }
  }
  
  // Aplicar anchos de columna optimizados
  const columnWidths = [
    { wch: 15 },  // SKU
    { wch: 30 },  // Nombre (OBLIGATORIO)
    { wch: 15 },  // Tipo (OBLIGATORIO)
    { wch: 40 },  // Descripción
    { wch: 15 },  // Marca
    { wch: 12 },  // P. Costo
    { wch: 12 },  // P. Venta (OBLIGATORIO)
    { wch: 8 },   // IVA
    { wch: 15 },  // Código Barras
    { wch: 20 },  // Categoría
    { wch: 12 },  // ID Cat
    { wch: 20 },  // Proveedor
    { wch: 12 },  // ID Prov
    { wch: 10 },  // Stock Act
    { wch: 10 },  // Stock Min
    { wch: 10 },  // Stock Max
    { wch: 20 },  // Bodega
    { wch: 12 },  // ID Bodega
    // NUEVAS COLUMNAS PARA MÚLTIPLES BODEGAS
    { wch: 30 },  // Bodegas
    { wch: 20 },  // Stock Bodega Principal
    { wch: 20 },  // Min Bodega Principal
    { wch: 20 },  // Max Bodega Principal
    { wch: 20 },  // Stock Almacén General
    { wch: 20 },  // Min Almacén General
    { wch: 20 },  // Max Almacén General
    // Campos de Equipos
    { wch: 10 },  // Es Equipo
    { wch: 15 },  // Modelo
    { wch: 15 },  // Número Serie
    { wch: 12 },  // Fecha Compra
    { wch: 12 },  // Garantía Hasta
    { wch: 15 },  // Vida Útil
    { wch: 20 },  // Intervalo Mantenimiento
    { wch: 15 },  // Último Mantenimiento
    { wch: 15 },  // Próximo Mantenimiento
    { wch: 15 },  // Costo Mantenimiento
    { wch: 20 },  // Proveedor Mantenimiento
    { wch: 20 },  // Ubicación Actual
    { wch: 15 },  // Responsable
    { wch: 15 },  // Unidad
    { wch: 15 },  // ID Unidad Venta
    { wch: 15 },  // ID Unidad Compra
    { wch: 15 },  // Unidad Venta
    { wch: 15 },  // ID Unidad Compra
    { wch: 15 },  // Unidad Compra
    { wch: 15 }   // Estado Operacional
  ];
  
  templateSheet['!cols'] = columnWidths;
  
  // Agregar hoja de instrucciones
  const instructionsData = [
    { 'INSTRUCCIONES DE USO': 'PLANTILLA DE IMPORTACIÓN DE PRODUCTOS' },
    { 'INSTRUCCIONES DE USO': '' },
    { 'INSTRUCCIONES DE USO': '📋 CAMPOS OBLIGATORIOS (marcados en AMARILLO):' },
    { 'INSTRUCCIONES DE USO': '• Nombre: Nombre del producto (máx 255 caracteres)' },
    { 'INSTRUCCIONES DE USO': '• Tipo Producto: CONSUMIBLE, ALMACENABLE, INVENTARIO, SERVICIO, COMBO' },
    { 'INSTRUCCIONES DE USO': '• Precio Venta: Precio de venta del producto' },
    { 'INSTRUCCIONES DE USO': '' },
    { 'INSTRUCCIONES DE USO': '🔄 LÓGICA DE IMPORTACIÓN:' },
    { 'INSTRUCCIONES DE USO': '• Con SKU existente → ACTUALIZA el producto' },
    { 'INSTRUCCIONES DE USO': '• Sin SKU o SKU nuevo → CREA producto nuevo' },
    { 'INSTRUCCIONES DE USO': '• SKU vacío → Se genera automáticamente' },
    { 'INSTRUCCIONES DE USO': '' },
    { 'INSTRUCCIONES DE USO': '📦 TIPOS DE PRODUCTOS:' },
    { 'INSTRUCCIONES DE USO': '• CONSUMIBLE: Productos que se consumen (papel, tinta)' },
    { 'INSTRUCCIONES DE USO': '• ALMACENABLE: Productos en inventario (materiales)' },
    { 'INSTRUCCIONES DE USO': '• INVENTARIO: Equipos y máquinas (con mantenimiento)' },
    { 'INSTRUCCIONES DE USO': '• SERVICIO: Servicios profesionales' },
    { 'INSTRUCCIONES DE USO': '• COMBO: Paquetes de productos' },
    { 'INSTRUCCIONES DE USO': '' },
    { 'INSTRUCCIONES DE USO': '🏢 ASIGNACIÓN DE BODEGAS MÚLTIPLES:' },
    { 'INSTRUCCIONES DE USO': '• Bodegas: Lista de bodegas separadas por comas (ej: "Bodega Principal, Almacén General")' },
    { 'INSTRUCCIONES DE USO': '• Stock [Bodega]: Cantidad en esa bodega específica' },
    { 'INSTRUCCIONES DE USO': '• Min [Bodega]: Stock mínimo para esa bodega' },
    { 'INSTRUCCIONES DE USO': '• Max [Bodega]: Stock máximo para esa bodega' },
    { 'INSTRUCCIONES DE USO': '• Ejemplo: Si "Bodegas" = "Bodega A, Bodega B", crear columnas "Stock Bodega A", "Min Bodega A", etc.' },
    { 'INSTRUCCIONES DE USO': '• Si no especifica bodegas múltiples, se usa la columna "Bodega" individual' },
    { 'INSTRUCCIONES DE USO': '' },
    { 'INSTRUCCIONES DE USO': '🔧 EQUIPOS (solo tipo INVENTARIO):' },
    { 'INSTRUCCIONES DE USO': '• Es Equipo: SI/NO (solo SI para equipos que requieren mantenimiento)' },
    { 'INSTRUCCIONES DE USO': '• Estado Operacional: OPERATIVO, MANTENIMIENTO, DAÑADO, FUERA_SERVICIO, VENDIDO' },
    { 'INSTRUCCIONES DE USO': '• Fechas formato: YYYY-MM-DD (ejemplo: 2024-12-25)' },
    { 'INSTRUCCIONES DE USO': '' },
    { 'INSTRUCCIONES DE USO': '📁 BÚSQUEDA AUTOMÁTICA:' },
    { 'INSTRUCCIONES DE USO': '• Categorías, Proveedores y Bodegas se buscan por NOMBRE' },
    { 'INSTRUCCIONES DE USO': '• También puede usar ID si conoce el número' },
    { 'INSTRUCCIONES DE USO': '• Si no existe, se dejará vacío (puede asignar después)' },
  ];
  
  const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
  instructionsSheet['!cols'] = [{ wch: 80 }];
  
  // Agregar hojas al workbook
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla Productos');
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
  
  // Generar buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
} 