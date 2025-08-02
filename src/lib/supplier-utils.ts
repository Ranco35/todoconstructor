// Importar enums desde constants
import { SupplierRank, PaymentTerm, RANKING_POINTS, VALIDATION_RULES, COUNTRIES } from '@/constants/supplier';

// 📊 CÁLCULO DE RANKING
export function calculateRank(points: number): SupplierRank {
  if (points >= 100) return SupplierRank.EXCELENTE;
  if (points >= 51) return SupplierRank.BUENO;
  if (points >= 11) return SupplierRank.REGULAR;
  return SupplierRank.BASICO;
}

export function getRankRange(rank: SupplierRank): { min: number; max: number | null } {
  switch (rank) {
    case SupplierRank.BASICO:
      return { min: 1, max: 10 };
    case SupplierRank.REGULAR:
      return { min: 11, max: 50 };
    case SupplierRank.BUENO:
      return { min: 51, max: 100 };
    case SupplierRank.EXCELENTE:
      return { min: 100, max: null };
    case SupplierRank.PART_TIME:
      return { min: 0, max: 0 }; // Special rank for part-time workers
    case SupplierRank.PREMIUM:
      return { min: 0, max: 0 }; // Premium rank
    default:
      return { min: 0, max: 0 };
  }
}

// 🔍 VALIDACIONES
export function validateSupplierName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'El nombre es requerido' };
  }
  
  if (name.length < VALIDATION_RULES.name.minLength) {
    return { isValid: false, error: `El nombre debe tener al menos ${VALIDATION_RULES.name.minLength} caracteres` };
  }
  
  if (name.length > VALIDATION_RULES.name.maxLength) {
    return { isValid: false, error: `El nombre no puede exceder ${VALIDATION_RULES.name.maxLength} caracteres` };
  }
  
  return { isValid: true };
}

export function validateVAT(vat: string, countryCode: string = 'CL'): { isValid: boolean; error?: string } {
  if (!vat || vat.trim().length === 0) {
    return { isValid: true }; // VAT es opcional
  }
  
  if (vat.length < VALIDATION_RULES.vat.minLength || vat.length > VALIDATION_RULES.vat.maxLength) {
    return { isValid: false, error: `El RUT debe tener entre ${VALIDATION_RULES.vat.minLength} y ${VALIDATION_RULES.vat.maxLength} caracteres` };
  }
  
  if (!VALIDATION_RULES.vat.pattern.test(vat)) {
    return { isValid: false, error: 'El RUT contiene caracteres no válidos' };
  }
  
  // Validación específica para Chile
  if (countryCode === 'CL') {
    return validateChileanRUT(vat);
  }
  
  return { isValid: true };
}

export function validateChileanRUT(rut: string): { isValid: boolean; error?: string } {
  // Limpiar el RUT
  const cleanRut = rut.replace(/[.-]/g, '');
  
  if (cleanRut.length < 8 || cleanRut.length > 9) {
    return { isValid: false, error: 'El RUT debe tener 8 o 9 dígitos' };
  }
  
  // Separar número y dígito verificador
  const number = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  if (calculatedDV !== dv) {
    return { isValid: false, error: 'El dígito verificador del RUT no es válido' };
  }
  
  return { isValid: true };
}

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: true }; // Email es opcional
  }
  
  if (!VALIDATION_RULES.email.pattern.test(email)) {
    return { isValid: false, error: 'El formato del email no es válido' };
  }
  
  return { isValid: true };
}

export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  // Si el teléfono es null, undefined o string vacío, es válido (opcional)
  if (!phone || phone.trim().length === 0) {
    return { isValid: true }; // Teléfono es opcional
  }
  
  // Si tiene contenido, validar formato
  const trimmedPhone = phone.trim();
  if (!VALIDATION_RULES.phone.pattern.test(trimmedPhone)) {
    return { isValid: false, error: 'El formato del teléfono no es válido. Use solo números, espacios, guiones, paréntesis y opcionalmente + al inicio' };
  }
  
  return { isValid: true };
}

export function validateCreditLimit(limit: number | null | undefined): { isValid: boolean; error?: string } {
  if (limit === null || limit === undefined) {
    return { isValid: true }; // Límite es opcional
  }
  
  if (typeof limit !== 'number' || isNaN(limit)) {
    return { isValid: false, error: 'El límite de crédito debe ser un número válido' };
  }
  
  if (limit < VALIDATION_RULES.creditLimit.min) {
    return { isValid: false, error: 'El límite de crédito debe ser mayor a 0' };
  }
  
  if (limit > VALIDATION_RULES.creditLimit.max) {
    return { isValid: false, error: 'El límite de crédito excede el máximo permitido' };
  }
  
  return { isValid: true };
}

// 🏷️ FORMATEO Y PRESENTACIÓN
export function formatVAT(vat: string, countryCode: string = 'CL'): string {
  if (!vat) return '';
  
  if (countryCode === 'CL') {
    // Formato chileno: 12.345.678-9
    const cleanRut = vat.replace(/[.-]/g, '');
    if (cleanRut.length >= 8) {
      const number = cleanRut.slice(0, -1);
      const dv = cleanRut.slice(-1).toUpperCase();
      return `${number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
    }
  }
  
  return vat;
}

export function formatPhone(phone: string, countryCode: string = 'CL'): string {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  if (countryCode === 'CL') {
    // Formato chileno: +56 9 1234 5678
    if (cleanPhone.length === 9) {
      return `+56 9 ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
    }
    if (cleanPhone.length === 8) {
      return `+56 2 ${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4)}`;
    }
  }
  
  return phone;
}

export function formatCurrency(amount: number, currency: string = 'CLP'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPaymentTerm(term: PaymentTerm, customDays?: number): string {
  switch (term) {
    case PaymentTerm.CONTADO:
      return 'Inmediato';
    case PaymentTerm.CREDITO_30:
      return 'Net 30 días';
    case PaymentTerm.CREDITO_60:
      return 'Net 60 días';
    case PaymentTerm.CREDITO_90:
      return 'Net 90 días';
    case PaymentTerm.CREDITO_120:
      return 'Net 120 días';
    default:
      return customDays ? `Net ${customDays} días` : 'Personalizado';
  }
}

export function getCountryName(countryCode: string): string {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.name || countryCode;
}

export function getCountryFlag(countryCode: string): string {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.flag || '🌍';
}

// 📊 GENERACIÓN DE REFERENCIAS INTERNAS
export function generateInternalRef(name: string, existingRefs: string[] = []): string {
  const baseRef = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  
  let counter = 1;
  let ref = `${baseRef}-${counter.toString().padStart(3, '0')}`;
  
  while (existingRefs.includes(ref)) {
    counter++;
    ref = `${baseRef}-${counter.toString().padStart(3, '0')}`;
  }
  
  return ref;
}

// 🔄 CÁLCULO DE PUNTOS DE RANKING
export function calculateRankingPoints(factors: {
  ordersOnTime?: number;
  ordersLate?: number;
  qualityIssues?: number;
  communicationScore?: number;
  responseTime?: number;
  priceCompetitiveness?: number;
  contractViolations?: number;
}): number {
  let points = 0;
  
  // Factores positivos
  if (factors.ordersOnTime) {
    points += factors.ordersOnTime * RANKING_POINTS.ORDER_ON_TIME;
  }
  
  if (factors.communicationScore && factors.communicationScore > 7) {
    points += RANKING_POINTS.GOOD_COMMUNICATION;
  }
  
  if (factors.responseTime && factors.responseTime < 24) {
    points += RANKING_POINTS.FAST_RESPONSE;
  }
  
  if (factors.priceCompetitiveness && factors.priceCompetitiveness > 7) {
    points += RANKING_POINTS.COMPETITIVE_PRICE;
  }
  
  // Factores negativos
  if (factors.ordersLate) {
    points += factors.ordersLate * RANKING_POINTS.LATE_DELIVERY;
  }
  
  if (factors.qualityIssues) {
    points += factors.qualityIssues * RANKING_POINTS.DEFECTIVE_PRODUCT;
  }
  
  if (factors.communicationScore && factors.communicationScore < 4) {
    points += RANKING_POINTS.POOR_COMMUNICATION;
  }
  
  if (factors.contractViolations) {
    points += factors.contractViolations * RANKING_POINTS.CONTRACT_VIOLATION;
  }
  
  return Math.max(0, points);
}

// 📈 CÁLCULO DE MÉTRICAS
export function calculateSupplierMetrics(data: {
  totalProducts: number;
  totalOrders: number;
  totalPurchases: number;
  averageLeadTime: number;
  rating: number;
  previousMetrics?: {
    totalProducts: number;
    totalOrders: number;
    totalPurchases: number;
    averageLeadTime: number;
    rating: number;
  };
}): {
  totalProducts: number;
  totalOrders: number;
  totalPurchases: number;
  averageLeadTime: number;
  rating: number;
  productsGrowth: number;
  ordersGrowth: number;
  purchasesGrowth: number;
  leadTimeImprovement: number;
  ratingChange: number;
} {
  const { previousMetrics } = data;
  
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  return {
    totalProducts: data.totalProducts,
    totalOrders: data.totalOrders,
    totalPurchases: data.totalPurchases,
    averageLeadTime: data.averageLeadTime,
    rating: data.rating,
    productsGrowth: previousMetrics ? calculateGrowth(data.totalProducts, previousMetrics.totalProducts) : 0,
    ordersGrowth: previousMetrics ? calculateGrowth(data.totalOrders, previousMetrics.totalOrders) : 0,
    purchasesGrowth: previousMetrics ? calculateGrowth(data.totalPurchases, previousMetrics.totalPurchases) : 0,
    leadTimeImprovement: previousMetrics ? calculateGrowth(previousMetrics.averageLeadTime, data.averageLeadTime) : 0,
    ratingChange: previousMetrics ? data.rating - previousMetrics.rating : 0,
  };
}

// 🔍 BÚSQUEDA Y FILTRADO
export function searchSuppliers(suppliers: any[], searchTerm: string): any[] {
  if (!searchTerm || searchTerm.length < 2) return suppliers;
  
  const term = searchTerm.toLowerCase();
  
  return suppliers.filter(supplier => 
    supplier.name?.toLowerCase().includes(term) ||
    supplier.displayName?.toLowerCase().includes(term) ||
    supplier.vat?.toLowerCase().includes(term) ||
    supplier.email?.toLowerCase().includes(term) ||
    supplier.phone?.toLowerCase().includes(term) ||
    supplier.internalRef?.toLowerCase().includes(term)
  );
}

export function filterSuppliers(suppliers: any[], filters: {
  countryCode?: string;
  supplierRank?: SupplierRank;
  active?: boolean;
  category?: string;
}): any[] {
  return suppliers.filter(supplier => {
    if (filters.countryCode && supplier.countryCode !== filters.countryCode) return false;
    if (filters.supplierRank && supplier.supplierRank !== filters.supplierRank) return false;
    if (filters.active !== undefined && supplier.active !== filters.active) return false;
    if (filters.category && supplier.category !== filters.category) return false;
    return true;
  });
}

// 📊 ORDENAMIENTO
export function sortSuppliers(suppliers: any[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): any[] {
  return [...suppliers].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Manejar valores nulos
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Ordenamiento de strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue, 'es');
      return sortOrder === 'asc' ? comparison : -comparison;
    }
    
    // Ordenamiento de números
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Ordenamiento de fechas
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
    }
    
    return 0;
  });
} 