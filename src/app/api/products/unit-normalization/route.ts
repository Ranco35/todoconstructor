import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Función para normalizar unidad
    const normalizeUnit = (unit: string): string => {
      const mappings: Record<string, string> = {
        'Pieza': 'UND',
        'Unidad': 'UND',
        'UND': 'UND',
        'Kg': 'KG',
        'KG': 'KG',
        'Kilogramo': 'KG',
        'Kilos': 'KG',
        'Gramo': 'GR',
        'GR': 'GR',
        'G': 'GR',
        'Litro': 'LT',
        'LT': 'LT',
        'L': 'LT',
        'Metro': 'MT',
        'MT': 'MT',
        'M': 'MT',
        'Centímetro': 'CM',
        'CM': 'CM',
        'Caja': 'CAJ',
        'CAJ': 'CAJ',
        'Paquete': 'PAQ',
        'PAQ': 'PAQ',
        'Pack': 'PAQ',
        'Docena': 'DOC',
        'DOC': 'DOC',
        'Par': 'PAR',
        'PAR': 'PAR',
        'Media Docena': 'MED',
        'MED': 'MED',
        'Centena': 'CEN',
        'CEN': 'CEN',
        'Millar': 'MIL',
        'MIL': 'MIL',
        'Hora': 'HRA',
        'HRA': 'HRA',
        'Día': 'DIA',
        'DIA': 'DIA',
        'Noche': 'NOC',
        'NOC': 'NOC',
        'Servicio': 'SER',
        'SER': 'SER',
        'Sesión': 'SES',
        'SES': 'SES'
      };
      
      if (!unit || unit.trim() === '') {
        return 'UND';
      }
      
      const trimmedUnit = unit.trim();
      return mappings[trimmedUnit] || 'UND';
    };

    // Obtener productos que necesitan normalización
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('id, name, unit')
      .not('unit', 'is', null);

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);
      return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 });
    }

    // Filtrar productos que necesitan normalización
    const productsNeedingNormalization = products
      .filter(product => {
        const currentUnit = product.unit || '';
        const normalizedUnit = normalizeUnit(currentUnit);
        return currentUnit !== normalizedUnit;
      })
      .map(product => ({
        id: product.id,
        name: product.name,
        unit: product.unit || '',
        normalizedUnit: normalizeUnit(product.unit || '')
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      products: productsNeedingNormalization,
      count: productsNeedingNormalization.length
    });

  } catch (error) {
    console.error('Error en unit-normalization:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 