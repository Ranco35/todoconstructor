import { OdooProduct, ODOO_PRODUCT_TYPE_MAPPING } from '@/types/odoo';
import { ProductImportData } from '@/lib/import-parsers';

// Función para convertir productos de Odoo al formato interno
export function mapOdooProductToImportData(odooProduct: OdooProduct, downloadedImage?: string | null): ProductImportData {
  // Mapear tipo de producto
  const productType = ODOO_PRODUCT_TYPE_MAPPING[odooProduct.type] || 'ALMACENABLE';
  
  // Extraer nombre de categoría
  const categoryName = Array.isArray(odooProduct.categ_id) && odooProduct.categ_id.length > 1 
    ? odooProduct.categ_id[1] 
    : undefined;

  return {
    id: undefined, // No usar ID de Odoo, dejar que el sistema local asigne
    name: odooProduct.name,
    sku: odooProduct.default_code || undefined,
    barcode: odooProduct.barcode || undefined,
    description: odooProduct.description || odooProduct.description_sale || undefined,
    type: productType,
    salePrice: odooProduct.lst_price || undefined,
    costPrice: odooProduct.standard_price || undefined,
    stock: odooProduct.qty_available || 0,
    categoryName: categoryName,
    image: downloadedImage || undefined,
    // Campos adicionales que podemos mapear
    brand: undefined, // Odoo no tiene campo brand por defecto
    vat: undefined,
    supplierCode: undefined,
    warehouseName: 'Principal', // Asignar a bodega principal por defecto
    warehouses: [{
      warehouseName: 'Principal',
      quantity: odooProduct.qty_available || 0,
      minStock: 5, // Valor por defecto
      maxStock: 100 // Valor por defecto
    }]
  };
} 