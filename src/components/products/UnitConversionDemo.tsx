'use client';

import { useState } from 'react';
import { 
  convertUnits, 
  convertToIndividualUnits, 
  calculatePricePerIndividualUnit,
  calculateTotalPriceFromIndividualUnit,
  getUnitConversion,
  getAllUnits 
} from '@/utils/unit-conversions';

export default function UnitConversionDemo() {
  const [quantity, setQuantity] = useState(1);
  const [fromUnitId, setFromUnitId] = useState(9); // Docena por defecto
  const [toUnitId, setToUnitId] = useState(1); // Unidad por defecto
  const [price, setPrice] = useState(1200); // Precio por docena
  const [showCalculations, setShowCalculations] = useState(false);

  const units = getAllUnits();
  const fromUnit = getUnitConversion(fromUnitId);
  const toUnit = getUnitConversion(toUnitId);

  // Cálculos
  const convertedQuantity = convertUnits(quantity, fromUnitId, toUnitId);
  const individualUnits = convertToIndividualUnits(quantity, fromUnitId);
  const pricePerIndividualUnit = calculatePricePerIndividualUnit(price, quantity, fromUnitId);
  const totalPriceFromIndividual = calculateTotalPriceFromIndividualUnit(pricePerIndividualUnit, quantity, fromUnitId);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🧮 Demostración de Conversiones de Unidades</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entrada de datos */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidad Origen
            </label>
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.abbreviation}) - {unit.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidad Destino
            </label>
            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.abbreviation}) - {unit.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Total
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
            />
          </div>

          <button
            onClick={() => setShowCalculations(!showCalculations)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showCalculations ? 'Ocultar' : 'Mostrar'} Cálculos Detallados
          </button>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📊 Conversión Directa</h4>
            <p className="text-sm text-blue-700">
              <strong>{quantity} {fromUnit?.name}</strong> = <strong>{convertedQuantity.toFixed(2)} {toUnit?.name}</strong>
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">🔢 Unidades Individuales</h4>
            <p className="text-sm text-green-700">
              <strong>{quantity} {fromUnit?.name}</strong> = <strong>{individualUnits} unidades individuales</strong>
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">💰 Cálculos de Precio</h4>
            <p className="text-sm text-purple-700">
              Precio por unidad individual: <strong>${pricePerIndividualUnit.toFixed(2)}</strong>
            </p>
            <p className="text-sm text-purple-700">
              Precio total recalculado: <strong>${totalPriceFromIndividual.toFixed(2)}</strong>
            </p>
          </div>

          {showCalculations && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">📝 Cálculos Detallados</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Factor de conversión origen: {fromUnit?.conversionFactor}</p>
                <p>• Factor de conversión destino: {toUnit?.conversionFactor}</p>
                <p>• Unidad base origen: {fromUnit?.baseUnit}</p>
                <p>• Unidad base destino: {toUnit?.baseUnit}</p>
                <p>• Cantidad en unidades base: {quantity * (fromUnit?.conversionFactor || 1)}</p>
                <p>• Conversión: {quantity * (fromUnit?.conversionFactor || 1)} ÷ {toUnit?.conversionFactor || 1} = {convertedQuantity.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ejemplos prácticos */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-3">💡 Ejemplos Prácticos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-yellow-700 mb-2">🍞 Pan (Docena)</h5>
            <ul className="text-yellow-600 space-y-1">
              <li>• 1 docena = 12 unidades</li>
              <li>• Precio: $1,200 por docena</li>
              <li>• Precio por unidad: $100</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-yellow-700 mb-2">🥚 Huevos (Media Docena)</h5>
            <ul className="text-yellow-600 space-y-1">
              <li>• 1 media docena = 6 unidades</li>
              <li>• Precio: $600 por media docena</li>
              <li>• Precio por unidad: $100</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-yellow-700 mb-2">🥤 Bebidas (Par)</h5>
            <ul className="text-yellow-600 space-y-1">
              <li>• 1 par = 2 unidades</li>
              <li>• Precio: $200 por par</li>
              <li>• Precio por unidad: $100</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-yellow-700 mb-2">📦 Productos (Centena)</h5>
            <ul className="text-yellow-600 space-y-1">
              <li>• 1 centena = 100 unidades</li>
              <li>• Precio: $10,000 por centena</li>
              <li>• Precio por unidad: $100</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 