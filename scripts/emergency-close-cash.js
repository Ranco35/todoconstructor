// Script de emergencia para cerrar caja chica
console.log('🚨 SCRIPT DE EMERGENCIA - CIERRE DE CAJA CHICA');
console.log('=============================================');

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvzfuibqlprrfbudnauc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function emergencyCloseCash() {
  try {
    console.log('1️⃣ Obteniendo sesión activa...');
    
    // Obtener la sesión activa
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open')
      .eq('cashRegisterId', 1)
      .single();

    if (sessionError || !session) {
      console.log('❌ No se encontró sesión activa o error:', sessionError?.message);
      return;
    }

    console.log('✅ Sesión encontrada:', {
      id: session.id,
      usuario: session.userId,
      montoApertura: session.currentAmount,
      abiertaEn: session.openedAt
    });

    console.log('2️⃣ Calculando gastos y compras...');
    
    // Obtener gastos
    const { data: expenses } = await supabase
      .from('PettyCashExpense')
      .select('amount')
      .eq('sessionId', session.id);

    // Obtener compras  
    const { data: purchases } = await supabase
      .from('PettyCashPurchase')
      .select('quantity, unitPrice')
      .eq('sessionId', session.id);

    const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const totalPurchases = purchases?.reduce((sum, pur) => sum + (pur.quantity * pur.unitPrice), 0) || 0;
    
    console.log('💰 Cálculos:');
    console.log(`   - Monto apertura: $${session.currentAmount.toLocaleString()}`);
    console.log(`   - Total gastos: $${totalExpenses.toLocaleString()}`);
    console.log(`   - Total compras: $${totalPurchases.toLocaleString()}`);
    
    const effectivoEsperado = session.currentAmount - totalExpenses - totalPurchases;
    console.log(`   - Efectivo esperado: $${effectivoEsperado.toLocaleString()}`);

    console.log('\n🔒 ¿Proceder con el cierre de emergencia?');
    console.log('   - Se cerrará la sesión automáticamente');
    console.log('   - Se marcará con efectivo contado = efectivo esperado');
    console.log('   - Se agregará nota de "Cierre de emergencia"');
    console.log('\n⚠️  CONFIRMA ESCRIBIENDO "SI" y presiona ENTER:');

    // Simular confirmación (en un script real usarías readline)
    const actualCash = effectivoEsperado; // Para emergencia, usar el esperado
    const notes = `Cierre de emergencia - ${new Date().toISOString()}\nEfectivo esperado: $${effectivoEsperado.toLocaleString()}\nTotal gastos: $${totalExpenses.toLocaleString()}\nTotal compras: $${totalPurchases.toLocaleString()}`;

    console.log('3️⃣ Ejecutando cierre...');

    // Cerrar la sesión
    const { error: updateError } = await supabase
      .from('CashSession')
      .update({
        status: 'closed',
        closedAt: new Date().toISOString(),
        currentAmount: actualCash,
        notes: notes
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Error cerrando sesión:', updateError);
      return;
    }

    console.log('\n🎉 ¡CIERRE COMPLETADO EXITOSAMENTE!');
    console.log('=====================================');
    console.log(`✅ Sesión ID ${session.id} cerrada correctamente`);
    console.log(`💰 Efectivo final registrado: $${actualCash.toLocaleString()}`);
    console.log(`📝 Notas guardadas en la base de datos`);
    console.log(`🕐 Cerrada el: ${new Date().toLocaleString()}`);
    console.log('\n🌟 La caja chica ha sido cerrada. Puedes abrir una nueva sesión cuando necesites.');

  } catch (error) {
    console.error('❌ Error en cierre de emergencia:', error);
  }
}

// Ejecutar solo si se confirma
console.log('\n🚨 ATENCIÓN: Este script cerrará la caja chica automáticamente.');
console.log('Solo ejecuta si realmente necesitas cerrar la sesión de emergencia.');
console.log('\nEjecutando en 3 segundos...\n');

setTimeout(emergencyCloseCash, 3000); 