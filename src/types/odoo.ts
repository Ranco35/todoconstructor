// Tipos para la integración con Odoo

export interface OdooProduct {
  id: number;
  name: string;
  default_code?: string; // SKU
  barcode?: string;
  description?: string;
  description_sale?: string;
  lst_price: number; // Precio de venta
  standard_price: number; // Precio de costo
  qty_available: number; // Stock disponible
  virtual_available: number; // Stock virtual
  categ_id: [number, string]; // [id, nombre] de la categoría
  seller_ids?: number[]; // IDs de vendedores/proveedores
  image_1920?: string; // Imagen en base64
  image_url?: string; // URL de la imagen
  active: boolean;
  type: 'product' | 'consu' | 'service'; // Tipo de producto en Odoo
  tracking?: 'none' | 'lot' | 'serial'; // Seguimiento
  taxes_id?: number[]; // IDs de impuestos
  supplier_taxes_id?: number[]; // IDs de impuestos de proveedor
  route_ids?: number[]; // Rutas de almacén
  location_id?: number; // Ubicación
  responsible_id?: [number, string]; // Responsable
  company_id: [number, string]; // Compañía
  currency_id: [number, string]; // Moneda
  uom_id: [number, string]; // Unidad de medida
  uom_po_id: [number, string]; // Unidad de medida de compra
  weight?: number; // Peso
  volume?: number; // Volumen
  sale_ok: boolean; // Se puede vender
  purchase_ok: boolean; // Se puede comprar
  create_date: string; // Fecha de creación
  write_date: string; // Fecha de modificación
}

export interface OdooCategory {
  id: number;
  name: string;
  parent_id?: [number, string];
  child_ids?: number[];
  product_count: number;
}

export interface OdooSupplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  vat?: string; // RUT/NIT
  is_company: boolean;
  supplier_rank: number;
  customer_rank: number;
  street?: string;
  city?: string;
  country_id?: [number, string];
  state_id?: [number, string];
  image_1920?: string;
}

export interface OdooSyncConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  database: string;
  lastSync?: Date;
  autoSync: boolean;
  syncInterval: number; // en minutos
}

export interface OdooSyncResult {
  success: boolean;
  message: string;
  stats: {
    productsTotal: number;
    productsCreated: number;
    productsUpdated: number;
    productsErrors: number;
    imagesDownloaded: number;
    categoriesCreated: number;
    suppliersCreated: number;
  };
  errors: string[];
  warnings: string[];
}

// Mapeo de tipos de productos Odoo a tipos locales
export const ODOO_PRODUCT_TYPE_MAPPING = {
  'product': 'ALMACENABLE', // Productos con stock
  'consu': 'CONSUMIBLE',   // Consumibles
  'service': 'SERVICIO'    // Servicios
} as const;

// Configuración por defecto para la conexión con Odoo
export const DEFAULT_ODOO_CONFIG: Partial<OdooSyncConfig> = {
  autoSync: false,
  syncInterval: 60, // 1 hora
  baseUrl: 'https://ranco35-hotelspatermasllifen4-prueba10-21690156.dev.odoo.com'
}; 