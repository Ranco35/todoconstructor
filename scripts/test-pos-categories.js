const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (local)
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertPOSCategories() {
  console.log('🚀 Insertando categorías POS de ejemplo...');

  const categories = [
    {
      name: 'comidas',
      displayName: 'Comidas',
      icon: '🍽️',
      color: '#FF6B6B',
      cashRegisterTypeId: 2, // Restaurante
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'bebidas',
      displayName: 'Bebidas',
      icon: '🥤',
      color: '#4ECDC4',
      cashRegisterTypeId: 2, // Restaurante
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'postres',
      displayName: 'Postres',
      icon: '🍰',
      color: '#FFE66D',
      cashRegisterTypeId: 2, // Restaurante
      isActive: true,
      sortOrder: 3
    },
    {
      name: 'entradas',
      displayName: 'Entradas',
      icon: '🥗',
      color: '#95E1D3',
      cashRegisterTypeId: 2, // Restaurante
      isActive: true,
      sortOrder: 4
    },
    {
      name: 'especiales',
      displayName: 'Especiales',
      icon: '⭐',
      color: '#F38BA8',
      cashRegisterTypeId: 2, // Restaurante
      isActive: true,
      sortOrder: 5
    },
    {
      name: 'servicios',
      displayName: 'Servicios',
      icon: '🛎️',
      color: '#A8DADC',
      cashRegisterTypeId: 1, // Recepción
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'productos',
      displayName: 'Productos',
      icon: '📦',
      color: '#457B9D',
      cashRegisterTypeId: 1, // Recepción
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'amenidades',
      displayName: 'Amenidades',
      icon: '🌿',
      color: '#1D3557',
      cashRegisterTypeId: 1, // Recepción
      isActive: true,
      sortOrder: 3
    }
  ];

  try {
    // Primero, limpiar categorías existentes
    console.log('🧹 Limpiando categorías existentes...');
    await supabase.from('POSProductCategory').delete().neq('id', 0);

    // Insertar nuevas categorías
    console.log('📝 Insertando nuevas categorías...');
    const { data, error } = await supabase
      .from('POSProductCategory')
      .insert(categories)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Categorías POS insertadas exitosamente:');
    data.forEach(cat => {
      console.log(`   - ${cat.displayName} (${cat.icon}) - ${cat.cashRegisterTypeId === 1 ? 'Recepción' : 'Restaurante'}`);
    });

    console.log('\n🎉 ¡Sistema de categorías POS listo para usar!');
    console.log('🌐 Puedes acceder a: http://localhost:3000/dashboard/configuration/pos-categories');

  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

// Ejecutar
insertPOSCategories(); 