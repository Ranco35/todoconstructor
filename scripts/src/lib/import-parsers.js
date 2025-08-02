"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExcel = parseExcel;
exports.parseCategoriesExcel = parseCategoriesExcel;
exports.resolveWarehouseIds = resolveWarehouseIds;
exports.parseCSV = parseCSV;
const XLSX = __importStar(require("xlsx"));
// Función helper para parsear Excel
function parseExcel(fileBuffer) {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'array' });
        // Buscar la hoja de datos (primera hoja o la que tenga "Plantilla" en el nombre)
        let worksheetName = workbook.SheetNames[0];
        for (const sheetName of workbook.SheetNames) {
            if (sheetName.toLowerCase().includes('plantilla') || sheetName.toLowerCase().includes('productos')) {
                worksheetName = sheetName;
                break;
            }
        }
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const products = [];
        for (const row of jsonData) {
            const rowData = row;
            // Parsear bodegas múltiples
            let warehouseNames = undefined;
            if (rowData['Bodegas Asignadas'] !== undefined) {
                warehouseNames = String(rowData['Bodegas Asignadas']).trim();
            }
            else if (rowData['Bodegas'] !== undefined) {
                warehouseNames = String(rowData['Bodegas']).trim();
            }
            else if (rowData['Warehouses'] !== undefined) {
                warehouseNames = String(rowData['Warehouses']).trim();
            }
            else if (rowData['warehouses'] !== undefined) {
                warehouseNames = String(rowData['warehouses']).trim();
            }
            const warehouses = [];
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
            const product = {
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
                costPrice: parseFloat(rowData['Precio Costo'] || rowData['Cost Price'] || rowData['costPrice'] || '0') || undefined,
                salePrice: parseFloat(rowData['Precio Venta'] || rowData['Sale Price'] || rowData['salePrice'] || '0') || undefined,
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
                currentStock: parseInt(rowData['Stock Actual'] || rowData['Current Stock'] || rowData['currentStock'] || '0') || undefined,
                minStock: parseInt(rowData['Stock Mínimo'] || rowData['Min Stock'] || rowData['minStock'] || '0') || undefined,
                maxStock: parseInt(rowData['Stock Máximo'] || rowData['Max Stock'] || rowData['maxStock'] || '0') || undefined,
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
            };
            // Solo agregar productos con nombre válido
            if (product.name.trim()) {
                products.push(product);
            }
        }
        return products;
    }
    catch (error) {
        console.error('Error parseando Excel:', error);
        throw new Error('Error al leer el archivo Excel. Verifique que el formato sea correcto.');
    }
}
// Función helper para parsear Excel de Categorías
function parseCategoriesExcel(fileBuffer) {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'array' });
        let worksheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.some(name => name.toLowerCase().includes('categorias'))) {
            worksheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('categorias'));
        }
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const categories = [];
        for (const row of jsonData) {
            const rowData = row;
            const category = {
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
    }
    catch (error) {
        console.error('Error parseando Excel de categorías:', error);
        throw new Error('Error al leer el archivo Excel. Verifique que el formato de categorías sea correcto.');
    }
}
// Función para resolver IDs de bodegas por nombre
async function resolveWarehouseIds(warehouses, allWarehouses) {
    const resolvedWarehouses = [];
    for (const warehouse of warehouses) {
        // Normalizar ambos nombres para comparar
        const foundWarehouse = allWarehouses.find(w => w.name.trim().toLowerCase() === warehouse.warehouseName.trim().toLowerCase());
        if (foundWarehouse) {
            resolvedWarehouses.push({
                ...warehouse,
                warehouseId: foundWarehouse.id
            });
        }
        else {
            // Mantener sin ID si no se encuentra la bodega
            resolvedWarehouses.push(warehouse);
        }
    }
    return resolvedWarehouses;
}
// Función helper para parsear CSV
function parseCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2)
        return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const products = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const product = {
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
        };
        if (product.name.trim()) {
            products.push(product);
        }
    }
    return products;
}
