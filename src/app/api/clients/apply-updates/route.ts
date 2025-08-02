import { NextRequest, NextResponse } from 'next/server';
import { applyConfirmedClientUpdates } from '@/actions/clients/import';

export async function POST(req: NextRequest) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Formato de datos inválido. Se esperaba un array de updates.' }, 
        { status: 400 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron updates para aplicar.' }, 
        { status: 400 }
      );
    }

    console.log(`📥 API: Recibiendo ${updates.length} updates confirmados para aplicar`);

    const result = await applyConfirmedClientUpdates(updates);

    console.log(`📤 API: Resultado de updates aplicados:`, result);

    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
      message: `Se actualizaron ${result.updated} clientes${result.errors.length > 0 ? ` con ${result.errors.length} errores` : ' exitosamente'}`
    });

  } catch (error) {
    console.error('❌ Error en API apply-updates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
} 