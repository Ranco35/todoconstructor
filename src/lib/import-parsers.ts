// Importar XLSX dinámicamente en funciones que lo requieran para evitar bundling global

export interface WarehouseAssignment {
  warehouseName: string;
  warehouseId?: number;
  quantity: number;
  minStock: number;
  maxStock: number;
}

export interface ProductImportData {
  sku?: string;
  name: string;
  type?: string;
  description?: string;
  brand?: string;
  costPrice?: number;
  salePrice?: number;
  vat?: number;
  barcode?: string;
  categoryId?: number;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  // 🔧 AGREGADO: Campos de unidades de medida
  salesUnitId?: number;
  salesUnitName?: string;
  purchaseUnitId?: number;
  purchaseUnitName?: string;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  warehouseId?: number;
  warehouseName?: string;
  servicesSold?: number; // AGREGADO: Contador de servicios vendidos
  // Campos POS
  isPOSEnabled?: boolean; // AGREGADO: Habilitar producto para POS
  posCategoryId?: number; // AGREGADO: ID de categoría POS específica
  posCategoryName?: string; // AGREGADO: Nombre de categoría POS específica
  // Nuevos campos para múltiples bodegas
  warehouses?: WarehouseAssignment[];
  warehouseNames?: string; // Lista separada por comas para Excel
  // Campos de Equipos
  isEquipment?: boolean;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiration?: string;
  usefulLife?: number;
  maintenanceInterval?: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceCost?: number;
  maintenanceProvider?: string;
  currentLocation?: string;
  responsiblePerson?: string;
  operationalStatus?: string;
  unit?: string; // Unidad de medida del producto
  salesunitid?: number; // ID de unidad de venta
  purchaseunitid?: number; // ID de unidad de compra
  isForSale?: boolean; // 🆕 NUEVO: Indica si el producto es para venta
}

export interface CategoryImportData {
  id?: number;
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
}

// Función helper para parsear Excel
export function parseExcel(fileBuffer: ArrayBuffer): ProductImportData[] {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    // Log hojas detectadas
    console.log('🔍 [PARSER] Hojas detectadas:', workbook.SheetNames);
    // Buscar la hoja de datos (primera hoja o la que tenga "Plantilla" en el nombre)
    let worksheetName = workbook.SheetNames[0];
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('plantilla') || sheetName.toLowerCase().includes('productos')) {
        worksheetName = sheetName;
        break;
      }
    }
    console.log('🔍 [PARSER] Usando hoja:', worksheetName);
    const worksheet = workbook.Sheets[worksheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    // Log headers detectados
    if (jsonData.length > 0) {
      console.log('🔍 [PARSER] Headers detectados:', Object.keys(jsonData[0]));
    } else {
      console.log('🔍 [PARSER] No se detectaron filas de datos en la hoja.');
    }
    const products: ProductImportData[] = [];
    
    for (const row of jsonData) {
      const rowData = row as any;
      
      // Parsear bodegas múltiples
      let warehouseNames = undefined;
      if (rowData['Bodegas Asignadas'] !== undefined) {
        warehouseNames = String(rowData['Bodegas Asignadas']).trim();
      } else if (rowData['Bodegas'] !== undefined) {
        warehouseNames = String(rowData['Bodegas']).trim();
      } else if (rowData['Warehouses'] !== undefined) {
        warehouseNames = String(rowData['Warehouses']).trim();
      } else if (rowData['warehouses'] !== undefined) {
        warehouseNames = String(rowData['warehouses']).trim();
      }
      
      const warehouses: WarehouseAssignment[] = [];
      
      if (warehouseNames) {
        // Normalizar y separar por coma o punto y coma
        const warehouseList = warehouseNames.split(/[,;]/)
          .map(w => w.trim().toLowerCase())
          .filter(w => w);
        
        for (const warehouseNameRaw of warehouseList) {
          // Buscar stock específico para esta bodega (usando nombre original y normalizado)
          // Permite que 'Comedor', 'comedor', 'Comedor ' sean equivalentes
          const warehouseName = warehouseNameRaw;
          // Buscar claves de stock con cualquier variante de mayúsculas/espacios
          const stockKey = Object.keys(rowData).find(k => k.replace(/\s+/g, '').toLowerCase() === `stock${warehouseName}`.replace(/\s+/g, ''));
          const minStockKey = Object.keys(rowData).find(k => k.replace(/\s+/g, '').toLowerCase() === `min${warehouseName}`.replace(/\s+/g, ''));
          const maxStockKey = Object.keys(rowData).find(k => k.replace(/\s+/g, '').toLowerCase() === `max${warehouseName}`.replace(/\s+/g, ''));
          const quantity = parseInt((stockKey && rowData[stockKey]) || '0') || 0;
          const minStock = parseInt((minStockKey && rowData[minStockKey]) || '0') || 0;
          const maxStock = parseInt((maxStockKey && rowData[maxStockKey]) || '100') || 100;
          
          warehouses.push({
            warehouseName,
            quantity,
            minStock,
            maxStock
          });
        }
      }
      
      // Si NO hay bodegas asignadas, usar columnas individuales (solo si no hay 'Bodegas Asignadas')
      if (!warehouseNames && (rowData['Bodega'] || rowData['Warehouse'] || rowData['warehouse'])) {
        const warehouseName = String(rowData['Bodega'] || rowData['Warehouse'] || rowData['warehouse']).trim().toLowerCase();
        const warehouseId = parseInt(rowData['ID Bodega'] || rowData['Warehouse ID'] || rowData['warehouseId'] || '0') || undefined;
        const quantity = parseInt(rowData['Stock Actual'] || rowData['Current Stock'] || rowData['currentStock'] || '0') || 0;
        const minStock = parseInt(rowData['Stock Mínimo'] || rowData['Min Stock'] || rowData['minStock'] || '0') || 0;
        const maxStock = parseInt(rowData['Stock Máximo'] || rowData['Max Stock'] || rowData['maxStock'] || '0') || 0;
        warehouses.push({
          warehouseName,
          warehouseId,
          quantity,
          minStock,
          maxStock
        });
      }
      
      // Mapear campos usando nombres en español e inglés
      const product: ProductImportData = {
        sku: rowData['SKU'] !== undefined ? String(rowData['SKU']).trim() : 
             rowData['sku'] !== undefined ? String(rowData['sku']).trim() : undefined,
        name: rowData['Nombre'] !== undefined ? String(rowData['Nombre']).trim() : 
              rowData['Name'] !== undefined ? String(rowData['Name']).trim() : 
              rowData['name'] !== undefined ? String(rowData['name']).trim() : '',
        type: rowData['Tipo Producto'] !== undefined ? String(rowData['Tipo Producto']).trim() : 
              rowData['Tipo'] !== undefined ? String(rowData['Tipo']).trim() : 
              rowData['Type'] !== undefined ? String(rowData['Type']).trim() : 
              rowData['type'] !== undefined ? String(rowData['type']).trim() : undefined,
        description: rowData['Descripción'] !== undefined ? String(rowData['Descripción']).trim() : 
                     rowData['Description'] !== undefined ? String(rowData['Description']).trim() : 
                     rowData['description'] !== undefined ? String(rowData['description']).trim() : undefined,
        brand: rowData['Marca'] !== undefined && rowData['Marca'] !== '' ? String(rowData['Marca']).trim() : 
               rowData['Brand'] !== undefined && rowData['Brand'] !== '' ? String(rowData['Brand']).trim() : 
               rowData['brand'] !== undefined && rowData['brand'] !== '' ? String(rowData['brand']).trim() : undefined,
        costPrice: parseFloat(rowData['Precio Costo'] || rowData['P. Costo'] || rowData['Cost Price'] || rowData['costPrice'] || '0') || undefined,
        salePrice: parseFloat(rowData['Precio Venta'] || rowData['P. Venta'] || rowData['Sale Price'] || rowData['salePrice'] || '0') || undefined,
        vat: parseFloat(rowData['IVA (%)'] || rowData['VAT (%)'] || rowData['vat'] || '0') || undefined,
        barcode: rowData['Código Barras'] !== undefined ? String(rowData['Código Barras']).trim() : 
                 rowData['Barcode'] !== undefined ? String(rowData['Barcode']).trim() : 
                 rowData['barcode'] !== undefined ? String(rowData['barcode']).trim() : undefined,
        categoryName: rowData['Categoría'] !== undefined ? String(rowData['Categoría']).trim() : 
                      rowData['Category'] !== undefined ? String(rowData['Category']).trim() : 
                      rowData['category'] !== undefined ? String(rowData['category']).trim() : undefined,
        categoryId: parseInt(rowData['ID Categoría'] || rowData['Category ID'] || rowData['categoryId'] || '0') || undefined,
        supplierName: rowData['Proveedor'] !== undefined ? String(rowData['Proveedor']).trim() : 
                      rowData['Supplier'] !== undefined ? String(rowData['Supplier']).trim() : 
                      rowData['supplier'] !== undefined ? String(rowData['supplier']).trim() : undefined,
        supplierId: parseInt(rowData['ID Proveedor'] || rowData['Supplier ID'] || rowData['supplierId'] || '0') || undefined,
        // 🔧 AGREGADO: Campos de unidades de medida
        salesUnitName: rowData['Unidad Venta'] !== undefined ? String(rowData['Unidad Venta']).trim() : 
                       rowData['Sales Unit'] !== undefined ? String(rowData['Sales Unit']).trim() : 
                       rowData['salesUnitName'] !== undefined ? String(rowData['salesUnitName']).trim() : undefined,
        salesUnitId: parseInt(rowData['ID Unidad Venta'] || rowData['Sales Unit ID'] || rowData['salesUnitId'] || '0') || undefined,
        purchaseUnitName: rowData['Unidad Compra'] !== undefined ? String(rowData['Unidad Compra']).trim() : 
                          rowData['Purchase Unit'] !== undefined ? String(rowData['Purchase Unit']).trim() : 
                          rowData['purchaseUnitName'] !== undefined ? String(rowData['purchaseUnitName']).trim() : undefined,
        purchaseUnitId: parseInt(rowData['ID Unidad Compra'] || rowData['Purchase Unit ID'] || rowData['purchaseUnitId'] || '0') || undefined,
        currentStock: parseInt(rowData['Stock Actual'] || rowData['Current Stock'] || rowData['currentStock'] || '0') || undefined,
        minStock: parseInt(rowData['Stock Mínimo'] || rowData['Min Stock'] || rowData['minStock'] || '0') || undefined,
        maxStock: parseInt(rowData['Stock Máximo'] || rowData['Max Stock'] || rowData['maxStock'] || '0') || undefined,
        servicesSold: parseInt(rowData['Servicios Vendidos'] || rowData['Services Sold'] || rowData['servicesSold'] || '0') || undefined,
        // Campos POS
        isPOSEnabled: rowData['Punto de Venta'] !== undefined ? 
                      (String(rowData['Punto de Venta']).toUpperCase() === 'SI' || 
                       String(rowData['Punto de Venta']).toUpperCase() === 'YES' || 
                       String(rowData['Punto de Venta']).toUpperCase() === 'TRUE' || 
                       String(rowData['Punto de Venta']).toUpperCase() === '1') : 
                      rowData['POS Enabled'] !== undefined ? 
                      (String(rowData['POS Enabled']).toUpperCase() === 'SI' || 
                       String(rowData['POS Enabled']).toUpperCase() === 'YES' || 
                       String(rowData['POS Enabled']).toUpperCase() === 'TRUE' || 
                       String(rowData['POS Enabled']).toUpperCase() === '1') : 
                      rowData['isPOSEnabled'] !== undefined ? 
                      (String(rowData['isPOSEnabled']).toUpperCase() === 'SI' || 
                       String(rowData['isPOSEnabled']).toUpperCase() === 'YES' || 
                       String(rowData['isPOSEnabled']).toUpperCase() === 'TRUE' || 
                       String(rowData['isPOSEnabled']).toUpperCase() === '1') : false,
        posCategoryName: rowData['Categoría POS'] !== undefined ? String(rowData['Categoría POS']).trim() : 
                         rowData['POS Category'] !== undefined ? String(rowData['POS Category']).trim() : 
                         rowData['posCategoryName'] !== undefined ? String(rowData['posCategoryName']).trim() : undefined,
        posCategoryId: parseInt(rowData['ID Categoría POS'] || rowData['POS Category ID'] || rowData['posCategoryId'] || '0') || undefined,
        warehouseName: rowData['Bodega'] !== undefined ? String(rowData['Bodega']).trim().toLowerCase() : 
                       rowData['Warehouse'] !== undefined ? String(rowData['Warehouse']).trim().toLowerCase() : 
                       rowData['warehouse'] !== undefined ? String(rowData['warehouse']).trim().toLowerCase() : undefined,
        warehouseId: parseInt(rowData['ID Bodega'] || rowData['Warehouse ID'] || rowData['warehouseId'] || '0') || undefined,
        // Siempre generar el array warehouses
        warehouses: warehouses.length > 0 ? warehouses : undefined,
        warehouseNames: warehouseNames,
        // Campos de Equipos - usando nombres exactos de la plantilla
        isEquipment: rowData['Es Equipo'] ? (String(rowData['Es Equipo']).toUpperCase() === 'SI' || String(rowData['Es Equipo']).toUpperCase() === 'YES') : false,
        model: rowData['Modelo'] !== undefined ? String(rowData['Modelo']).trim() : undefined,
        serialNumber: rowData['Número Serie'] !== undefined ? String(rowData['Número Serie']).trim() : undefined,
        purchaseDate: rowData['Fecha Compra'] !== undefined ? String(rowData['Fecha Compra']).trim() : undefined,
        warrantyExpiration: rowData['Garantía Hasta'] !== undefined ? String(rowData['Garantía Hasta']).trim() : undefined,
        usefulLife: rowData['Vida Útil (años)'] !== undefined ? Number(rowData['Vida Útil (años)']) : undefined,
        maintenanceInterval: rowData['Intervalo Mantenimiento (días)'] !== undefined ? Number(rowData['Intervalo Mantenimiento (días)']) : undefined,
        lastMaintenance: rowData['Último Mantenimiento'] !== undefined ? String(rowData['Último Mantenimiento']).trim() : undefined,
        nextMaintenance: rowData['Próximo Mantenimiento'] !== undefined ? String(rowData['Próximo Mantenimiento']).trim() : undefined,
        maintenanceCost: rowData['Costo Mantenimiento'] !== undefined ? Number(rowData['Costo Mantenimiento']) : undefined,
        maintenanceProvider: rowData['Proveedor Mantenimiento'] !== undefined ? String(rowData['Proveedor Mantenimiento']).trim() : undefined,
        currentLocation: rowData['Ubicación Actual'] !== undefined ? String(rowData['Ubicación Actual']).trim() : undefined,
        responsiblePerson: rowData['Responsable'] !== undefined ? String(rowData['Responsable']).trim() : undefined,
        operationalStatus: rowData['Estado Operacional'] !== undefined ? String(rowData['Estado Operacional']).trim() : undefined,
        // Campos de unidades
        unit: rowData['Unidad'] !== undefined ? String(rowData['Unidad']).trim() : 
              rowData['Unit'] !== undefined ? String(rowData['Unit']).trim() : 
              rowData['unit'] !== undefined ? String(rowData['unit']).trim() : 'UND',
        salesunitid: parseInt(rowData['ID Unidad Venta'] || rowData['Sales Unit ID'] || rowData['salesunitid'] || '1') || 1,
        purchaseunitid: parseInt(rowData['ID Unidad Compra'] || rowData['Purchase Unit ID'] || rowData['purchaseunitid'] || '1') || 1,
        // Campo para venta
        isForSale: rowData['Es para Venta'] !== undefined ? 
                   (String(rowData['Es para Venta']).toUpperCase() === 'SI' || 
                    String(rowData['Es para Venta']).toUpperCase() === 'YES' || 
                    String(rowData['Es para Venta']).toUpperCase() === 'TRUE' || 
                    String(rowData['Es para Venta']).toUpperCase() === '1') : 
                   rowData['Is For Sale'] !== undefined ? 
                   (String(rowData['Is For Sale']).toUpperCase() === 'SI' || 
                    String(rowData['Is For Sale']).toUpperCase() === 'YES' || 
                    String(rowData['Is For Sale']).toUpperCase() === 'TRUE' || 
                    String(rowData['Is For Sale']).toUpperCase() === '1') : 
                   rowData['isForSale'] !== undefined ? 
                   (String(rowData['isForSale']).toUpperCase() === 'SI' || 
                    String(rowData['isForSale']).toUpperCase() === 'YES' || 
                    String(rowData['isForSale']).toUpperCase() === 'TRUE' || 
                    String(rowData['isForSale']).toUpperCase() === '1') : true, // Por defecto es para venta
      };

      // Solo agregar productos con nombre válido
      if (product.name.trim()) {
        products.push(product);
        // Log producto parseado
        console.log('🔍 [PARSER] Producto parseado:', product.name, '| SKU:', product.sku, '| Bodegas:', product.warehouses?.map(w => w.warehouseName));
      }
    }

    return products;
  } catch (error) {
    console.error('Error parseando Excel:', error);
    throw new Error('Error al leer el archivo Excel. Verifique que el formato sea correcto.');
  }
}

// Función helper para parsear Excel de Categorías
export function parseCategoriesExcel(fileBuffer: ArrayBuffer): CategoryImportData[] {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    
    let worksheetName = workbook.SheetNames[0];
    if (workbook.SheetNames.some(name => name.toLowerCase().includes('categorias'))) {
      worksheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('categorias'))!;
    }
    
    const worksheet = workbook.Sheets[worksheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const categories: CategoryImportData[] = [];
    
    for (const row of jsonData) {
      const rowData = row as any;
      
      const category: CategoryImportData = {
        id: rowData['ID'] !== undefined && rowData['ID'] !== '' ? Number(rowData['ID']) : undefined,
        name: rowData['Nombre Categoria'] !== undefined ? String(rowData['Nombre Categoria']).trim() :
              rowData['Name'] !== undefined ? String(rowData['Name']).trim() : '',
        description: rowData['Descripcion'] !== undefined ? String(rowData['Descripcion']).trim() :
                     rowData['Description'] !== undefined ? String(rowData['Description']).trim() : undefined,
        parentId: rowData['ID Categoria Padre'] !== undefined && rowData['ID Categoria Padre'] !== '' ? Number(rowData['ID Categoria Padre']) : undefined,
        parentName: rowData['Nombre Categoria Padre'] !== undefined ? String(rowData['Nombre Categoria Padre']).trim() : undefined,
      };

      // Si parentId resulta en NaN (porque se puso un nombre en la columna de ID), lo movemos a parentName
      if (category.parentId && isNaN(category.parentId)) {
          const originalParentValue = String(rowData['ID Categoria Padre']).trim();
          if (originalParentValue) {
            category.parentName = originalParentValue;
          }
          category.parentId = undefined;
      }
      
      if (category.name.trim()) {
        categories.push(category);
      }
    }

    return categories;
  } catch (error) {
    console.error('Error parseando Excel de categorías:', error);
    throw new Error('Error al leer el archivo Excel. Verifique que el formato de categorías sea correcto.');
  }
}

// Función para resolver IDs de bodegas por nombre
export function resolveWarehouseIds(warehouseNames: string[], allWarehouses: any[]): number[] {
  console.log('🔍 [RESOLVER] Resolviendo bodegas:', warehouseNames, 'contra BD:', allWarehouses.map(w => ({ id: w.id, name: w.name })));
  
  if (!warehouseNames || warehouseNames.length === 0) {
    return [];
  }
  
  const resolvedIds: number[] = [];
  
  for (const warehouseName of warehouseNames) {
    if (!warehouseName || warehouseName.trim() === '') {
      continue;
    }
    
    const trimmedName = warehouseName.trim();
    
    // Verificar si es un ID numérico
    const numericId = parseInt(trimmedName);
    if (!isNaN(numericId) && numericId > 0) {
      // Es un ID numérico, verificar que existe en la BD
      const warehouseExists = allWarehouses.find(w => w.id === numericId);
      if (warehouseExists) {
        console.log(`✅ [RESOLVER] Bodega encontrada por ID: ${numericId} (${warehouseExists.name})`);
        resolvedIds.push(numericId);
      } else {
        console.log(`❌ [RESOLVER] ID de bodega no existe: ${numericId}`);
      }
      continue;
    }
    
    // Si no es ID numérico, buscar por nombre
    const normalizedSearchName = trimmedName.toLowerCase();
    const warehouse = allWarehouses.find(w => 
      w.name.trim().toLowerCase() === normalizedSearchName
    );
    
    if (warehouse) {
      console.log(`✅ [RESOLVER] Bodega encontrada por nombre: "${trimmedName}" -> ID ${warehouse.id}`);
      resolvedIds.push(warehouse.id);
    } else {
      console.log(`❌ [RESOLVER] Bodega no encontrada: "${trimmedName}"`);
    }
  }
  
  console.log(`🔍 [RESOLVER] IDs resueltos: [${resolvedIds.join(', ')}]`);
  return resolvedIds;
}

// Función helper para parsear CSV
export function parseCSV(csvContent: string): ProductImportData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const products: ProductImportData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    
    const product: ProductImportData = {
      sku: values[headers.indexOf('SKU')] !== undefined ? String(values[headers.indexOf('SKU')]).trim() : undefined,
      name: values[headers.indexOf('Nombre')] !== undefined ? String(values[headers.indexOf('Nombre')]).trim() : '',
      type: values[headers.indexOf('Tipo Producto')] !== undefined ? String(values[headers.indexOf('Tipo Producto')]).trim() : undefined,
      description: values[headers.indexOf('Descripción')] !== undefined ? String(values[headers.indexOf('Descripción')]).trim() : undefined,
      brand: values[headers.indexOf('Marca')] !== undefined ? String(values[headers.indexOf('Marca')]).trim() : undefined,
      costPrice: parseFloat(values[headers.indexOf('Precio Costo')]) || undefined,
      salePrice: parseFloat(values[headers.indexOf('Precio Venta')]) || undefined,
      vat: parseFloat(values[headers.indexOf('IVA (%)')]) || undefined,
      barcode: values[headers.indexOf('Código Barras')] !== undefined ? String(values[headers.indexOf('Código Barras')]).trim() : undefined,
      categoryName: values[headers.indexOf('Categoría')] !== undefined ? String(values[headers.indexOf('Categoría')]).trim() : undefined,
      categoryId: parseInt(values[headers.indexOf('ID Categoría')]) || undefined,
      supplierName: values[headers.indexOf('Proveedor')] !== undefined ? String(values[headers.indexOf('Proveedor')]).trim() : undefined,
      supplierId: parseInt(values[headers.indexOf('ID Proveedor')]) || undefined,
      currentStock: parseInt(values[headers.indexOf('Stock Actual')]) || undefined,
      minStock: parseInt(values[headers.indexOf('Stock Mínimo')]) || undefined,
      maxStock: parseInt(values[headers.indexOf('Stock Máximo')]) || undefined,
      warehouseName: values[headers.indexOf('Bodega')] !== undefined ? String(values[headers.indexOf('Bodega')]).trim() : undefined,
      warehouseId: parseInt(values[headers.indexOf('ID Bodega')]) || undefined,
      isEquipment: values[headers.indexOf('Equipo')] !== undefined ? Boolean(values[headers.indexOf('Equipo')]) : undefined,
      model: values[headers.indexOf('Modelo')] !== undefined ? String(values[headers.indexOf('Modelo')]).trim() : undefined,
      serialNumber: values[headers.indexOf('Número de Serie')] !== undefined ? String(values[headers.indexOf('Número de Serie')]).trim() : undefined,
      purchaseDate: values[headers.indexOf('Fecha de Compra')] !== undefined ? String(values[headers.indexOf('Fecha de Compra')]).trim() : undefined,
      warrantyExpiration: values[headers.indexOf('Vencimiento de Garantía')] !== undefined ? String(values[headers.indexOf('Vencimiento de Garantía')]).trim() : undefined,
      usefulLife: values[headers.indexOf('Vida Útil')] !== undefined ? Number(values[headers.indexOf('Vida Útil')]) : undefined,
      maintenanceInterval: values[headers.indexOf('Intervalo de Mantenimiento')] !== undefined ? Number(values[headers.indexOf('Intervalo de Mantenimiento')]) : undefined,
      lastMaintenance: values[headers.indexOf('Última Mantenimiento')] !== undefined ? String(values[headers.indexOf('Última Mantenimiento')]).trim() : undefined,
      nextMaintenance: values[headers.indexOf('Próximo Mantenimiento')] !== undefined ? String(values[headers.indexOf('Próximo Mantenimiento')]).trim() : undefined,
      maintenanceCost: values[headers.indexOf('Costo de Mantenimiento')] !== undefined ? Number(values[headers.indexOf('Costo de Mantenimiento')]) : undefined,
      maintenanceProvider: values[headers.indexOf('Proveedor de Mantenimiento')] !== undefined ? String(values[headers.indexOf('Proveedor de Mantenimiento')]).trim() : undefined,
      currentLocation: values[headers.indexOf('Ubicación Actual')] !== undefined ? String(values[headers.indexOf('Ubicación Actual')]).trim() : undefined,
      responsiblePerson: values[headers.indexOf('Persona Responsable')] !== undefined ? String(values[headers.indexOf('Persona Responsable')]).trim() : undefined,
      operationalStatus: values[headers.indexOf('Estado Operativo')] !== undefined ? String(values[headers.indexOf('Estado Operativo')]).trim() : undefined,
      isForSale: values[headers.indexOf('Es para Venta')] !== undefined ? 
                 (String(values[headers.indexOf('Es para Venta')]).toUpperCase() === 'SI' || 
                  String(values[headers.indexOf('Es para Venta')]).toUpperCase() === 'YES' || 
                  String(values[headers.indexOf('Es para Venta')]).toUpperCase() === 'TRUE' || 
                  String(values[headers.indexOf('Es para Venta')]).toUpperCase() === '1') : true, // Por defecto es para venta
    };

    if (product.name.trim()) {
      products.push(product);
    }
  }

  return products;
} 