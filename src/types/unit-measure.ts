// Tipos para el sistema de unidades de medida

export interface UnitMeasure {
  id: number;
  name: string;
  abbreviation: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  
  // Conversión
  baseUnitId?: number;
  conversionFactor: number;
  conversionFormula?: string;
  
  // Clasificación
  category: 'peso' | 'volumen' | 'longitud' | 'empaque' | 'cantidad' | 'general';
  unitType: 'standard' | 'compound' | 'custom';
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notes?: string;
  
  // Relaciones (opcional para display)
  baseUnit?: UnitMeasure;
}

export interface ProductUnitConversion {
  id: number;
  productId: number;
  purchaseUnitId: number;
  saleUnitId: number;
  conversionFactor: number;
  conversionFormula?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones para display
  purchaseUnit?: UnitMeasure;
  saleUnit?: UnitMeasure;
}

// Tipos para formularios
export interface UnitMeasureFormData {
  name: string;
  abbreviation: string;
  description?: string;
  isActive?: boolean;
  
  // Conversión
  baseUnitId?: number;
  conversionFactor?: number;
  conversionFormula?: string;
  
  // Clasificación
  category: 'peso' | 'volumen' | 'longitud' | 'empaque' | 'cantidad' | 'general';
  unitType?: 'standard' | 'compound' | 'custom';
  
  notes?: string;
}

export interface ProductUnitConversionFormData {
  productId: number;
  purchaseUnitId: number;
  saleUnitId: number;
  conversionFactor: number;
  conversionFormula?: string;
  isActive?: boolean;
}

// Tipos para respuestas de API
export interface UnitMeasureResponse {
  data: UnitMeasure[];
  totalCount: number;
  totalPages: number;
}

export interface UnitConversionResult {
  originalQuantity: number;
  convertedQuantity: number;
  fromUnit: UnitMeasure;
  toUnit: UnitMeasure;
  conversionUsed: 'standard' | 'product_specific' | 'none';
}

// Constantes para categorías
export const UNIT_CATEGORIES = [
  { value: 'peso', label: 'Peso', icon: '⚖️' },
  { value: 'volumen', label: 'Volumen', icon: '🥤' },
  { value: 'longitud', label: 'Longitud', icon: '📏' },
  { value: 'empaque', label: 'Empaque', icon: '📦' },
  { value: 'cantidad', label: 'Cantidad', icon: '🔢' },
  { value: 'general', label: 'General', icon: '⚙️' }
] as const;

export const UNIT_TYPES = [
  { value: 'standard', label: 'Estándar', description: 'Unidades estándar del sistema' },
  { value: 'compound', label: 'Compuesta', description: 'Unidades con conversión a otra base' },
  { value: 'custom', label: 'Personalizada', description: 'Unidades específicas del negocio' }
] as const;

// Utilidades para conversión
export interface ConversionParams {
  quantity: number;
  fromUnitId: number;
  toUnitId: number;
  productId?: number; // Para conversiones específicas por producto
} 