// Importar enums desde constants
import { CompanyType, ContactType, SupplierRank, PaymentTerm } from '@/constants/supplier';

// 🏷️ TIPOS PARA ETIQUETAS DE PROVEEDORES
export interface SupplierTag {
  id: number;
  nombre: string;
  descripcion?: string;
  color: string;
  tipoAplicacion: 'todos' | 'EMPRESA_INDIVIDUAL' | 'SOCIEDAD_ANONIMA';
  esSistema: boolean;
  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierTagAssignment {
  id: number;
  supplierId: number;
  etiquetaId: number;
  createdAt: Date;
  etiqueta?: SupplierTag;
}

// 🏢 TIPOS PRINCIPALES DEL PROVEEDOR
export interface Supplier {
  id: number;
  name: string;
  displayName?: string | null;
  companyType: CompanyType;
  internalRef?: string | null;
  website?: string | null;
  active: boolean;
  vat?: string | null;
  taxId?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  countryCode?: string | null;
  phone?: string | null;
  mobile?: string | null;
  fax?: string | null;
  email?: string | null;
  currency?: string | null;
  paymentTerm: PaymentTerm;
  customPaymentDays?: number | null;
  creditLimit?: number | null;
  supplierRank: SupplierRank;
  rankPoints: number;
  category?: string | null;
  accountManager?: string | null;
  purchasingAgent?: string | null;
  logo?: string | null;
  image?: string | null;
  notes?: string | null;
  publicNotes?: string | null;
  language?: string | null;
  timezone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number | null;
  lastModifiedBy?: number | null;
  
  // Relaciones
  etiquetas?: SupplierTagAssignment[];
}

// 👥 CONTACTO DEL PROVEEDOR
export interface SupplierContact {
  id: number;
  supplierId: number;
  name: string;
  position?: string | null;
  type: ContactType;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  notes?: string | null;
  isPrimary: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 🏦 CUENTA BANCARIA DEL PROVEEDOR
export interface SupplierBank {
  id: number;
  supplierId: number;
  bankName: string;
  accountNumber: string;
  accountType?: string | null;
  routingNumber?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  holderName: string;
  holderDocument?: string | null;
  isPrimary: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 💸 CONFIGURACIÓN FISCAL
export interface SupplierTax {
  id: number;
  supplierId: number;
  taxType: string;
  taxRate: number;
  taxCode?: string | null;
  description?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 📊 DATOS DEL FORMULARIO
export interface SupplierFormData {
  // Información básica
  name: string;
  displayName?: string;
  companyType: CompanyType;
  internalRef?: string;
  website?: string;
  active: boolean;
  
  // Identificación fiscal
  vat?: string;
  taxId?: string;
  
  // Dirección
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  countryCode?: string;
  
  // Contacto
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  
  // Configuración comercial
  currency?: string;
  paymentTerm: PaymentTerm;
  customPaymentDays?: number;
  creditLimit?: number;
  
  // Clasificación
  supplierRank: SupplierRank;
  rankPoints?: number;
  category?: string;
  
  // Responsables
  accountManager?: string;
  purchasingAgent?: string;
  
  // Multimedia y notas
  logo?: string;
  image?: string;
  notes?: string;
  publicNotes?: string;
  
  // Configuración regional
  language?: string;
  timezone?: string;
  
  // Etiquetas
  etiquetas?: number[];
}

// 📋 DATOS DEL FORMULARIO DE CONTACTO
export interface SupplierContactFormData {
  name: string;
  position?: string;
  type: ContactType;
  email?: string;
  phone?: string;
  mobile?: string;
  notes?: string;
  isPrimary: boolean;
  active: boolean;
}

// 🏦 DATOS DEL FORMULARIO BANCARIO
export interface SupplierBankFormData {
  bankName: string;
  accountNumber: string;
  accountType?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  holderName: string;
  holderDocument?: string;
  isPrimary: boolean;
  active: boolean;
}

// 💸 DATOS DEL FORMULARIO FISCAL
export interface SupplierTaxFormData {
  taxType: string;
  taxRate: number;
  taxCode?: string;
  description?: string;
  active: boolean;
}

// 📊 MÉTRICAS DEL PROVEEDOR
export interface SupplierMetrics {
  totalProducts: number;
  totalOrders: number;
  totalPurchases: number;
  averageLeadTime: number;
  rating: number;
  rankPoints: number;
  
  // Tendencias (%)
  productsGrowth: number;
  ordersGrowth: number;
  purchasesGrowth: number;
  leadTimeImprovement: number;
  ratingChange: number;
}

// 🔍 PARÁMETROS DE BÚSQUEDA
export interface SupplierSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  countryCode?: string;
  supplierRank?: SupplierRank;
  active?: boolean;
  category?: string;
  sortBy?: 'name' | 'rankPoints' | 'createdAt' | 'lastPurchase';
  sortOrder?: 'asc' | 'desc';
}

// 📊 ESTADÍSTICAS GLOBALES
export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  byRank: {
    basico: number;
    regular: number;
    bueno: number;
    excelente: number;
  };
  byCountry: Array<{
    countryCode: string;
    countryName: string;
    count: number;
  }>;
  topSuppliers: Array<{
    id: number;
    name: string;
    rankPoints: number;
    supplierRank: SupplierRank;
    totalPurchases: number;
  }>;
}

// 🎯 ESTADOS DEL SISTEMA
export enum SupplierStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  BLACKLISTED = "blacklisted",
  PROSPECT = "prospect"
}

// 📈 DATOS PARA REPORTES
export interface SupplierReportData {
  id: number;
  name: string;
  displayName?: string;
  companyType: CompanyType;
  vat?: string;
  email?: string;
  phone?: string;
  city?: string;
  countryCode?: string;
  supplierRank: SupplierRank;
  rankPoints: number;
  category?: string;
  creditLimit?: number;
  paymentTerm: PaymentTerm;
  active: boolean;
  createdAt: Date;
  lastPurchaseDate?: Date;
  totalPurchases: number;
  totalAmount: number;
  averageRating: number;
}

// 🔄 RESPUESTAS DE API
export interface SupplierListResponse {
  data: Supplier[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  stats: SupplierStats;
}

export interface SupplierDetailResponse {
  supplier: Supplier;
  contacts: SupplierContact[];
  banks: SupplierBank[];
  taxes: SupplierTax[];
  metrics: SupplierMetrics;
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    amount: number;
    status: string;
    date: Date;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    orderCount: number;
    totalAmount: number;
  }>;
} 