// --- OBTENER TIPOS DE BODEGA ---
export const WAREHOUSE_TYPES = [
  { value: 'VENTA', label: 'Venta' },
  { value: 'INVENTARIO', label: 'Inventario' },
  { value: 'ALMACENAJE', label: 'Bodega de Almacenaje' },
  { value: 'CONSUMO_INTERNO', label: 'Consumo Interno' },
  { value: 'PRODUCCION', label: 'Producción' },
  { value: 'MERMAS', label: 'Mermas' },
  { value: 'RECEPCION_MERCADERIA', label: 'Recepción de Mercadería' },
  { value: 'TRANSITO', label: 'Tránsito' },
] as const;

export const WAREHOUSE_TYPE_VALUES = [
  'VENTA',
  'INVENTARIO',
  'ALMACENAJE',
  'CONSUMO_INTERNO',
  'PRODUCCION',
  'MERMAS',
  'RECEPCION_MERCADERIA',
  'TRANSITO'
] as const;

export type WarehouseType = typeof WAREHOUSE_TYPE_VALUES[number]; 