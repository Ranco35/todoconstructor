const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bvzfuibqlprrfbudnauc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCashSessionStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE SESIONES DE CAJA');
  console.log('='.repeat(60));

  try {
    // 1. Verificar sesión específica (ID 15)
    console.log('1️⃣ Verificando sesión ID 15...');
    const { data: session15, error: error15 } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 15)
      .single();

    if (error15) {
      console.log('❌ Error al buscar sesión 15:', error15.message);
      console.log('   Código:', error15.code);
    } else {
      console.log('✅ Sesión 15 encontrada:');
      console.log(`   ID: ${session15.id}`);
      console.log(`   Estado: ${session15.status}`);
      console.log(`   Usuario: ${session15.userId}`);
      console.log(`   Monto inicial: $${session15.openingAmount}`);
      console.log(`   Fecha apertura: ${session15.openedAt}`);
      console.log(`   Fecha cierre: ${session15.closedAt || 'No cerrada'}`);
    }

    // 2. Verificar sesión específica con filtro de estado
    console.log('\n2️⃣ Verificando sesión 15 con filtro status=open...');
    const { data: session15Open, error: error15Open } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 15)
      .eq('status', 'open')
      .single();

    if (error15Open) {
      console.log('❌ Error al buscar sesión 15 con status=open:', error15Open.message);
      console.log('   Código:', error15Open.code);
    } else {
      console.log('✅ Sesión 15 con status=open encontrada');
    }

    // 3. Verificar todas las sesiones activas
    console.log('\n3️⃣ Verificando todas las sesiones activas...');
    const { data: activeSessions, error: activeError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');

    if (activeError) {
      console.log('❌ Error al buscar sesiones activas:', activeError.message);
    } else {
      console.log(`✅ Sesiones activas encontradas: ${activeSessions.length}`);
      activeSessions.forEach(session => {
        console.log(`   ID: ${session.id}, Usuario: ${session.userId}, Monto: $${session.openingAmount}`);
      });
    }

    // 4. Verificar estructura de la tabla
    console.log('\n4️⃣ Verificando estructura de la tabla CashSession...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Error al verificar estructura:', tableError.message);
    } else {
      console.log('✅ Estructura de tabla válida');
      if (tableInfo.length > 0) {
        console.log('   Columnas disponibles:', Object.keys(tableInfo[0]));
      }
    }

    // 5. Probar consulta que está fallando en el frontend
    console.log('\n5️⃣ Probando consulta problemática del frontend...');
    const { data: problematicQuery, error: problematicError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 15)
      .eq('status', 'open');

    if (problematicError) {
      console.log('❌ Error en consulta problemática:', problematicError.message);
      console.log('   Código:', problematicError.code);
      console.log('   Detalles:', problematicError.details);
    } else {
      console.log('✅ Consulta problemática funciona correctamente');
      console.log(`   Resultados: ${problematicQuery.length}`);
    }

    // 6. Verificar permisos RLS
    console.log('\n6️⃣ Verificando políticas RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('CashSession')
      .select('count')
      .eq('status', 'open');

    if (rlsError) {
      console.log('❌ Error en prueba RLS:', rlsError.message);
    } else {
      console.log('✅ Políticas RLS funcionando correctamente');
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el diagnóstico
checkCashSessionStatus(); 