/**
 * Utilidades para mapear campos de productos entre snake_case (BD) y camelCase (Frontend)
 */

// Tipos para los datos de la base de datos (snake_case)
export interface ProductDB {
  id: number;
  name: string;
  type?: string | null;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  categoryid?: number | null;
  supplierid?: number | null;
  brand?: string | null;
  unit?: string | null; // Unidad de medida del producto
  salesunitid?: number | null; // ID de unidad de venta
  purchaseunitid?: number | null; // ID de unidad de compra
  image?: string | null;
  costprice?: number | null;
  saleprice?: number | null;
  vat?: number | null;
  finalPrice?: number | null; // 🆕 NUEVO: Precio final congelado con IVA incluido
  supplierCode?: string | null;
  defaultCostCenterId?: number | null;
  servicesSold?: number | null; // AGREGADO: Contador de servicios vendidos
  isPOSEnabled?: boolean | null; // AGREGADO: Campo para habilitar en POS
  isForSale?: boolean | null; // 🆕 NUEVO: Indica si el producto es para venta
  createdAt?: string | null;
  updatedAt?: string | null;
  Category?: { id: number; name: string } | null;
  Supplier?: { id: number; name: string } | null;
  Warehouse_Products?: WarehouseProductDB[] | null;
}

// Tipos para los datos del frontend (camelCase)
export interface ProductFrontend {
  id: number;
  name: string;
  type?: string | null;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  categoryId?: number | null;
  supplierId?: number | null;
  brand?: string | null;
  unit?: string | null; // Unidad de medida del producto
  salesUnitId?: number | null; // ID de unidad de venta
  purchaseUnitId?: number | null; // ID de unidad de compra
  image?: string | null;
  costPrice?: number | null;
  salePrice?: number | null;
  vat?: number | null;
  finalPrice?: number | null; // 🆕 NUEVO: Precio final congelado con IVA incluido
  supplierCode?: string | null;
  defaultCostCenterId?: number | null;
  servicesSold?: number | null; // AGREGADO: Contador de servicios vendidos
  isPOSEnabled?: boolean | null; // AGREGADO: Campo para habilitar en POS
  isForSale?: boolean | null; // 🆕 NUEVO: Indica si el producto es para venta
  createdAt?: string | null;
  updatedAt?: string | null;
  isActive?: boolean; // AGREGADO: Estado activo del producto
  Category?: { id: number; name: string } | null;
  Supplier?: { id: number; name: string } | null;
  Warehouse_Products?: WarehouseProductFrontend[] | null;
}

// Tipos para Warehouse_Product
export interface WarehouseProductDB {
  id: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  minStock?: number | null;
  maxStock?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  Warehouse?: { id: number; name: string } | null;
}

export interface WarehouseProductFrontend {
  id: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  minStock?: number | null;
  maxStock?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  Warehouse?: { id: number; name: string } | null;
}

/**
 * Mapea un producto de la base de datos (snake_case) al frontend (camelCase)
 */
export function mapProductDBToFrontend(product: ProductDB): ProductFrontend {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    sku: product.sku,
    barcode: product.barcode,
    description: product.description,
    categoryId: product.categoryid,
    supplierId: product.supplierid,
    brand: product.brand,
    unit: product.unit,
    salesUnitId: product.salesunitid, // Mapear unidad de venta
    purchaseUnitId: product.purchaseunitid, // Mapear unidad de compra
    image: product.image,
    costPrice: product.costprice,
    salePrice: product.saleprice,
    vat: product.vat,
    finalPrice: product.finalPrice, // 🆕 NUEVO: Mapear precio final congelado
    supplierCode: product.supplierCode,
    defaultCostCenterId: product.defaultCostCenterId,
    servicesSold: product.servicesSold, // AGREGADO: Mapear contador de servicios
    isPOSEnabled: product.isPOSEnabled, // AGREGADO: Mapear campo POS
    isForSale: product.isForSale, // 🆕 NUEVO: Mapear campo isForSale
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    isActive: true, // AGREGADO: Por defecto todos los productos están activos
    Category: product.Category,
    Supplier: product.Supplier,
    Warehouse_Products: product.Warehouse_Products?.map(mapWarehouseProductDBToFrontend) || null,
  };
}

/**
 * Mapea un producto del frontend (camelCase) a la base de datos (snake_case)
 */
export function mapProductFrontendToDB(product: ProductFrontend): ProductDB {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    sku: product.sku,
    barcode: product.barcode,
    description: product.description,
    categoryid: product.categoryId,
    supplierid: product.supplierId,
    brand: product.brand,
    unit: product.unit,
    salesunitid: product.salesUnitId, // Mapear unidad de venta
    purchaseunitid: product.purchaseUnitId, // Mapear unidad de compra
    image: product.image,
    costprice: product.costPrice,
    saleprice: product.salePrice,
    vat: product.vat,
    finalPrice: product.finalPrice, // 🆕 NUEVO: Mapear precio final congelado
    supplierCode: product.supplierCode,
    defaultCostCenterId: product.defaultCostCenterId,
    servicesSold: product.servicesSold, // AGREGADO: Mapear contador de servicios
    isPOSEnabled: product.isPOSEnabled, // AGREGADO: Mapear campo POS
    isForSale: product.isForSale, // 🆕 NUEVO: Mapear campo isForSale
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    // Nota: isActive no se mapea a BD porque la tabla Product no tiene este campo
    Category: product.Category,
    Supplier: product.Supplier,
    Warehouse_Products: product.Warehouse_Products?.map(mapWarehouseProductFrontendToDB) || null,
  };
}

/**
 * Mapea un Warehouse_Product de la base de datos al frontend
 */
export function mapWarehouseProductDBToFrontend(wp: WarehouseProductDB): WarehouseProductFrontend {
  return {
    id: wp.id,
    warehouseId: wp.warehouseId,
    productId: wp.productId,
    quantity: wp.quantity,
    minStock: wp.minStock,
    maxStock: wp.maxStock,
    createdAt: wp.createdAt,
    updatedAt: wp.updatedAt,
    Warehouse: wp.Warehouse,
  };
}

/**
 * Mapea un Warehouse_Product del frontend a la base de datos
 */
export function mapWarehouseProductFrontendToDB(wp: WarehouseProductFrontend): WarehouseProductDB {
  return {
    id: wp.id,
    warehouseId: wp.warehouseId,
    productId: wp.productId,
    quantity: wp.quantity,
    minStock: wp.minStock,
    maxStock: wp.maxStock,
    createdAt: wp.createdAt,
    updatedAt: wp.updatedAt,
    Warehouse: wp.Warehouse,
  };
}

/**
 * Mapea un array de productos de la base de datos al frontend
 */
export function mapProductsDBToFrontend(products: ProductDB[]): ProductFrontend[] {
  return products.map(mapProductDBToFrontend);
}

/**
 * Mapea un array de productos del frontend a la base de datos
 */
export function mapProductsFrontendToDB(products: ProductFrontend[]): ProductDB[] {
  return products.map(mapProductFrontendToDB);
}

/**
 * Mapea datos de formulario (FormData) a un objeto de producto para la base de datos
 */
export function mapFormDataToProductDB(formData: FormData): Partial<ProductDB> {
  const productData: Partial<ProductDB> = {};
  
  // Campos básicos
  const name = formData.get('name') as string;
  if (name) productData.name = name;
  
  const type = formData.get('type') as string;
  if (type) productData.type = type;
  
  const sku = formData.get('sku') as string;
  if (sku) productData.sku = sku;
  
  const barcode = formData.get('barcode') as string;
  if (barcode) productData.barcode = barcode;
  
  const description = formData.get('description') as string;
  if (description) productData.description = description;
  
  const brand = formData.get('brand') as string;
  if (brand) productData.brand = brand;
  
  const unit = formData.get('unit') as string;
  if (unit) productData.unit = unit;
  
  const supplierCode = formData.get('supplierCode') as string;
  if (supplierCode) productData.supplierCode = supplierCode;
  
  // Campos numéricos
  const categoryId = formData.get('categoryId') as string;
  if (categoryId && categoryId.trim() !== '') {
    productData.categoryid = parseInt(categoryId);
  }
  
  const supplierId = formData.get('supplierId') as string;
  if (supplierId && supplierId.trim() !== '') {
    productData.supplierid = parseInt(supplierId);
  }
  
  // 🔧 AGREGADO: Campos de unidades de medida
  const salesUnitId = formData.get('salesUnitId') as string;
  if (salesUnitId && salesUnitId.trim() !== '') {
    productData.salesunitid = parseInt(salesUnitId);
  }
  
  const purchaseUnitId = formData.get('purchaseUnitId') as string;
  if (purchaseUnitId && purchaseUnitId.trim() !== '') {
    productData.purchaseunitid = parseInt(purchaseUnitId);
  }
  
  const costPrice = formData.get('costPrice') as string;
  if (costPrice && costPrice.trim() !== '') {
    productData.costprice = parseFloat(costPrice);
  }
  
  const salePrice = formData.get('salePrice') as string;
  if (salePrice && salePrice.trim() !== '') {
    productData.saleprice = parseFloat(salePrice);
  }
  
  const vat = formData.get('vat') as string;
  if (vat && vat.trim() !== '') {
    productData.vat = parseFloat(vat);
  }
  
  const defaultCostCenterId = formData.get('defaultCostCenterId') as string;
  if (defaultCostCenterId && defaultCostCenterId.trim() !== '') {
    productData.defaultCostCenterId = parseInt(defaultCostCenterId);
  }
  
  // Campo booleano para POS
  const isPOSEnabled = formData.get('isPOSEnabled') as string;
  if (isPOSEnabled !== null) {
    productData.isPOSEnabled = isPOSEnabled === 'true';
  }

  // Campo booleano para isForSale
  const isForSale = formData.get('isForSale') as string;
  if (isForSale !== null) {
    productData.isForSale = isForSale === 'true';
  }
  
  return productData;
}

/**
 * Mapea datos de formulario (FormData) a un objeto de producto para el frontend
 */
export function mapFormDataToProductFrontend(formData: FormData): Partial<ProductFrontend> {
  const productData: Partial<ProductFrontend> = {};
  
  // Campos básicos
  const name = formData.get('name') as string;
  if (name) productData.name = name;
  
  const type = formData.get('type') as string;
  if (type) productData.type = type;
  
  const sku = formData.get('sku') as string;
  if (sku) productData.sku = sku;
  
  const barcode = formData.get('barcode') as string;
  if (barcode) productData.barcode = barcode;
  
  const description = formData.get('description') as string;
  if (description) productData.description = description;
  
  const brand = formData.get('brand') as string;
  if (brand) productData.brand = brand;
  
  const unit = formData.get('unit') as string;
  if (unit) productData.unit = unit;
  
  const image = formData.get('image') as string;
  if (image) productData.image = image;
  
  const supplierCode = formData.get('supplierCode') as string;
  if (supplierCode) productData.supplierCode = supplierCode;
  
  // Campos numéricos
  const categoryId = formData.get('categoryId') as string;
  if (categoryId && categoryId.trim() !== '') {
    productData.categoryId = parseInt(categoryId);
  }
  
  const supplierId = formData.get('supplierId') as string;
  if (supplierId && supplierId.trim() !== '') {
    productData.supplierId = parseInt(supplierId);
  }
  
  // 🔧 AGREGADO: Campos de unidades de medida
  const salesUnitId = formData.get('salesUnitId') as string;
  if (salesUnitId && salesUnitId.trim() !== '') {
    productData.salesUnitId = parseInt(salesUnitId);
  }
  
  const purchaseUnitId = formData.get('purchaseUnitId') as string;
  if (purchaseUnitId && purchaseUnitId.trim() !== '') {
    productData.purchaseUnitId = parseInt(purchaseUnitId);
  }
  
  const costPrice = formData.get('costPrice') as string;
  if (costPrice && costPrice.trim() !== '') {
    productData.costPrice = parseFloat(costPrice);
  }
  
  const salePrice = formData.get('salePrice') as string;
  if (salePrice && salePrice.trim() !== '') {
    productData.salePrice = parseFloat(salePrice);
  }
  
  const vat = formData.get('vat') as string;
  if (vat && vat.trim() !== '') {
    productData.vat = parseFloat(vat);
  }
  
  const defaultCostCenterId = formData.get('defaultCostCenterId') as string;
  if (defaultCostCenterId && defaultCostCenterId.trim() !== '') {
    productData.defaultCostCenterId = parseInt(defaultCostCenterId);
  }
  
  // Campo booleano para POS
  const isPOSEnabled = formData.get('isPOSEnabled') as string;
  if (isPOSEnabled !== null) {
    productData.isPOSEnabled = isPOSEnabled === 'true';
  }

  // Campo booleano para isForSale
  const isForSale = formData.get('isForSale') as string;
  if (isForSale !== null) {
    productData.isForSale = isForSale === 'true';
  }
  
  return productData;
} 