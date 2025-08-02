export enum ProductType {
  CONSUMIBLE = 'CONSUMIBLE',
  ALMACENABLE = 'ALMACENABLE',
  SERVICIO = 'SERVICIO',
  INVENTARIO = 'INVENTARIO',
  COMBO = 'COMBO'
}

export interface ProductComponent {
  id: number;
  quantity: number;
  price: number;
}

export interface ProductPOSCategory {
  posCategoryId: number;
  cashRegisterTypeId: number;
}

export interface ProductFormData {
  type: ProductType;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  brand?: string;
  image?: string;
  costPrice?: number;
  salePrice?: number;
  vat?: number;
  categoryId?: number;
  supplierId?: number;
  supplierCode?: string;
  unit?: string; // Unidad de medida del producto
  salesUnitId?: number; // ID de unidad de venta
  purchaseUnitId?: number; // ID de unidad de compra
  usageid?: number;
  stateid?: number;
  marketplaceid?: number;
  invoicepolicyid?: number;
  salelinewarnid?: number;
  stockid?: number;
  storageid?: number;
  acquisitionid?: number;
  isPOSEnabled?: boolean;
  isForSale?: boolean; // 🆕 NUEVO: Indica si el producto es para venta
  posCategoryId?: number;
  posCategories?: ProductPOSCategory[];
  stock?: {
    min: number;
    max: number;
    current: number;
    warehouseid?: number;
  };
  components?: ProductComponent[];
  // Campos específicos para equipos/máquinas (INVENTARIO)
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
}

export interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
} 