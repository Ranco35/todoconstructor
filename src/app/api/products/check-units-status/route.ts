import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Obtener todos los productos con sus unidades
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('id, name, unit');

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);
      return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 });
    }

    const totalProducts = products.length;
    const productsWithUnit = products.filter(p => p.unit && p.unit.trim() !== '').length;
    const productsWithoutUnit = totalProducts - productsWithUnit;
    const productsWithUND = products.filter(p => p.unit === 'UND').length;
    const productsWithOtherUnits = products.filter(p => p.unit && p.unit.trim() !== '' && p.unit !== 'UND').length;

    // Obtener unidades únicas
    const unitCounts = products
      .filter(p => p.unit && p.unit.trim() !== '')
      .reduce((acc, product) => {
        const unit = product.unit.trim();
        acc[unit] = (acc[unit] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const uniqueUnits = Object.entries(unitCounts).map(([unit, count]) => ({
      unit,
      count
    })).sort((a, b) => b.count - a.count);

    // Productos sin unidad
    const productsWithoutUnitList = products
      .filter(p => !p.unit || p.unit.trim() === '')
      .map(p => ({
        id: p.id,
        name: p.name,
        unit: p.unit || null
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Productos con UND
    const productsWithUNDList = products
      .filter(p => p.unit === 'UND')
      .map(p => ({
        id: p.id,
        name: p.name,
        unit: p.unit
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10); // Solo mostrar los primeros 10

    // Productos con otras unidades
    const productsWithOtherUnitsList = products
      .filter(p => p.unit && p.unit.trim() !== '' && p.unit !== 'UND')
      .map(p => ({
        id: p.id,
        name: p.name,
        unit: p.unit
      }))
      .sort((a, b) => a.unit.localeCompare(b.unit))
      .slice(0, 10); // Solo mostrar los primeros 10

    const status = {
      totalProducts,
      productsWithUnit,
      productsWithoutUnit,
      productsWithUND,
      productsWithOtherUnits,
      percentageWithUnit: Math.round((productsWithUnit / totalProducts) * 100),
      percentageWithUND: Math.round((productsWithUND / totalProducts) * 100),
      uniqueUnits,
      productsWithoutUnitList,
      productsWithUNDList,
      productsWithOtherUnitsList,
      allProductsHaveUnit: productsWithoutUnit === 0,
      allProductsHaveUND: productsWithoutUnit === 0 && productsWithOtherUnits === 0
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('Error en check-units-status:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 