/**
 * Utilidades para cálculos de promociones
 * Funciones puras que no requieren server actions
 */

export interface ActivePromotion {
  id: number;
  name: string;
  description?: string;
  promotionType: 'discount_percentage' | 'discount_fixed' | 'markup_percentage' | 'markup_fixed' | 'special_price';
  value: number;
  appliesTo: 'all_products' | 'categories' | 'specific_products' | 'suppliers';
  targetIds: number[];
  startDate: string;
  endDate: string;
  priority: number;
}

/**
 * Calcula el precio con promoción aplicada
 */
export function calculatePromotionPrice(
  originalPrice: number,
  promotion: ActivePromotion
): number {
  let finalPrice = originalPrice;

  switch (promotion.promotionType) {
    case 'discount_percentage':
      finalPrice = originalPrice * (1 - promotion.value / 100);
      break;
    case 'discount_fixed':
      finalPrice = originalPrice - promotion.value;
      break;
    case 'markup_percentage':
      finalPrice = originalPrice * (1 + promotion.value / 100);
      break;
    case 'markup_fixed':
      finalPrice = originalPrice + promotion.value;
      break;
    case 'special_price':
      finalPrice = promotion.value;
      break;
  }

  return Math.max(finalPrice, 0); // No permitir precios negativos
}

/**
 * Encuentra la mejor promoción aplicable a un producto
 */
export function findBestPromotionForProduct(
  productId: number,
  categoryId: number | null,
  supplierId: number | null,
  promotions: ActivePromotion[]
): ActivePromotion | null {
  const applicablePromotions = promotions.filter(promotion => {
    switch (promotion.appliesTo) {
      case 'all_products':
        return true;
      case 'specific_products':
        return promotion.targetIds.includes(productId);
      case 'categories':
        return categoryId && promotion.targetIds.includes(categoryId);
      case 'suppliers':
        return supplierId && promotion.targetIds.includes(supplierId);
      default:
        return false;
    }
  });

  // Ordenar por prioridad (ya viene ordenado de la base de datos)
  // Retornar la primera (mayor prioridad)
  return applicablePromotions.length > 0 ? applicablePromotions[0] : null;
}

