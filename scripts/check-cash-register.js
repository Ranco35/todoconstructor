const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCashRegisters() {
  console.log('🔍 Verificando CashRegisters...');
  
  try {
    const { data: registers, error } = await supabase
      .from('CashRegister')
      .select('*');
      
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ CashRegisters encontrados:', registers?.length || 0);
    
    if (!registers || registers.length === 0) {
      console.log('⚠️ Creando CashRegister por defecto...');
      
      const { data: newRegister, error: createError } = await supabase
        .from('CashRegister')
        .insert({
          name: 'Caja Principal',
          location: 'Oficina Principal',
          isActive: true
        })
        .select()
        .single();
        
      if (createError) {
        console.log('❌ Error creando CashRegister:', createError.message);
      } else {
        console.log('✅ CashRegister creado:', newRegister);
      }
    } else {
      console.log('📋 CashRegisters existentes:');
      registers.forEach(reg => {
        console.log(`  - ID: ${reg.id}, Nombre: ${reg.name}, Ubicación: ${reg.location}`);
      });
    }
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCashRegisters(); 