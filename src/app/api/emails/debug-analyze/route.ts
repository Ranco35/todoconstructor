import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 API de análisis con debug detallado ejecutado');

  try {
    console.log('⚙️ Paso 1: Importando analyzeEmailsToday...');
    
    // Importar la función paso a paso
    let analyzeEmailsToday;
    try {
      const module = await import('@/actions/emails/analysis-actions');
      analyzeEmailsToday = module.analyzeEmailsToday;
      console.log('✅ Función analyzeEmailsToday importada exitosamente');
    } catch (importError) {
      console.error('❌ Error importando analyzeEmailsToday:', importError);
      return NextResponse.json({
        success: false,
        error: 'Error importando función de análisis',
        step: 'import',
        details: importError instanceof Error ? importError.message : 'Error desconocido'
      }, { status: 500 });
    }

    console.log('⚙️ Paso 2: Ejecutando analyzeEmailsToday...');
    
    // Envolver la ejecución en try-catch específico
    let result;
    try {
      result = await analyzeEmailsToday();
      console.log('✅ Función analyzeEmailsToday ejecutada, resultado:', {
        success: result?.success,
        hasData: !!result?.data,
        hasError: !!result?.error,
        errorMessage: result?.error
      });
    } catch (executionError) {
      console.error('❌ Error ejecutando analyzeEmailsToday:', executionError);
      return NextResponse.json({
        success: false,
        error: 'Error ejecutando función de análisis',
        step: 'execution',
        details: {
          message: executionError instanceof Error ? executionError.message : 'Error desconocido',
          stack: executionError instanceof Error ? executionError.stack : undefined
        }
      }, { status: 500 });
    }

    console.log('⚙️ Paso 3: Procesando resultado...');
    
    if (!result) {
      console.error('❌ Resultado undefined de analyzeEmailsToday');
      return NextResponse.json({
        success: false,
        error: 'Función de análisis retornó undefined',
        step: 'result_processing'
      }, { status: 500 });
    }

    if (result.success) {
      console.log('✅ Análisis completado exitosamente');
      return NextResponse.json({
        success: true,
        message: 'Análisis debug completado exitosamente',
        data: result.data,
        debug: {
          step: 'completed',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.error('❌ Análisis falló con error:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Error desconocido en análisis',
        step: 'analysis_failed',
        debug: {
          resultStructure: Object.keys(result),
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

  } catch (generalError) {
    console.error('❌ Error general en debug de análisis:', generalError);
    return NextResponse.json({
      success: false,
      error: 'Error general en debug de análisis',
      step: 'general_error',
      details: {
        message: generalError instanceof Error ? generalError.message : 'Error desconocido',
        stack: generalError instanceof Error ? generalError.stack : undefined
      }
    }, { status: 500 });
  }
} 