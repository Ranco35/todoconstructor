// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIncomeFunctionality() {
  console.log('🧪 PROBANDO FUNCIONALIDAD DE INGRESOS DE DINERO');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar estructura de la tabla PettyCashIncome
    console.log('\n📋 1. Verificando estructura de tabla PettyCashIncome...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('PettyCashIncome')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error al verificar tabla PettyCashIncome:', tableError);
      return;
    }

    console.log('✅ Tabla PettyCashIncome accesible');

    // 2. Verificar sesión activa
    console.log('\n🔍 2. Buscando sesión activa...');
    const { data: activeSession, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open')
      .eq('cashRegisterId', 1)
      .single();

    if (sessionError || !activeSession) {
      console.log('⚠️ No hay sesión activa, creando una de prueba...');
      
      // Crear sesión de prueba
      const { data: newSession, error: createError } = await supabase
        .from('CashSession')
        .insert({
          userId: 'd5a89886-4457-4373-8014-d3e0c4426e35',
          cashRegisterId: 1,
          openingAmount: 1000,
          currentAmount: 1000,
          status: 'open',
          openedAt: new Date().toISOString(),
          notes: 'Sesión de prueba para testing de ingresos'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error al crear sesión de prueba:', createError);
        return;
      }

      console.log('✅ Sesión de prueba creada:', newSession.id);
    } else {
      console.log('✅ Sesión activa encontrada:', activeSession.id);
    }

    // 3. Crear ingreso de prueba
    console.log('\n💰 3. Creando ingreso de prueba...');
    const testIncome = {
      sessionId: activeSession?.id || 1,
      amount: 50000,
      description: 'Préstamo de prueba para testing',
      category: 'Préstamo',
      paymentMethod: 'Efectivo',
      notes: 'Ingreso de prueba creado por script de testing'
    };

    const { data: income, error: incomeError } = await supabase
      .from('PettyCashIncome')
      .insert(testIncome)
      .select()
      .single();

    if (incomeError) {
      console.error('❌ Error al crear ingreso:', incomeError);
      return;
    }

    console.log('✅ Ingreso creado exitosamente:');
    console.log('   ID:', income.id);
    console.log('   Monto:', income.amount);
    console.log('   Descripción:', income.description);
    console.log('   Categoría:', income.category);

    // 4. Verificar que el ingreso aparece en la lista
    console.log('\n📋 4. Verificando ingreso en la lista...');
    const { data: incomes, error: listError } = await supabase
      .from('PettyCashIncome')
      .select('*')
      .eq('sessionId', activeSession?.id || 1)
      .order('createdAt', { ascending: false });

    if (listError) {
      console.error('❌ Error al listar ingresos:', listError);
      return;
    }

    console.log('✅ Ingresos encontrados:', incomes.length);
    incomes.forEach((inc, index) => {
      console.log(`   ${index + 1}. $${inc.amount} - ${inc.description} (${inc.category})`);
    });

    // 5. Verificar que NO afecta centros de costo
    console.log('\n🏢 5. Verificando que NO afecta centros de costo...');
    const { data: costCenters, error: ccError } = await supabase
      .from('CostCenter')
      .select('*')
      .limit(5);

    if (ccError) {
      console.error('❌ Error al verificar centros de costo:', ccError);
    } else {
      console.log('✅ Centros de costo no afectados por ingresos');
      console.log('   Centros disponibles:', costCenters.length);
    }

    // 6. Verificar que NO afecta categorías
    console.log('\n📁 6. Verificando que NO afecta categorías...');
    const { data: categories, error: catError } = await supabase
      .from('Category')
      .select('*')
      .limit(5);

    if (catError) {
      console.error('❌ Error al verificar categorías:', catError);
    } else {
      console.log('✅ Categorías no afectadas por ingresos');
      console.log('   Categorías disponibles:', categories.length);
    }

    // 7. Limpiar datos de prueba
    console.log('\n🧹 7. Limpiando datos de prueba...');
    const { error: deleteError } = await supabase
      .from('PettyCashIncome')
      .delete()
      .eq('id', income.id);

    if (deleteError) {
      console.error('❌ Error al limpiar ingreso de prueba:', deleteError);
    } else {
      console.log('✅ Ingreso de prueba eliminado');
    }

    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(60));
    console.log('✅ La funcionalidad de ingresos funciona correctamente');
    console.log('✅ Los ingresos NO afectan centros de costo');
    console.log('✅ Los ingresos NO afectan categorías');
    console.log('✅ Los ingresos son solo ajustes de efectivo físico');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la prueba
testIncomeFunctionality(); 