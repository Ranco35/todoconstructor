const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCashClosureTable() {
  console.log('🔍 Verificando tabla CashClosure...');
  
  try {
    const { data, error } = await supabase
      .from('CashClosure')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('✅ Confirmado: CashClosure NO existe');
      }
    } else {
      console.log('⚠️ CashClosure SÍ existe');
      console.log('Datos:', data);
    }
  } catch (e) {
    console.log('❌ Excepción:', e.message);
  }
}

checkCashClosureTable(); 