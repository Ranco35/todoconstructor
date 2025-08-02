// Tipos para el módulo de presupuestos (Budgets)

export type BudgetStatus = 
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface Budget {
  id: number;
  number: string;
  clientId: number;
  reservationId?: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
  total: number;
  currency: string;
  expirationDate?: string;
  notes?: string;
  internalNotes?: string; // Notas internas solo para personal interno
  paymentTerms?: string;
  companyId?: number;
  sellerId?: string; // UUID para usuarios
  lines: BudgetLine[];
}

export interface BudgetLine {
  id: number;
  quoteId: number;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxes: number[];
  subtotal: number;
}

export interface BudgetCreateInput {
  number: string;
  clientId: number;
  reservationId?: number;
  status?: BudgetStatus;
  total: number;
  currency?: string;
  expirationDate?: string;
  notes?: string;
  internalNotes?: string; // Notas internas solo para personal interno
  paymentTerms?: string;
  companyId?: number;
  sellerId?: string;
  lines: Omit<BudgetLine, 'id' | 'quoteId'>[];
}

export interface BudgetUpdateInput extends Partial<BudgetCreateInput> {
  id: number;
}

export interface BudgetFilters {
  status?: BudgetStatus;
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface BudgetListResponse {
  budgets: Budget[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 