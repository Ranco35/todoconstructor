const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ibpbclxszblystwffxzn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTE5NzQ5MywiZXhwIjoyMDM0NzczNDkzfQ.hHCcQ6dQON7_3bgjYGqj-K9bMQnGqgJ6lzCJD7UJ1bw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUserAndSession() {
  try {
    console.log('🚀 CREANDO USUARIO Y SESIÓN DE PRUEBA');
    console.log('════════════════════════════════════════');
    
    // 1. Verificar usuarios existentes
    console.log('🔍 Verificando usuarios existentes...');
    const { data: existingUsers } = await supabase
      .from('User')
      .select('*')
      .limit(5);
    
    console.log(`📊 Usuarios existentes: ${existingUsers?.length || 0}`);
    
    let user;
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Usuarios encontrados:');
      existingUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.name || u.firstName || 'Sin nombre'} (${u.email || u.id})`);
      });
      user = existingUsers[0];
      console.log(`✅ Usando usuario existente: ${user.name || user.firstName || 'Sin nombre'}`);
    } else {
      // 2. Crear usuario de prueba si no existe ninguno
      console.log('\n👤 Creando usuario de prueba...');
      
      const userData = {
        id: 'd5a89886-4457-4373-8014-d3e0c4426e35', // UUID fijo para pruebas
        name: 'Usuario de Prueba',
        firstName: 'Usuario',
        lastName: 'Prueba',
        email: 'prueba@admintermas.com',
        role: 'CAJERO',
        isCashier: true,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      const { data: newUser, error: userError } = await supabase
        .from('User')
        .insert(userData)
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Error al crear usuario:', userError);
        return;
      }
      
      user = newUser;
      console.log(`✅ Usuario creado: ${user.name} (${user.email})`);
    }
    
    // 3. Verificar/crear caja registradora
    console.log('\n🏪 Verificando caja registradora...');
    let { data: cashRegister } = await supabase
      .from('CashRegister')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (!cashRegister) {
      console.log('🆕 Creando caja registradora...');
      const { data: newCashRegister, error: cashRegisterError } = await supabase
        .from('CashRegister')
        .insert({
          id: 1,
          name: 'Caja Principal',
          location: 'Oficina Principal',
          isActive: true
        })
        .select()
        .single();
      
      if (cashRegisterError) {
        console.error('❌ Error al crear caja registradora:', cashRegisterError);
        return;
      }
      
      cashRegister = newCashRegister;
    }
    
    console.log(`✅ Caja registradora: ${cashRegister.name}`);
    
    // 4. Cerrar sesiones previas
    console.log('\n🔒 Cerrando sesiones previas...');
    await supabase
      .from('CashSession')
      .update({ status: 'closed', closedAt: new Date().toISOString() })
      .eq('status', 'open');
    
    console.log('✅ Sesiones previas cerradas');
    
    // 5. Crear nueva sesión
    console.log('\n🆕 Creando nueva sesión...');
    const sessionData = {
      userId: user.id,
      cashRegisterId: 1,
      openingAmount: 100,
      currentAmount: 100,
      status: 'open',
      openedAt: new Date().toISOString(),
      notes: 'Sesión de prueba para test de cierre'
    };
    
    const { data: newSession, error: sessionError } = await supabase
      .from('CashSession')
      .insert(sessionData)
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error al crear sesión:', sessionError);
      return;
    }
    
    console.log('✅ SESIÓN CREADA:');
    console.log(`   ID: ${newSession.id}`);
    console.log(`   Usuario: ${user.name || user.firstName}`);
    console.log(`   Monto inicial: $${newSession.openingAmount.toLocaleString()}`);
    
    // 6. Crear centros de costo si no existen
    console.log('\n🏢 Verificando centros de costo...');
    let { data: costCenter } = await supabase
      .from('CostCenter')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (!costCenter) {
      const { data: newCostCenter } = await supabase
        .from('CostCenter')
        .insert({
          id: 1,
          name: 'Oficina Principal',
          description: 'Centro de costo principal',
          isActive: true
        })
        .select()
        .single();
      costCenter = newCostCenter;
      console.log('✅ Centro de costo creado');
    } else {
      console.log('✅ Centro de costo existente');
    }
    
    // 7. Agregar transacciones de prueba
    console.log('\n💸 Agregando transacciones de prueba...');
    
    try {
      // Agregar un gasto
      await supabase
        .from('PettyCashExpense')
        .insert({
          sessionId: newSession.id,
          amount: 50,
          description: 'Gasto de prueba para testing',
          category: 'Oficina',
          costCenterId: 1,
          receiptNumber: 'TEST-001',
          createdAt: new Date().toISOString()
        });
        
      console.log('   ✅ Gasto agregado: $50');
    } catch (expenseError) {
      console.log('   ⚠️ No se pudo agregar gasto:', expenseError.message);
    }
      
    try {
      // Verificar/crear proveedor
      let { data: supplier } = await supabase
        .from('Supplier')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (!supplier) {
        const { data: newSupplier } = await supabase
          .from('Supplier')
          .insert({
            id: 1,
            name: 'Proveedor de Prueba',
            email: 'proveedor@prueba.com',
            isActive: true
          })
          .select()
          .single();
        supplier = newSupplier;
      }
      
      // Verificar/crear producto
      let { data: product } = await supabase
        .from('Product')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (!product) {
        const { data: newProduct } = await supabase
          .from('Product')
          .insert({
            id: 1,
            name: 'Producto de Prueba',
            description: 'Producto para testing',
            price: 25,
            isActive: true
          })
          .select()
          .single();
        product = newProduct;
      }
      
      // Agregar una compra  
      await supabase
        .from('PettyCashPurchase')
        .insert({
          sessionId: newSession.id,
          productId: 1,
          quantity: 2,
          unitPrice: 25,
          costCenterId: 1,
          supplierId: 1,
          createdAt: new Date().toISOString()
        });
        
      console.log('   ✅ Compra agregada: 2 x $25 = $50');
    } catch (purchaseError) {
      console.log('   ⚠️ No se pudo agregar compra:', purchaseError.message);
    }
    
    console.log('\n🎯 CONFIGURACIÓN COMPLETA:');
    console.log('════════════════════════════');
    console.log(`   👤 Usuario: ${user.name || user.firstName} (${user.email})`);
    console.log(`   💰 Sesión ID: ${newSession.id}`);
    console.log(`   💵 Efectivo inicial: $100`);
    console.log(`   💸 Total gastos/compras: $100`);
    console.log(`   🎯 Efectivo esperado: $0`);
    console.log('');
    console.log(`🌐 URL: http://localhost:3000/dashboard/pettyCash`);
    console.log('📋 Ahora puedes probar el cierre de caja en la interfaz!');
    console.log('⚠️  Caso perfecto para probar déficit (efectivo esperado negativo)');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

createTestUserAndSession(); 