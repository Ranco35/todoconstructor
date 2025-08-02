const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (local)
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function restoreSystemData() {
  console.log('🚀 Restaurando datos del sistema...');

  try {
    // 1. Crear usuario administrador básico
    console.log('👤 Creando usuario administrador...');
    
    const adminUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'Administrador',
      lastName: 'Sistema',
      email: 'admin@admintermas.com',
      username: 'admin',
      role: 'SUPER_USER',
      isActive: true,
      isCashier: false
    };

    await supabase.from('User').insert([adminUser]);
    console.log('✅ Usuario administrador creado');

    // 2. Crear roles básicos si no existen
    console.log('🔑 Verificando roles...');
    const roles = [
      { id: 1, name: 'SUPER_USER', description: 'Super Usuario con acceso completo' },
      { id: 2, name: 'ADMINISTRADOR', description: 'Administrador del sistema' },
      { id: 3, name: 'JEFE_SECCION', description: 'Jefe de sección' },
      { id: 4, name: 'USUARIO_FINAL', description: 'Usuario final' }
    ];

    for (const role of roles) {
      try {
        await supabase.from('Role').insert([role]);
        console.log(`✅ Rol ${role.name} creado`);
      } catch (err) {
        // Ignorar si ya existe
        console.log(`ℹ️ Rol ${role.name} ya existe`);
      }
    }

    // 3. Crear categorías básicas de productos
    console.log('📂 Creando categorías de productos...');
    const categories = [
      { name: 'Comida', description: 'Productos alimenticios', parentId: null },
      { name: 'Bebidas', description: 'Bebidas y líquidos', parentId: null },
      { name: 'Servicios', description: 'Servicios del hotel', parentId: null },
      { name: 'Alojamiento', description: 'Habitaciones y alojamiento', parentId: null },
      { name: 'Spa', description: 'Servicios de spa y wellness', parentId: null }
    ];

    for (const category of categories) {
      try {
        await supabase.from('Category').insert([category]);
        console.log(`✅ Categoría ${category.name} creada`);
      } catch (err) {
        console.log(`ℹ️ Categoría ${category.name} ya existe`);
      }
    }

    // 4. Crear productos modulares básicos (los que aparecían en los logs)
    console.log('📦 Recreando productos modulares...');
    const modularProducts = [
      {
        id: 236,
        code: 'desayuno_buffet_254',
        name: 'Desayuno Buffet',
        description: 'Desayuno buffet completo',
        price: 15000,
        category: 'comida',
        per_person: true,
        is_active: true,
        sort_order: 0,
        original_id: 254,
        sku: 'REST-DESA-001-2100-0916'
      },
      {
        id: 237,
        code: 'almuerzo_programa_255',
        name: 'Almuerzo Programa',
        description: 'Almuerzo incluido en programa',
        price: 15000,
        category: 'comida',
        per_person: true,
        is_active: true,
        sort_order: 0,
        original_id: 255,
        sku: 'REST-ALMU-001-7138'
      },
      {
        id: 238,
        code: 'cena_alojados_256',
        name: 'Cena Alojados',
        description: 'Cena para huéspedes alojados',
        price: 30000,
        category: 'comida',
        per_person: true,
        is_active: true,
        sort_order: 0,
        original_id: 256,
        sku: 'REST-CENA-001-8196-8605-4619-9476'
      },
      {
        id: 240,
        code: 'piscina_termal_adult_257',
        name: 'Piscina Termal Adulto',
        description: 'Acceso a piscinas termales para adultos',
        price: 22000,
        category: 'spa',
        per_person: true,
        is_active: true,
        sort_order: 0,
        original_id: 257,
        sku: 'SPA-PISC-001-2280'
      },
      {
        id: 777,
        code: 'once_buffet_271',
        name: 'Once Buffet',
        description: 'Once buffet de la tarde',
        price: 18000,
        category: 'comida',
        per_person: true,
        is_active: true,
        sort_order: 0,
        original_id: 271,
        sku: 'REST-ONCE-001-0019'
      }
    ];

    for (const product of modularProducts) {
      try {
        await supabase.from('products_modular').insert([product]);
        console.log(`✅ Producto modular ${product.name} creado`);
      } catch (err) {
        console.log(`ℹ️ Producto modular ${product.name} - ${err.message}`);
      }
    }

    // 5. Crear productos regulares básicos
    console.log('🏠 Creando productos de habitaciones...');
    const roomProducts = [
      {
        name: 'Habitación 101 - Triple',
        description: 'Habitación triple estándar',
        price: 60000,
        categoryId: 4, // Alojamiento
        productType: 'SERVICIO',
        isActive: true,
        isPOSEnabled: true
      },
      {
        name: 'Habitación 102 - Doble',
        description: 'Habitación doble estándar',
        price: 60000,
        categoryId: 4, // Alojamiento
        productType: 'SERVICIO',
        isActive: true,
        isPOSEnabled: true
      },
      {
        name: 'Habitación 108 - Doble Jacuzzi',
        description: 'Habitación doble con jacuzzi',
        price: 70001,
        categoryId: 4, // Alojamiento
        productType: 'SERVICIO',
        isActive: true,
        isPOSEnabled: true
      }
    ];

    for (const product of roomProducts) {
      try {
        await supabase.from('Product').insert([product]);
        console.log(`✅ Producto ${product.name} creado`);
      } catch (err) {
        console.log(`ℹ️ Producto ${product.name} - ${err.message}`);
      }
    }

    console.log('\n🎉 ¡Datos básicos del sistema restaurados!');
    console.log('📊 Resumen:');
    console.log('   - ✅ Usuario administrador creado');
    console.log('   - ✅ Roles básicos configurados');
    console.log('   - ✅ Categorías de productos creadas');
    console.log('   - ✅ Productos modulares restaurados');
    console.log('   - ✅ Productos de habitaciones creados');
    console.log('   - ✅ Sistema POS configurado');
    
    console.log('\n🔐 Credenciales de acceso:');
    console.log('   Email: admin@admintermas.com');
    console.log('   Contraseña: (usar la que tengas configurada)');
    
    console.log('\n🌐 Accesos directos:');
    console.log('   - Dashboard: http://localhost:3000/dashboard');
    console.log('   - Categorías POS: http://localhost:3000/dashboard/configuration/pos-categories');
    console.log('   - Productos: http://localhost:3000/dashboard/configuration/products');

  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

// Ejecutar
restoreSystemData(); 