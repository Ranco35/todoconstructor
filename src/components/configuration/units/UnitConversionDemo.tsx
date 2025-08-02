'use client';

import { useState, useEffect } from 'react';
import { UnitMeasure } from '@/types/unit-measure';
import { getUnitMeasures, convertUnits } from '@/actions/configuration/unit-measure-actions';
import { Calculator, ArrowRight, Info } from 'lucide-react';

export default function UnitConversionDemo() {
  const [units, setUnits] = useState<UnitMeasure[]>([]);
  const [fromUnit, setFromUnit] = useState<number>(0);
  const [toUnit, setToUnit] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const { data } = await getUnitMeasures({ pageSize: 1000 });
        setUnits(data);
        
        // Establecer valores por defecto si hay unidades
        if (data.length >= 2) {
          setFromUnit(data[0].id);
          setToUnit(data[1].id);
        }
      } catch (error) {
        console.error('Error cargando unidades:', error);
      }
    };
    
    loadUnits();
  }, []);

  useEffect(() => {
    const performConversion = async () => {
      if (fromUnit && toUnit && quantity > 0) {
        try {
          setLoading(true);
          const convertedResult = await convertUnits(quantity, fromUnit, toUnit);
          setResult(convertedResult);
        } catch (error) {
          console.error('Error en conversión:', error);
          setResult(null);
        } finally {
          setLoading(false);
        }
      } else {
        setResult(null);
      }
    };

    // Debounce la conversión
    const timeoutId = setTimeout(performConversion, 300);
    return () => clearTimeout(timeoutId);
  }, [fromUnit, toUnit, quantity]);

  const getUnitDisplay = (unitId: number) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? `${unit.name} (${unit.abbreviation})` : '';
  };

  const getConversionExplanation = () => {
    const fromUnitData = units.find(u => u.id === fromUnit);
    const toUnitData = units.find(u => u.id === toUnit);
    
    if (!fromUnitData || !toUnitData) return null;

    // Si las unidades tienen la misma unidad base, podemos explicar la conversión
    if (fromUnitData.baseUnitId === toUnitData.baseUnitId) {
      return (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Conversión:</strong> {fromUnitData.name} → {toUnitData.name}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {fromUnitData.conversionFormula || `1 ${fromUnitData.abbreviation} = ${fromUnitData.conversionFactor} unidades base`}
          </p>
          {toUnitData.conversionFormula && (
            <p className="text-xs text-blue-600">
              {toUnitData.conversionFormula}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calculator className="w-5 h-5 mr-2 text-blue-600" />
        Demostración de Conversiones
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>

        {/* Unidad de origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            De (unidad origen)
          </label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>Seleccionar unidad</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.abbreviation})
              </option>
            ))}
          </select>
        </div>

        {/* Unidad de destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            A (unidad destino)
          </label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>Seleccionar unidad</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.abbreviation})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultado de la conversión */}
      {(fromUnit && toUnit && quantity > 0) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {quantity} {getUnitDisplay(fromUnit)}
              </div>
            </div>
            
            <ArrowRight className="w-6 h-6 text-blue-600" />
            
            <div className="text-center">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Calculando...</span>
                </div>
              ) : (
                <div className="text-lg font-semibold text-green-700">
                  {result !== null ? (
                    <>
                      {result.toFixed(4)} {getUnitDisplay(toUnit)}
                    </>
                  ) : (
                    'No se puede convertir'
                  )}
                </div>
              )}
            </div>
          </div>

          {getConversionExplanation()}
        </div>
      )}

      {/* Información de ayuda */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">💡 Cómo funciona la conversión:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Solo se pueden convertir unidades de la misma categoría</li>
              <li>Las conversiones usan factores matemáticos predefinidos</li>
              <li>Para unidades de empaque (como jajas), se pueden definir conversiones específicas por producto</li>
              <li>El sistema soporta conversiones complejas a través de unidades base</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ejemplos comunes */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">📚 Ejemplos comunes:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="p-2 bg-gray-50 rounded">
            <strong>Peso:</strong> 1 KG = 1000 GR
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <strong>Volumen:</strong> 1 LT = 1000 ML
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <strong>Cantidad:</strong> 1 DOC = 12 UND
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <strong>Personalizado:</strong> 1 JAB24 = 24 UND
          </div>
        </div>
      </div>
    </div>
  );
} 