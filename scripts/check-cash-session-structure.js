require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCashSessionStructure() {
  try {
    console.log('🔍 Verificando estructura real de la tabla CashSession...');
    
    // Intentar crear una sesión con solo las columnas básicas
    console.log('\n🧪 Probando inserción con columnas mínimas...');
    
    const minimalSession = {
      userId: '00000000-0000-0000-0000-000000000000',
      cashRegisterId: 1,
      openingAmount: 1000,
      currentAmount: 1000,
      status: 'open',
      openedAt: new Date().toISOString()
    };
    
    console.log('📋 Intentando insertar con estas columnas:', Object.keys(minimalSession));
    
    const { data: testSession, error: testError } = await supabase
      .from('CashSession')
      .insert(minimalSession)
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Error con columnas mínimas:', testError);
      
      // Probar sin currentAmount
      console.log('\n🧪 Probando sin currentAmount...');
      const { data: test2, error: error2 } = await supabase
        .from('CashSession')
        .insert({
          userId: '00000000-0000-0000-0000-000000000000',
          cashRegisterId: 1,
          openingAmount: 1000,
          status: 'open',
          openedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error2) {
        console.error('❌ Error sin currentAmount:', error2);
      } else {
        console.log('✅ Éxito sin currentAmount');
        console.log('📋 Estructura real:', Object.keys(test2));
        console.log('📋 Datos:', test2);
        
        // Limpiar
        await supabase.from('CashSession').delete().eq('id', test2.id);
      }
    } else {
      console.log('✅ Éxito con columnas mínimas');
      console.log('📋 Estructura real:', Object.keys(testSession));
      console.log('📋 Datos:', testSession);
      
      // Limpiar
      await supabase.from('CashSession').delete().eq('id', testSession.id);
    }
    
    // Verificar si existe algún usuario válido
    console.log('\n🔍 Verificando usuarios disponibles...');
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, name, email')
      .limit(3);
    
    if (userError) {
      console.error('❌ Error al consultar usuarios:', userError);
    } else {
      console.log(`✅ Usuarios disponibles: ${users?.length || 0}`);
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, Nombre: ${user.name}, Email: ${user.email}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCashSessionStructure(); 