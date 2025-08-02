// Types para el módulo de compras a proveedores
// con procesamiento inteligente de PDFs

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  invoice_date: string;
  due_date?: string;
  currency: string;
  
  // Montos
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  
  // Estados
  status: PurchaseInvoiceStatus;
  payment_status: PaymentStatus;
  
  // Archivos PDF
  pdf_file_path?: string;
  pdf_file_name?: string;
  pdf_file_size?: number;
  
  // Datos de IA
  extracted_data?: ExtractedInvoiceData;
  extraction_confidence?: number;
  manual_review_required: boolean;
  
  // Notas
  notes?: string;
  internal_notes?: string;
  
  // Metadatos
  created_at: string;
  updated_at: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  
  // Relaciones
  supplier?: {
    id: number;
    name: string;
    rut?: string;
    email?: string;
  };
  lines?: PurchaseInvoiceLine[];
  payments?: PurchaseInvoicePayment[];
}

export interface PurchaseInvoiceLine {
  id: number;
  purchase_invoice_id: number;
  
  // Producto/servicio
  product_id?: number;
  description: string;
  product_code?: string;
  
  // Cantidades y precios
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  
  // Impuestos
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  
  // Centro de costo
  cost_center_id?: number;
  line_order: number;
  
  created_at: string;
  
  // Relaciones
  product?: {
    id: number;
    name: string;
    sku?: string;
  };
  cost_center?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface PurchaseInvoicePayment {
  id: number;
  purchase_invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference?: string;
  cash_session_id?: number;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface PDFExtractionLog {
  id: number;
  purchase_invoice_id: number;
  extraction_method: 'chatgpt' | 'ocr' | 'manual';
  raw_text?: string;
  chatgpt_prompt?: string;
  chatgpt_response?: any;
  processing_time_ms?: number;
  tokens_used?: number;
  confidence_score?: number;
  error_message?: string;
  success: boolean;
  created_at: string;
  created_by?: string;
}

// Estados
export type PurchaseInvoiceStatus = 'draft' | 'approved' | 'paid' | 'disputed' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

// Datos extraídos del PDF por ChatGPT
export interface ExtractedInvoiceData {
  // Información del proveedor extraída
  supplier: {
    name: string;
    rut?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  
  // Información de la factura
  invoice: {
    number: string;
    date: string;
    due_date?: string;
    currency?: string;
    type?: string; // Factura, Boleta, Nota de Crédito, etc.
  };
  
  // Líneas de productos/servicios
  lines: {
    description: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    total: number;
    product_code?: string;
  }[];
  
  // Totales
  totals: {
    subtotal: number;
    iva?: number;
    iva_rate?: number;
    total: number;
    currency?: string;
  };
  
  // Información adicional
  additional?: {
    payment_terms?: string;
    delivery_date?: string;
    order_number?: string;
    notes?: string;
  };
  
  // Metadatos de la extracción
  extraction_metadata: {
    confidence: number; // 0-1
    processing_time: number; // milliseconds
    method: 'chatgpt' | 'ocr';
    model_used?: string;
    tokens_used?: number;
  };
}

// Configuración para procesamiento de PDF
export interface PDFProcessingConfig {
  use_chatgpt: boolean;
  use_ocr_fallback: boolean;
  max_file_size_mb: number;
  allowed_extensions: string[];
  chatgpt_model: string;
  chatgpt_temperature: number;
  auto_approve_threshold: number; // Confianza mínima para auto-aprobar
}

// Request para crear factura desde PDF
export interface CreateInvoiceFromPDFRequest {
  file: File;
  supplier_id?: number;
  manual_review?: boolean;
  notes?: string;
}

// Response del procesamiento de PDF
export interface PDFProcessingResponse {
  success: boolean;
  invoice_id?: number;
  extracted_data?: ExtractedInvoiceData;
  confidence?: number;
  manual_review_required?: boolean;
  error?: string;
  processing_time_ms?: number;
  
  // Sugerencias para el usuario
  suggestions?: {
    supplier_matches?: Array<{
      id: number;
      name: string;
      similarity: number;
    }>;
    product_matches?: Array<{
      id: number;
      name: string;
      line_index: number;
      similarity: number;
    }>;
  };
}

// Filtros para listado de facturas
export interface PurchaseInvoiceFilters {
  status?: PurchaseInvoiceStatus;
  payment_status?: PaymentStatus;
  supplier_id?: number;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string; // Búsqueda en número de factura, notas, etc.
  manual_review_only?: boolean;
}

// Datos para formulario de creación/edición
export interface PurchaseInvoiceFormData {
  invoice_number: string;
  supplier_id: number;
  invoice_date: string;
  due_date?: string;
  currency: string;
  notes?: string;
  internal_notes?: string;
  
  lines: {
    description: string;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    tax_rate: number;
    cost_center_id?: number;
    product_id?: number;
    product_code?: string;
  }[];
}

// Estadísticas del módulo
export interface PurchaseInvoiceStats {
  total_invoices: number;
  total_amount: number;
  pending_approval: number;
  pending_payment: number;
  overdue_count: number;
  avg_processing_time: number;
  extraction_success_rate: number;
  
  // Por período
  this_month: {
    count: number;
    amount: number;
  };
  last_month: {
    count: number;
    amount: number;
  };
}

// Constantes
export const PURCHASE_INVOICE_STATUSES = [
  { value: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'approved', label: 'Aprobada', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Pagada', color: 'bg-green-100 text-green-800' },
  { value: 'disputed', label: 'En Disputa', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800' }
] as const;

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'partial', label: 'Parcial', color: 'bg-orange-100 text-orange-800' },
  { value: 'paid', label: 'Pagado', color: 'bg-green-100 text-green-800' }
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'check', label: 'Cheque' },
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' }
] as const;

// Configuración por defecto
export const DEFAULT_PDF_CONFIG: PDFProcessingConfig = {
  use_chatgpt: true,
  use_ocr_fallback: true,
  max_file_size_mb: 10,
  allowed_extensions: ['.pdf'],
  chatgpt_model: 'gpt-3.5-turbo',
  chatgpt_temperature: 0.1,
  auto_approve_threshold: 0.85
}; 