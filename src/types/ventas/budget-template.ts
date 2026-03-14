// Tipos para plantillas de presupuesto

export type BudgetTemplateCategory = 'pintura' | 'plomeria' | 'electricidad' | 'construccion' | 'custom';

export interface BudgetTemplateLine {
  displayType: 'product' | 'section' | 'note';
  description?: string;
  sectionTitle?: string;
  noteText?: string;
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  productId?: number | null;
  productName?: string;
}

export interface BudgetTemplate {
  id: number;
  name: string;
  description: string;
  category: BudgetTemplateCategory;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  summaryTemplate: string;
  notesTemplate: string;
  paymentTerms: string;
  currency: string;
  linesTemplate: BudgetTemplateLine[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetTemplateCreateInput {
  name: string;
  description?: string;
  category: BudgetTemplateCategory;
  icon?: string;
  color?: string;
  sortOrder?: number;
  summaryTemplate?: string;
  notesTemplate?: string;
  paymentTerms?: string;
  currency?: string;
  linesTemplate: BudgetTemplateLine[];
}
