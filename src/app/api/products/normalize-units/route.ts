import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
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

    // Obtener todos los productos
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('id, unit');

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);
      return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 });
    }

    let updatedCount = 0;
    const updates: Array<{ id: number; unit: string }> = [];

    // Procesar cada producto
    for (const product of products) {
      const currentUnit = product.unit || '';
      const normalizedUnit = normalizeUnit(currentUnit);
      
      if (currentUnit !== normalizedUnit) {
        updates.push({
          id: product.id,
          unit: normalizedUnit
        });
      }
    }

    // Actualizar productos en lotes
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('Product')
          .update({ unit: update.unit })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error actualizando producto ${update.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      total: products.length,
      message: `Se normalizaron ${updatedCount} productos de ${products.length} total`
    });

  } catch (error) {
    console.error('Error en normalize-units:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 