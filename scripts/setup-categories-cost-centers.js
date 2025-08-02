const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function setupCategoriesAndCostCenters() {
  console.log('🚀 Configurando categorías y centros de costo...');

  try {
    // 1. Insertar categorías básicas
    console.log('📁 Insertando categorías...');
    
    const categories = [
      { name: 'Gastos Generales', description: 'Gastos generales de operación' },
      { name: 'Materiales de Oficina', description: 'Papelería y suministros de oficina' },
      { name: 'Servicios', description: 'Servicios varios y mantenimiento' },
      { name: 'Transporte', description: 'Gastos de transporte y combustible' },
      { name: 'Alimentación', description: 'Gastos de alimentación y catering' },
      { name: 'Limpieza', description: 'Materiales y servicios de limpieza' },
      { name: 'Tecnología', description: 'Equipos y servicios tecnológicos' },
      { name: 'Marketing', description: 'Gastos de marketing y publicidad' }
    ];

    for (const category of categories) {
      const { data: existingCategory } = await supabase
        .from('Category')
        .select('id')
        .eq('name', category.name)
        .single();

      if (!existingCategory) {
        const { error } = await supabase
          .from('Category')
          .insert(category);

        if (error) {
          console.error(`❌ Error insertando categoría ${category.name}:`, error);
        } else {
          console.log(`✅ Categoría creada: ${category.name}`);
        }
      } else {
        console.log(`⏭️ Categoría ya existe: ${category.name}`);
      }
    }

    // 2. Insertar centros de costo básicos
    console.log('\n🏢 Insertando centros de costo...');
    
    const costCenters = [
      { 
        name: 'Administración', 
        code: 'ADM', 
        description: 'Centro administrativo principal',
        parentId: null,
        isActive: true
      },
      { 
        name: 'Operaciones', 
        code: 'OPE', 
        description: 'Centro operativo principal',
        parentId: null,
        isActive: true
      },
      { 
        name: 'Ventas', 
        code: 'VEN', 
        description: 'Centro de ventas y comercialización',
        parentId: null,
        isActive: true
      },
      { 
        name: 'Finanzas', 
        code: 'FIN', 
        description: 'Centro financiero y contable',
        parentId: null,
        isActive: true
      },
      { 
        name: 'Recursos Humanos', 
        code: 'RH', 
        description: 'Centro de recursos humanos',
        parentId: null,
        isActive: true
      },
      { 
        name: 'Tecnología', 
        code: 'TI', 
        description: 'Centro de tecnología e informática',
        parentId: null,
        isActive: true
      }
    ];

    for (const costCenter of costCenters) {
      const { data: existingCenter } = await supabase
        .from('Cost_Center')
        .select('id')
        .eq('code', costCenter.code)
        .single();

      if (!existingCenter) {
        const { error } = await supabase
          .from('Cost_Center')
          .insert(costCenter);

        if (error) {
          console.error(`❌ Error insertando centro de costo ${costCenter.name}:`, error);
        } else {
          console.log(`✅ Centro de costo creado: ${costCenter.name} (${costCenter.code})`);
        }
      } else {
        console.log(`⏭️ Centro de costo ya existe: ${costCenter.name} (${costCenter.code})`);
      }
    }

    console.log('\n✅ Configuración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  }
}

// Ejecutar el script
setupCategoriesAndCostCenters(); 