/**
 * Utilidades para Cálculo y Gestión de Precios
 * Módulo de Gestión de Precios - TodoConstructor
 */

export interface PriceCalculation {
  costPrice: number;
  profitMargin: number;
  salePrice: number;
  finalPrice: number;
  profitAmount: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
}

export interface PricePromotion {
  id: number;
  name: string;
  promotionType: 'discount_percentage' | 'discount_fixed' | 'markup_percentage' | 'markup_fixed' | 'special_price';
  value: number;
  appliesTo: 'all_products' | 'categories' | 'specific_products' | 'suppliers';
  targetIds: number[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
}

export interface CategoryProfitConfig {
  id: number;
  categoryId: number;
  defaultProfitMargin: number;
  minProfitMargin: number;
  maxProfitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive: boolean;
}

export interface ProductProfitConfig {
  id: number;
  productId: number;
  profitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive: boolean;
}

/**
 * Calcula el precio de venta basado en costo y margen de utilidad
 */
export function calculateSalePriceFromCost(
  costPrice: number,
  profitMargin: number,
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'hundreds'
): number {
  if (!costPrice || costPrice <= 0) return 0;
  
  const calculatedPrice = costPrice * (1 + profitMargin / 100);
  
  switch (roundingRule) {
    case 'tens':
      return Math.round(calculatedPrice / 10) * 10;
    case 'hundreds':
      return Math.round(calculatedPrice / 100) * 100;
    case 'thousands':
      return Math.round(calculatedPrice / 1000) * 1000;
    case 'none':
    default:
      return Math.round(calculatedPrice * 100) / 100;
  }
}

/**
 * Calcula el margen de utilidad basado en costo y precio de venta
 */
export function calculateProfitMargin(costPrice: number, salePrice: number): number {
  if (!costPrice || costPrice <= 0) return 0;
  return ((salePrice - costPrice) / costPrice) * 100;
}

/**
 * Calcula el monto de utilidad en pesos
 */
export function calculateProfitAmount(costPrice: number, salePrice: number): number {
  return Math.max(0, salePrice - costPrice);
}

/**
 * Calcula el precio final con IVA
 */
export function calculateFinalPriceWithVAT(
  salePrice: number, 
  vatRate: number = 19,
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'none'
): number {
  const priceWithVAT = salePrice * (1 + vatRate / 100);
  
  switch (roundingRule) {
    case 'tens':
      return Math.round(priceWithVAT / 10) * 10;
    case 'hundreds':
      return Math.round(priceWithVAT / 100) * 100;
    case 'thousands':
      return Math.round(priceWithVAT / 1000) * 1000;
    case 'none':
    default:
      return Math.round(priceWithVAT);
  }
}

/**
 * Aplica una promoción a un precio base
 */
export function applyPromotionToPrice(
  basePrice: number,
  promotion: PricePromotion
): number {
  if (!promotion.isActive) return basePrice;
  
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  
  // Verificar si la promoción está activa
  if (now < startDate || now > endDate) return basePrice;
  
  let finalPrice = basePrice;
  
  switch (promotion.promotionType) {
    case 'discount_percentage':
      finalPrice = basePrice * (1 - promotion.value / 100);
      break;
    case 'discount_fixed':
      finalPrice = basePrice - promotion.value;
      break;
    case 'markup_percentage':
      finalPrice = basePrice * (1 + promotion.value / 100);
      break;
    case 'markup_fixed':
      finalPrice = basePrice + promotion.value;
      break;
    case 'special_price':
      finalPrice = promotion.value;
      break;
  }
  
  return Math.max(finalPrice, 0); // No permitir precios negativos
}

/**
 * Valida si un margen de utilidad está dentro del rango permitido
 */
export function validateProfitMargin(
  margin: number,
  minMargin: number = 10,
  maxMargin: number = 100
): { isValid: boolean; message?: string } {
  if (margin < minMargin) {
    return {
      isValid: false,
      message: `El margen de utilidad debe ser al menos ${minMargin}%`
    };
  }
  
  if (margin > maxMargin) {
    return {
      isValid: false,
      message: `El margen de utilidad no puede exceder ${maxMargin}%`
    };
  }
  
  return { isValid: true };
}

/**
 * Formatea un precio como moneda chilena
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calcula un precio completo con todos los componentes
 */
export function calculateCompletePrice(
  costPrice: number,
  profitMargin: number,
  vatRate: number = 19,
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'hundreds'
): PriceCalculation {
  const salePrice = calculateSalePriceFromCost(costPrice, profitMargin, roundingRule);
  const finalPrice = calculateFinalPriceWithVAT(salePrice, vatRate, roundingRule);
  const profitAmount = calculateProfitAmount(costPrice, salePrice);
  
  return {
    costPrice,
    profitMargin,
    salePrice,
    finalPrice,
    profitAmount,
    roundingRule
  };
}

/**
 * Obtiene el nombre descriptivo de una regla de redondeo
 */
export function getRoundingRuleDescription(rule: string): string {
  switch (rule) {
    case 'none':
      return 'Sin redondeo (precios exactos)';
    case 'tens':
      return 'Redondeo a decenas (ej: 1,234 → 1,230)';
    case 'hundreds':
      return 'Redondeo a centenas (ej: 1,234 → 1,200)';
    case 'thousands':
      return 'Redondeo a miles (ej: 1,234 → 1,000)';
    default:
      return 'Redondeo no definido';
  }
}

/**
 * Obtiene el nombre descriptivo de un tipo de promoción
 */
export function getPromotionTypeDescription(type: string): string {
  switch (type) {
    case 'discount_percentage':
      return 'Descuento por porcentaje';
    case 'discount_fixed':
      return 'Descuento fijo';
    case 'markup_percentage':
      return 'Aumento por porcentaje';
    case 'markup_fixed':
      return 'Aumento fijo';
    case 'special_price':
      return 'Precio especial';
    default:
      return 'Tipo de promoción no definido';
  }
}

/**
 * Obtiene el nombre descriptivo de a qué aplica una promoción
 */
export function getPromotionAppliesToDescription(appliesTo: string): string {
  switch (appliesTo) {
    case 'all_products':
      return 'Todos los productos';
    case 'categories':
      return 'Categorías específicas';
    case 'specific_products':
      return 'Productos específicos';
    case 'suppliers':
      return 'Proveedores específicos';
    default:
      return 'Aplicación no definida';
  }
}

/**
 * Verifica si una promoción está activa en una fecha específica
 */
export function isPromotionActive(
  promotion: PricePromotion,
  checkDate?: Date
): boolean {
  if (!promotion.isActive) return false;
  
  const date = checkDate || new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  
  return date >= startDate && date <= endDate;
}

/**
 * Obtiene promociones activas de una lista
 */
export function getActivePromotions(
  promotions: PricePromotion[],
  checkDate?: Date
): PricePromotion[] {
  return promotions.filter(promo => isPromotionActive(promo, checkDate));
}

/**
 * Ordena promociones por prioridad (mayor prioridad primero)
 */
export function sortPromotionsByPriority(promotions: PricePromotion[]): PricePromotion[] {
  return [...promotions].sort((a, b) => b.priority - a.priority);
}

/**
 * Calcula el precio final aplicando todas las promociones activas
 */
export function calculateFinalPriceWithPromotions(
  basePrice: number,
  promotions: PricePromotion[],
  checkDate?: Date
): number {
  const activePromotions = getActivePromotions(promotions, checkDate);
  const sortedPromotions = sortPromotionsByPriority(activePromotions);
  
  let finalPrice = basePrice;
  
  // Aplicar solo la promoción de mayor prioridad
  if (sortedPromotions.length > 0) {
    finalPrice = applyPromotionToPrice(finalPrice, sortedPromotions[0]);
  }
  
  return finalPrice;
}

/**
 * Genera un resumen de análisis de precios
 */
export function generatePriceAnalysis(
  costPrice: number,
  salePrice: number,
  marketPrice?: number
): {
  profitMargin: number;
  profitAmount: number;
  marketPosition?: 'below_market' | 'market_average' | 'above_market';
  recommendation?: string;
} {
  const profitMargin = calculateProfitMargin(costPrice, salePrice);
  const profitAmount = calculateProfitAmount(costPrice, salePrice);
  
  let marketPosition: 'below_market' | 'market_average' | 'above_market' | undefined;
  let recommendation: string | undefined;
  
  if (marketPrice) {
    const priceDifference = ((salePrice - marketPrice) / marketPrice) * 100;
    
    if (priceDifference < -10) {
      marketPosition = 'below_market';
      recommendation = 'Precio muy competitivo. Considerar aumentar para mejorar margen.';
    } else if (priceDifference > 10) {
      marketPosition = 'above_market';
      recommendation = 'Precio por encima del mercado. Verificar competitividad.';
    } else {
      marketPosition = 'market_average';
      recommendation = 'Precio en línea con el mercado.';
    }
  }
  
  return {
    profitMargin,
    profitAmount,
    marketPosition,
    recommendation
  };
}

/**
 * Valida si un precio es válido
 */
export function validatePrice(price: number): { isValid: boolean; message?: string } {
  if (price < 0) {
    return {
      isValid: false,
      message: 'El precio no puede ser negativo'
    };
  }
  
  if (price === 0) {
    return {
      isValid: false,
      message: 'El precio debe ser mayor a cero'
    };
  }
  
  if (!isFinite(price)) {
    return {
      isValid: false,
      message: 'El precio debe ser un número válido'
    };
  }
  
  return { isValid: true };
}

/**
 * Convierte un precio a número entero (para evitar decimales)
 */
export function normalizePrice(price: number): number {
  return Math.round(price);
}

/**
 * Calcula el precio de venta sugerido basado en múltiples factores
 */
export function calculateSuggestedSalePrice(
  costPrice: number,
  categoryMargin: number,
  productMargin?: number,
  marketPrice?: number,
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'hundreds'
): {
  suggestedPrice: number;
  basedOn: string;
  reasoning: string;
} {
  const margin = productMargin || categoryMargin;
  const calculatedPrice = calculateSalePriceFromCost(costPrice, margin, roundingRule);
  
  let suggestedPrice = calculatedPrice;
  let basedOn = 'margen de categoría';
  let reasoning = `Calculado con margen de ${margin}%`;
  
  if (productMargin) {
    basedOn = 'margen específico del producto';
    reasoning = `Calculado con margen específico de ${margin}%`;
  }
  
  // Ajustar si hay precio de mercado
  if (marketPrice) {
    const marketDifference = Math.abs(calculatedPrice - marketPrice) / marketPrice;
    
    if (marketDifference > 0.2) { // Más del 20% de diferencia
      if (calculatedPrice > marketPrice) {
        suggestedPrice = marketPrice * 0.95; // 5% por debajo del mercado
        basedOn = 'precio de mercado';
        reasoning = 'Ajustado para ser competitivo con el mercado';
      }
    }
  }
  
  return {
    suggestedPrice: normalizePrice(suggestedPrice),
    basedOn,
    reasoning
  };
}



