export interface InventoryMovement {
  id?: number
  productId: number
  fromWarehouseId?: number | null
  toWarehouseId?: number | null
  movementType: 'TRANSFER' | 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  quantity: number
  reason?: string
  notes?: string
  userId?: string
  createdAt?: string
  updatedAt?: string
}

export interface MovementFilters {
  productId?: number
  fromWarehouseId?: number
  toWarehouseId?: number
  movementType?: string
  startDate?: string
  endDate?: string
  userId?: string
}

export interface MovementWithDetails extends InventoryMovement {
  Product?: {
    name: string
    sku: string
    description?: string
  }
  FromWarehouse?: {
    name: string
  }
  ToWarehouse?: {
    name: string
  }
  User?: {
    name: string
    email: string
  }
}

export interface MovementStats {
  totalMovements: number
  totalQuantity: number
  entriesCount: number
  exitsCount: number
  transfersCount: number
  typeStats: Record<string, number>
  recentMovements: Array<{
    movementType: string
    quantity: number
  }>
  topProducts: Array<{
    productId: number
    name: string
    sku: string
    totalQuantity: number
    movementCount: number
  }>
}

export interface ProductForMovement {
  quantity: number
  Product: {
    id: number
    name: string
    sku: string
    description?: string
  }
}

export interface MovementFormData {
  productId: number
  fromWarehouseId?: number
  toWarehouseId?: number
  movementType: 'TRANSFER' | 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  quantity: number
  reason: string
  notes?: string
}

export const MOVEMENT_TYPES = {
  TRANSFER: 'TRANSFER',
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
  AJUSTE: 'AJUSTE'
} as const

export const MOVEMENT_TYPE_LABELS = {
  [MOVEMENT_TYPES.TRANSFER]: 'Transferencia',
  [MOVEMENT_TYPES.ENTRADA]: 'Entrada',
  [MOVEMENT_TYPES.SALIDA]: 'Salida',
  [MOVEMENT_TYPES.AJUSTE]: 'Ajuste'
} as const

export const MOVEMENT_TYPE_COLORS = {
  [MOVEMENT_TYPES.TRANSFER]: 'blue',
  [MOVEMENT_TYPES.ENTRADA]: 'green',
  [MOVEMENT_TYPES.SALIDA]: 'red',
  [MOVEMENT_TYPES.AJUSTE]: 'yellow'
} as const

export const MOVEMENT_TYPE_ICONS = {
  [MOVEMENT_TYPES.TRANSFER]: '🔄',
  [MOVEMENT_TYPES.ENTRADA]: '📥',
  [MOVEMENT_TYPES.SALIDA]: '📤',
  [MOVEMENT_TYPES.AJUSTE]: '⚖️'
} as const 

export interface ProductTransfer {
  productId: number
  quantity: number
}

export interface MultiTransferFormData {
  fromWarehouseId: number
  toWarehouseId: number
  reason: string
  notes?: string
  products: ProductTransfer[]
} 