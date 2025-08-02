// Sistema de conversiones de unidades de medida
// Permite cálculos automáticos entre diferentes unidades

export interface UnitConversion {
  id: number;
  name: string;
  abbreviation: string;
  description: string;
  baseUnit: string; // Unidad base para conversiones
  conversionFactor: number; // Factor de conversión a la unidad base
}

export const UNIT_CONVERSIONS: UnitConversion[] = [
  // Unidades básicas
  { id: 1, name: 'Unidad', abbreviation: 'UND', description: 'Unidad individual', baseUnit: 'UND', conversionFactor: 1 },
  
  // Unidades de peso
  { id: 2, name: 'Kilogramo', abbreviation: 'KG', description: 'Kilogramo', baseUnit: 'GR', conversionFactor: 1000 },
  { id: 3, name: 'Gramo', abbreviation: 'GR', description: 'Gramo', baseUnit: 'GR', conversionFactor: 1 },
  { id: 19, name: 'Onza', abbreviation: 'ONZ', description: 'Onza (28.35 gramos)', baseUnit: 'GR', conversionFactor: 28.35 },
  { id: 20, name: 'Libra', abbreviation: 'LIB', description: 'Libra (453.59 gramos)', baseUnit: 'GR', conversionFactor: 453.59 },
  
  // Unidades de volumen
  { id: 4, name: 'Litro', abbreviation: 'LT', description: 'Litro', baseUnit: 'ML', conversionFactor: 1000 },
  { id: 18, name: 'Galón', abbreviation: 'GAL', description: 'Galón (3.785 litros)', baseUnit: 'ML', conversionFactor: 3785 },
  
  // Unidades de longitud
  { id: 5, name: 'Metro', abbreviation: 'MT', description: 'Metro', baseUnit: 'CM', conversionFactor: 100 },
  { id: 6, name: 'Centímetro', abbreviation: 'CM', description: 'Centímetro', baseUnit: 'CM', conversionFactor: 1 },
  
  // Unidades de empaque (conversiones a unidades individuales)
  { id: 7, name: 'Caja', abbreviation: 'CAJ', description: 'Caja', baseUnit: 'UND', conversionFactor: 1 }, // Variable según producto
  { id: 8, name: 'Paquete', abbreviation: 'PAQ', description: 'Paquete', baseUnit: 'UND', conversionFactor: 1 }, // Variable según producto
  
  // Unidades de cantidad fija
  { id: 9, name: 'Docena', abbreviation: 'DOC', description: 'Docena (12 unidades)', baseUnit: 'UND', conversionFactor: 12 },
  { id: 10, name: 'Par', abbreviation: 'PAR', description: 'Par (2 unidades)', baseUnit: 'UND', conversionFactor: 2 },
  { id: 11, name: 'Media Docena', abbreviation: 'MED', description: 'Media docena (6 unidades)', baseUnit: 'UND', conversionFactor: 6 },
  { id: 12, name: 'Cuarto', abbreviation: 'CUA', description: 'Cuarto (3 unidades)', baseUnit: 'UND', conversionFactor: 3 },
  { id: 13, name: 'Trio', abbreviation: 'TRI', description: 'Trio (3 unidades)', baseUnit: 'UND', conversionFactor: 3 },
  { id: 14, name: 'Cuarteto', abbreviation: 'CUA', description: 'Cuarteto (4 unidades)', baseUnit: 'UND', conversionFactor: 4 },
  { id: 15, name: 'Quintal', abbreviation: 'QUI', description: 'Quintal (100 unidades)', baseUnit: 'UND', conversionFactor: 100 },
  { id: 16, name: 'Centena', abbreviation: 'CEN', description: 'Centena (100 unidades)', baseUnit: 'UND', conversionFactor: 100 },
  { id: 17, name: 'Millar', abbreviation: 'MIL', description: 'Millar (1000 unidades)', baseUnit: 'UND', conversionFactor: 1000 },
];

/**
 * Obtiene la información de conversión de una unidad por ID
 */
export function getUnitConversion(unitId: number): UnitConversion | undefined {
  return UNIT_CONVERSIONS.find(unit => unit.id === unitId);
}

/**
 * Obtiene la información de conversión de una unidad por abreviatura
 */
export function getUnitConversionByAbbreviation(abbreviation: string): UnitConversion | undefined {
  return UNIT_CONVERSIONS.find(unit => unit.abbreviation === abbreviation.toUpperCase());
}

/**
 * Convierte una cantidad de una unidad a otra
 * @param quantity Cantidad a convertir
 * @param fromUnitId ID de la unidad origen
 * @param toUnitId ID de la unidad destino
 * @returns Cantidad convertida
 */
export function convertUnits(quantity: number, fromUnitId: number, toUnitId: number): number {
  const fromUnit = getUnitConversion(fromUnitId);
  const toUnit = getUnitConversion(toUnitId);
  
  if (!fromUnit || !toUnit) {
    console.warn('Unidad de medida no encontrada:', { fromUnitId, toUnitId });
    return quantity; // Retorna la cantidad original si no se puede convertir
  }
  
  // Si las unidades base son diferentes, no se puede convertir directamente
  if (fromUnit.baseUnit !== toUnit.baseUnit) {
    console.warn('No se puede convertir entre unidades de diferentes tipos:', {
      fromUnit: fromUnit.name,
      toUnit: toUnit.name,
      fromBase: fromUnit.baseUnit,
      toBase: toUnit.baseUnit
    });
    return quantity;
  }
  
  // Convertir a unidad base y luego a unidad destino
  const baseQuantity = quantity * fromUnit.conversionFactor;
  const convertedQuantity = baseQuantity / toUnit.conversionFactor;
  
  return convertedQuantity;
}

/**
 * Convierte una cantidad a unidades individuales (UND)
 * @param quantity Cantidad a convertir
 * @param unitId ID de la unidad
 * @returns Cantidad en unidades individuales
 */
export function convertToIndividualUnits(quantity: number, unitId: number): number {
  const unit = getUnitConversion(unitId);
  
  if (!unit) {
    console.warn('Unidad de medida no encontrada:', unitId);
    return quantity;
  }
  
  return quantity * unit.conversionFactor;
}

/**
 * Convierte unidades individuales a otra unidad
 * @param individualQuantity Cantidad en unidades individuales
 * @param unitId ID de la unidad destino
 * @returns Cantidad en la unidad especificada
 */
export function convertFromIndividualUnits(individualQuantity: number, unitId: number): number {
  const unit = getUnitConversion(unitId);
  
  if (!unit) {
    console.warn('Unidad de medida no encontrada:', unitId);
    return individualQuantity;
  }
  
  return individualQuantity / unit.conversionFactor;
}

/**
 * Calcula el precio por unidad individual
 * @param totalPrice Precio total
 * @param quantity Cantidad
 * @param unitId ID de la unidad de la cantidad
 * @returns Precio por unidad individual
 */
export function calculatePricePerIndividualUnit(totalPrice: number, quantity: number, unitId: number): number {
  const individualUnits = convertToIndividualUnits(quantity, unitId);
  return individualUnits > 0 ? totalPrice / individualUnits : 0;
}

/**
 * Calcula el precio total basado en precio por unidad individual
 * @param pricePerUnit Precio por unidad individual
 * @param quantity Cantidad
 * @param unitId ID de la unidad de la cantidad
 * @returns Precio total
 */
export function calculateTotalPriceFromIndividualUnit(pricePerUnit: number, quantity: number, unitId: number): number {
  const individualUnits = convertToIndividualUnits(quantity, unitId);
  return pricePerUnit * individualUnits;
}

/**
 * Obtiene todas las unidades disponibles
 */
export function getAllUnits(): UnitConversion[] {
  return UNIT_CONVERSIONS;
}

/**
 * Obtiene unidades por tipo base
 */
export function getUnitsByBaseType(baseUnit: string): UnitConversion[] {
  return UNIT_CONVERSIONS.filter(unit => unit.baseUnit === baseUnit);
}

/**
 * Verifica si dos unidades son compatibles para conversión
 */
export function areUnitsCompatible(unitId1: number, unitId2: number): boolean {
  const unit1 = getUnitConversion(unitId1);
  const unit2 = getUnitConversion(unitId2);
  
  if (!unit1 || !unit2) return false;
  
  return unit1.baseUnit === unit2.baseUnit;
} 