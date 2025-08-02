import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmailsToday } from '@/actions/emails/analysis-actions';

// API Route para análisis automático de correos
// Esta ruta se puede llamar externamente (cron job) o internamente

export async function GET(request: NextRequest) {
  console.log('🕐 API de análisis de correos ejecutada');

  try {
    // Verificar si viene con un token de autorización para automatización
    const authHeader = request.headers.get('authorization');
    const urlToken = request.nextUrl.searchParams.get('token');
    
    // Token opcional para automatización externa (cron jobs, webhooks, etc.)
    const validToken = process.env.EMAIL_ANALYSIS_TOKEN;
    
    if (validToken && authHeader !== `Bearer ${validToken}` && urlToken !== validToken) {
      console.log('⚠️ Análisis ejecutado sin token de autorización');
      // No bloquear - permitir ejecución manual desde el dashboard
    }

    // Ejecutar análisis
    const result = await analyzeEmailsToday();

    if (result.success) {
      console.log('✅ Análisis ejecutado exitosamente via API');
      return NextResponse.json({
        success: true,
        message: 'Análisis de correos completado',
        data: {
          analysisId: result.data?.id,
          timeSlot: result.data?.timeSlot,
          emailsAnalyzed: result.data?.emailsAnalyzed,
          executionTime: result.data?.executionTime
        }
      });
    } else {
      console.error('❌ Error en análisis via API:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error interno en API de análisis:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🕐 API POST de análisis de correos ejecutada');

  try {
    // Manejar requests sin body JSON
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.log('⚠️ Request sin body JSON válido, usando valores por defecto');
      body = {};
    }
    const { force = false } = body;

    // Si force es true, ejecuta análisis forzado
    if (force) {
      const { forceNewAnalysis } = await import('@/actions/emails/analysis-actions');
      const result = await forceNewAnalysis();

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Análisis forzado completado',
          data: result.data
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error
          },
          { status: 500 }
        );
      }
    }

    // Análisis normal con logging detallado
    console.log('⚙️ Iniciando análisis normal de correos...');
    const result = await analyzeEmailsToday();
    console.log('📊 Resultado de análisis:', { 
      success: result.success, 
      hasData: !!result.data,
      error: result.error 
    });

    if (result.success) {
      console.log('✅ Análisis completado exitosamente');
      return NextResponse.json({
        success: true,
        message: 'Análisis completado',
        data: result.data
      });
    } else {
      console.error('❌ Error en análisis:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Error desconocido en análisis'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error en POST de análisis:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
} 