#!/usr/bin/env node

/**
 * Script de verificación de salud del sistema
 * Verifica que todos los componentes críticos estén funcionando
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSystemHealth() {
  console.log('🏥 VERIFICACIÓN DE SALUD DEL SISTEMA');
  console.log('=====================================\n');

  const results = {
    database: false,
    emailAnalysis: false,
    userTable: false,
    coreModules: false,
    overallHealth: false
  };

  try {
    // 1. Verificar conexión a base de datos
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: dbTest, error: dbError } = await supabase
      .from('User')
      .select('count', { count: 'exact', head: true });
    
    if (dbError) {
      console.log('❌ Error de conexión:', dbError.message);
    } else {
      console.log('✅ Conexión a Supabase: OK');
      results.database = true;
    }

    // 2. Verificar tabla email_analysis
    console.log('\n2️⃣ Verificando tabla email_analysis...');
    const { data: emailTest, error: emailError } = await supabase
      .from('email_analysis')
      .select('count', { count: 'exact', head: true });
    
    if (emailError) {
      if (emailError.code === '42P01') {
        console.log('⚠️ Tabla email_analysis no existe - Se puede crear manualmente');
      } else {
        console.log('❌ Error accediendo email_analysis:', emailError.message);
      }
    } else {
      console.log('✅ Tabla email_analysis: OK');
      results.emailAnalysis = true;
    }

    // 3. Verificar tabla User
    console.log('\n3️⃣ Verificando tabla User...');
    const { data: userTest, error: userError } = await supabase
      .from('User')
      .select('id, name, email')
      .limit(1);
    
    if (userError) {
      console.log('❌ Error accediendo tabla User:', userError.message);
    } else {
      console.log('✅ Tabla User: OK');
      console.log(`📊 Usuarios encontrados: ${userTest?.length || 0}`);
      results.userTable = true;
    }

    // 4. Verificar módulos core del sistema
    console.log('\n4️⃣ Verificando módulos core...');
    const coreModules = [
      'Product',
      'Category', 
      'Warehouse',
      'Supplier',
      'CashSession',
      'Role'
    ];

    let coreModulesOK = 0;
    for (const module of coreModules) {
      try {
        const { error } = await supabase
          .from(module)
          .select('count', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ ${module}: OK`);
          coreModulesOK++;
        } else {
          console.log(`❌ ${module}: Error - ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${module}: No accesible`);
      }
    }

    results.coreModules = coreModulesOK === coreModules.length;
    console.log(`📊 Módulos core funcionando: ${coreModulesOK}/${coreModules.length}`);

    // 5. Evaluación general
    console.log('\n5️⃣ Evaluación general del sistema...');
    const healthScore = Object.values(results).filter(Boolean).length;
    const totalChecks = Object.keys(results).length - 1; // -1 para excluir overallHealth
    
    results.overallHealth = healthScore >= (totalChecks * 0.75); // 75% de salud mínima

    console.log('\n🔍 RESUMEN DE RESULTADOS:');
    console.log('=========================');
    console.log(`🔗 Conexión DB: ${results.database ? '✅' : '❌'}`);
    console.log(`📧 Email Analysis: ${results.emailAnalysis ? '✅' : '⚠️'}`);
    console.log(`👤 Tabla User: ${results.userTable ? '✅' : '❌'}`);
    console.log(`🏗️ Módulos Core: ${results.coreModules ? '✅' : '❌'}`);
    console.log(`\n🏥 SALUD GENERAL: ${results.overallHealth ? '✅ BUENA' : '❌ REQUIERE ATENCIÓN'}`);
    console.log(`📊 Puntuación: ${healthScore}/${totalChecks} (${Math.round(healthScore/totalChecks*100)}%)`);

    // 6. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('===================');
    
    if (!results.emailAnalysis) {
      console.log('🔧 Ejecutar migración para crear tabla email_analysis');
      console.log('   SQL: CREATE TABLE email_analysis (...)');
    }
    
    if (!results.database || !results.userTable) {
      console.log('🔧 Verificar configuración de Supabase y variables de entorno');
    }
    
    if (!results.coreModules) {
      console.log('🔧 Revisar migraciones pendientes en supabase/migrations/');
    }

    if (results.overallHealth) {
      console.log('🎉 Sistema en buen estado - Listo para operación normal');
    }

  } catch (error) {
    console.error('💥 Error crítico durante verificación:', error.message);
    console.log('\n🚨 SISTEMA NO OPERATIVO - Requiere intervención técnica');
  }

  console.log('\n' + '='.repeat(50));
  process.exit(results.overallHealth ? 0 : 1);
}

// Ejecutar verificación
checkSystemHealth().catch(console.error); 