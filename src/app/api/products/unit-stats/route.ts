import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Obtener estadísticas generales
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('id, unit');

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);
      return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 });
    }

    const totalProducts = products.length;
    const productsWithUnit = products.filter(p => p.unit && p.unit.trim() !== '').length;
    const productsWithoutUnit = totalProducts - productsWithUnit;

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

    // Función para normalizar unidad (simulada)
    const normalizeUnit = (unit: string): string => {
      const mappings: Record<string, string> = {
        'Pieza': 'UND',
        'Unidad': 'UND',
        'Kg': 'KG',
        'Kilogramo': 'KG',
        'Litro': 'LT',
        'Metro': 'MT',
        'Caja': 'CAJ',
        'Paquete': 'PAQ',
        'Docena': 'DOC',
        'Par': 'PAR',
        'Hora': 'HRA',
        'Día': 'DIA',
        'Noche': 'NOC',
        'Servicio': 'SER'
      };
      
      return mappings[unit] || 'UND';
    };

    // Identificar unidades que necesitan normalización
    const needsNormalization = uniqueUnits
      .filter(item => {
        const normalized = normalizeUnit(item.unit);
        return normalized !== item.unit;
      })
      .map(item => ({
        oldUnit: item.unit,
        newUnit: normalizeUnit(item.unit),
        count: item.count
      }));

    const stats = {
      totalProducts,
      productsWithUnit,
      productsWithoutUnit,
      uniqueUnits,
      needsNormalization
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error en unit-stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 