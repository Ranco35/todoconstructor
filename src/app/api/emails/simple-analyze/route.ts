import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function GET(request: NextRequest) {
  console.log('🔍 API de análisis simplificado ejecutado');

  try {
    // Paso 1: Crear cliente Supabase
    console.log('⚙️ Paso 1: Creando cliente Supabase...');
    const supabase = await getSupabaseClient();
    console.log('✅ Cliente Supabase creado');

    // Paso 2: Importar configuración
    console.log('⚙️ Paso 2: Importando configuración...');
    try {
      const { getAnalysisSettings } = await import('@/actions/emails/analysis-config');
      const settings = await getAnalysisSettings();
      console.log('✅ Configuración importada:', { 
        maxEmails: settings.maxEmails, 
        textLimit: settings.textLimit 
      });
    } catch (configError) {
      console.error('❌ Error en configuración:', configError);
      return NextResponse.json({
        success: false,
        error: 'Error en configuración',
        step: 'configuration',
        details: configError instanceof Error ? configError.message : 'Error desconocido'
      }, { status: 500 });
    }

    // Paso 3: Probar función de emails
    console.log('⚙️ Paso 3: Probando función de emails...');
    try {
      const { getReceivedEmails } = await import('@/actions/emails/email-reader-actions');
      console.log('✅ Función getReceivedEmails importada');
      
      // Probar solo con parámetros básicos
      const emailsResult = await getReceivedEmails({
        dateFrom: new Date(),
        dateTo: new Date(),
        limit: 5,
        timeout: 5000 // 5 segundos solamente
      });
      
      console.log('📧 Resultado de emails:', {
        success: emailsResult.success,
        emailCount: emailsResult.emails?.length || 0,
        hasError: !!emailsResult.error
      });
      
    } catch (emailError) {
      console.error('❌ Error en función de emails:', emailError);
      return NextResponse.json({
        success: false,
        error: 'Error en función de emails',
        step: 'email_reading',
        details: emailError instanceof Error ? emailError.message : 'Error desconocido'
      }, { status: 500 });
    }

    // Paso 4: Probar base de datos
    console.log('⚙️ Paso 4: Probando consulta a base de datos...');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingAnalysis, error: dbError } = await supabase
      .from('EmailAnalysis')
      .select('*')
      .eq('analysisDate', today)
      .limit(1);

    if (dbError) {
      console.error('❌ Error en base de datos:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Error en base de datos',
        step: 'database',
        details: dbError
      }, { status: 500 });
    }

    console.log('✅ Base de datos consultada exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Análisis simplificado completado exitosamente',
      steps: {
        supabase: 'OK',
        configuration: 'OK',
        emailFunction: 'OK',
        database: 'OK'
      },
      data: {
        existingAnalysis: existingAnalysis?.length || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error general en análisis simplificado:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno en análisis simplificado',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 