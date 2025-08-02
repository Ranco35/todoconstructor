// Tipos para el módulo de Compras
// Basado en la estructura del módulo de Ventas

export interface PurchaseOrder {
  id: number;
  number: string;
  supplier_id: number | null;
  warehouse_id: number | null;
  status: PurchaseOrderStatus;
  created_at: string;
  updated_at: string;
  total: number;
  currency: string;
  expected_delivery_date: string | null;
  notes: string | null;
  payment_terms: string | null;
  company_id: number | null;
  buyer_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface PurchaseOrderLine {
  id: number;
  order_id: number;
  product_id: number | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  taxes: any | null;
  subtotal: number;
}

export interface PurchaseInvoice {
  id: number;
  number: string;
  supplier_id: number | null;
  order_id: number | null;
  warehouse_id: number | null;
  status: PurchaseInvoiceStatus;
  created_at: string;
  updated_at: string;
  total: number;
  currency: string;
  due_date: string | null;
  issue_date: string | null;
  notes: string | null;
  payment_terms: string | null;
  company_id: number | null;
  buyer_id: string | null;
}

export interface PurchaseInvoiceLine {
  id: number;
  invoice_id: number;
  product_id: number | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  taxes: any | null;
  subtotal: number;
  received_quantity: number;
}

export interface PurchasePayment {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  created_by: string | null;
}

// Estados de órdenes de compra
export type PurchaseOrderStatus = 
  | 'draft'      // Borrador
  | 'sent'       // Enviada al proveedor
  | 'approved'   // Aprobada
  | 'received'   // Recibida
  | 'cancelled'; // Cancelada

// Estados de facturas de compra
export type PurchaseInvoiceStatus = 
  | 'draft'      // Borrador
  | 'sent'       // Enviada
  | 'received'   // Recibida
  | 'paid'       // Pagada
  | 'cancelled'; // Cancelada

// Tipos extendidos con información relacionada
export interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  warehouse: {
    id: number;
    name: string;
    location: string;
  } | null;
  lines: PurchaseOrderLine[];
  buyer: {
    id: string;
    name: string;
    email: string;
  } | null;
  approver: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface PurchaseInvoiceWithDetails extends PurchaseInvoice {
  supplier: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  warehouse: {
    id: number;
    name: string;
    location: string;
  } | null;
  order: {
    id: number;
    number: string;
    status: PurchaseOrderStatus;
  } | null;
  lines: PurchaseInvoiceLine[];
  buyer: {
    id: string;
    name: string;
    email: string;
  } | null;
  payments: PurchasePayment[];
}

export interface PurchaseOrderLineWithProduct extends PurchaseOrderLine {
  product: {
    id: number;
    name: string;
    sku: string;
    brand: string;
  } | null;
}

export interface PurchaseInvoiceLineWithProduct extends PurchaseInvoiceLine {
  product: {
    id: number;
    name: string;
    sku: string;
    brand: string;
  } | null;
}

// Tipos para formularios
export interface CreatePurchaseOrderInput {
  supplier_id: number;
  warehouse_id: number;
  expected_delivery_date: string;
  notes?: string;
  payment_terms?: string;
  lines: CreatePurchaseOrderLineInput[];
}

export interface CreatePurchaseOrderLineInput {
  product_id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
}

export interface UpdatePurchaseOrderInput {
  id: number;
  supplier_id?: number;
  warehouse_id?: number;
  expected_delivery_date?: string;
  notes?: string;
  payment_terms?: string;
  status?: PurchaseOrderStatus;
  lines?: UpdatePurchaseOrderLineInput[];
}

export interface UpdatePurchaseOrderLineInput {
  id?: number;
  product_id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
}

export interface CreatePurchaseInvoiceInput {
  supplier_id: number;
  supplier_invoice_number?: string; // Número de la factura del proveedor
  order_id?: number;
  warehouse_id: number;
  due_date: string;
  issue_date?: string;
  notes?: string;
  payment_terms?: string;
  lines: CreatePurchaseInvoiceLineInput[];
}

export interface CreatePurchaseInvoiceLineInput {
  product_id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  received_quantity?: number;
}

export interface UpdatePurchaseInvoiceInput {
  id: number;
  supplier_id?: number;
  order_id?: number;
  warehouse_id?: number;
  due_date?: string;
  issue_date?: string;
  notes?: string;
  payment_terms?: string;
  status?: PurchaseInvoiceStatus;
  lines?: UpdatePurchaseInvoiceLineInput[];
}

export interface UpdatePurchaseInvoiceLineInput {
  id?: number;
  product_id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
}

export interface CreatePurchasePaymentInput {
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference?: string;
}

// Tipos para listados
export interface ListPurchaseOrdersInput {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplier_id?: number;
  warehouse_id?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface ListPurchaseInvoicesInput {
  page?: number;
  limit?: number;
  status?: PurchaseInvoiceStatus;
  supplier_id?: number;
  warehouse_id?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface ListPurchasePaymentsInput {
  page?: number;
  limit?: number;
  payment_method?: string;
  supplier_id?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

// Tipos para estadísticas
export interface PurchaseStats {
  totalOrders: number;
  totalInvoices: number;
  totalPayments: number;
  totalSpent: number;
  pendingOrders: number;
  pendingInvoices: number;
  ordersThisMonth: number;
  invoicesThisMonth: number;
  spentThisMonth: number;
  spentToday: number;
}

// Tipos para reportes
export interface PurchaseReport {
  period: string;
  totalOrders: number;
  totalInvoices: number;
  totalSpent: number;
  averageOrderValue: number;
  topSuppliers: Array<{
    supplier_id: number;
    supplier_name: string;
    total_spent: number;
    order_count: number;
  }>;
  topProducts: Array<{
    product_id: number;
    product_name: string;
    quantity_ordered: number;
    total_spent: number;
  }>;
  statusBreakdown: {
    draft: number;
    sent: number;
    approved: number;
    received: number;
    cancelled: number;
  };
}

// Métodos de pago para compras
export const PURCHASE_PAYMENT_METHODS = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia Bancaria',
  credit_card: 'Tarjeta de Crédito',
  debit_card: 'Tarjeta de Débito',
  check: 'Cheque',
  online_payment: 'Pago Online',
  crypto: 'Criptomoneda',
  other: 'Otro'
} as const;

export type PurchasePaymentMethod = keyof typeof PURCHASE_PAYMENT_METHODS; 