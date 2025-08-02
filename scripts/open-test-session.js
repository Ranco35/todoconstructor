const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ibpbclxszblystwffxzn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTE5NzQ5MywiZXhwIjoyMDM0NzczNDkzfQ.hHCcQ6dQON7_3bgjYGqj-K9bMQnGqgJ6lzCJD7UJ1bw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function openTestSession() {
  try {
    console.log('🔧 ABRIENDO SESIÓN DE PRUEBA PARA CLOSURE MODAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Verificar si ya hay sesión activa
    console.log('\n1️⃣ VERIFICANDO SESIÓN EXISTENTE...');
    const { data: existingSession } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open')
      .eq('cashRegisterId', 1)
      .single();

    if (existingSession) {
      console.log('⚠️ Ya hay una sesión activa:');
      console.log(`   ID: ${existingSession.id}`);
      console.log(`   Monto: $${existingSession.openingAmount.toLocaleString()}`);
      console.log(`   Usuario: ${existingSession.userId}`);
      
      // Usar la sesión existente
      const sessionId = existingSession.id;
      console.log('\n   ✅ Usando sesión existente para agregar transacciones de prueba...');
      
      // Agregar transacciones de prueba
      await addTestTransactions(sessionId);
      return;
    }

    // 2. Buscar usuario Eduardo
    console.log('\n2️⃣ BUSCANDO USUARIO EDUARDO...');
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .ilike('name', '%eduardo%')
      .single();

    if (userError || !user) {
      console.log('❌ Usuario Eduardo no encontrado:', userError?.message);
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Role: ${user.role}`);

    // 3. Crear nueva sesión
    console.log('\n3️⃣ CREANDO NUEVA SESIÓN...');
    const { data: newSession, error: sessionError } = await supabase
      .from('CashSession')
      .insert({
        cashRegisterId: 1,
        userId: user.id,
        openingAmount: 1000,
        currentAmount: 1000,
        status: 'open',
        openedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.log('❌ Error creando sesión:', sessionError);
      return;
    }

    console.log('✅ Sesión creada:');
    console.log(`   ID: ${newSession.id}`);
    console.log(`   Monto: $${newSession.openingAmount.toLocaleString()}`);

    // 4. Agregar transacciones de prueba
    await addTestTransactions(newSession.id);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function addTestTransactions(sessionId) {
  console.log('\n4️⃣ AGREGANDO TRANSACCIONES DE PRUEBA...');
  
  try {
    // Agregar gastos de prueba
    const { data: expense1, error: exp1Error } = await supabase
      .from('PettyCashExpense')
      .insert({
        sessionId: sessionId,
        amount: 100,
        description: 'Lechugas para el restaurante',
        category: 'Alimentos',
        costCenterId: 1,
        receiptNumber: 'REC-001',
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (exp1Error) {
      console.log('❌ Error gasto 1:', exp1Error);
    } else {
      console.log(`✅ Gasto 1 agregado: $${expense1.amount} - ${expense1.description}`);
    }

    const { data: expense2, error: exp2Error } = await supabase
      .from('PettyCashExpense')
      .insert({
        sessionId: sessionId,
        amount: 1000,
        description: 'Pago part time cocina',
        category: 'Personal',
        costCenterId: 1,
        receiptNumber: 'REC-002',
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (exp2Error) {
      console.log('❌ Error gasto 2:', exp2Error);
    } else {
      console.log(`✅ Gasto 2 agregado: $${expense2.amount} - ${expense2.description}`);
    }

    // Agregar una compra de prueba
    const { data: purchase1, error: pur1Error } = await supabase
      .from('PettyCashPurchase')
      .insert({
        sessionId: sessionId,
        productId: 'Papel higiénico',
        quantity: 2,
        unitPrice: 50,
        description: 'Papel higiénico para baños',
        supplierId: 1,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (pur1Error) {
      console.log('❌ Error compra 1:', pur1Error);
    } else {
      console.log(`✅ Compra 1 agregada: $${purchase1.quantity * purchase1.unitPrice} - ${purchase1.description}`);
    }

    // Resumen final
    console.log('\n📊 RESUMEN DE TRANSACCIONES AGREGADAS:');
    console.log(`   💸 Gastos: $${100 + 1000} (Lechugas + Part time)`);
    console.log(`   🛍️ Compras: $${2 * 50} (Papel higiénico)`);
    console.log(`   💰 Total gastado: $${100 + 1000 + (2 * 50)}`);
    console.log(`   🎯 Efectivo esperado: $${1000 - (100 + 1000 + (2 * 50))}`);

    console.log('\n✅ LISTO PARA PROBAR CLOSURE MODAL');
    console.log(`   Ve a: http://localhost:3000/dashboard/pettyCash`);
    console.log(`   Sesión ID: ${sessionId}`);

  } catch (error) {
    console.error('❌ Error agregando transacciones:', error);
  }
}

openTestSession(); 