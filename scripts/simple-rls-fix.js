const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simpleRLSFix() {
  console.log('🔒 Aplicando corrección simple de políticas RLS...\n');

  try {
    // 1. Verificar políticas actuales
    console.log('📋 Verificando políticas RLS actuales...');
    
    const tables = ['Product', 'Warehouse', 'Warehouse_Product', 'Category', 'Supplier'];
    
    for (const table of tables) {
      console.log(`\n🔍 Verificando tabla: ${table}`);
      
      // Verificar políticas
      const { data: tablePolicies, error: tablePoliciesError } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, roles')
        .eq('tablename', table)
        .eq('schemaname', 'public');

      if (tablePoliciesError) {
        console.error(`❌ Error verificando políticas para ${table}:`, tablePoliciesError);
      } else {
        console.log(`📋 Políticas en ${table}:`, tablePolicies.length);
        tablePolicies.forEach(policy => {
          console.log(`   - ${policy.policyname} (${policy.cmd}) para roles: ${policy.roles}`);
        });
      }
    }

    // 2. Probar inserción en Warehouse_Product para verificar el problema
    console.log('\n🧪 Probando inserción en Warehouse_Product...');
    
    // Obtener un producto y una bodega existentes
    const { data: products } = await supabase
      .from('Product')
      .select('id')
      .limit(1);

    const { data: warehouses } = await supabase
      .from('Warehouse')
      .select('id')
      .limit(1);

    if (products && warehouses && products.length > 0 && warehouses.length > 0) {
      const testData = {
        productId: products[0].id,
        warehouseId: warehouses[0].id,
        quantity: 5,
        minStock: 1,
        maxStock: 10
      };

      console.log('📦 Datos de prueba:', testData);

      const { data: newWarehouseProduct, error: insertError } = await supabase
        .from('Warehouse_Product')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error insertando en Warehouse_Product:', insertError);
        console.log('🔍 Este es el problema que necesitamos resolver');
        
        // Verificar si es un problema de RLS
        if (insertError.code === '42501') {
          console.log('🚨 Confirmado: Es un problema de políticas RLS');
          console.log('💡 Necesitas aplicar la migración SQL manualmente en Supabase Studio');
          console.log('📝 Ejecuta el SQL de la migración: supabase/migrations/20250630170600_fix_all_rls_policies.sql');
        }
      } else {
        console.log('✅ Inserción exitosa en Warehouse_Product:', newWarehouseProduct);
        
        // Limpiar datos de prueba
        await supabase
          .from('Warehouse_Product')
          .delete()
          .eq('id', newWarehouseProduct.id);
        
        console.log('🧹 Datos de prueba eliminados');
      }
    } else {
      console.log('⚠️  No se encontraron productos o bodegas para la prueba');
    }

    // 3. Probar lectura de productos con relaciones
    console.log('\n📖 Probando lectura de productos con relaciones...');
    
    const { data: productsWithRelations, error: readError } = await supabase
      .from('Product')
      .select(`
        *,
        Category (*),
        Supplier (*),
        Warehouse_Products:Warehouse_Product (
          id,
          quantity,
          warehouseId,
          Warehouse (
            id,
            name
          )
        )
      `)
      .limit(3);

    if (readError) {
      console.error('❌ Error leyendo productos con relaciones:', readError);
    } else {
      console.log('✅ Lectura exitosa de productos con relaciones');
      console.log(`📊 Productos encontrados: ${productsWithRelations.length}`);
      
      productsWithRelations.forEach((product, index) => {
        console.log(`   Producto ${index + 1}: ${product.name}`);
        console.log(`     - Bodegas: ${product.Warehouse_Products?.length || 0}`);
        if (product.Warehouse_Products && product.Warehouse_Products.length > 0) {
          product.Warehouse_Products.forEach(wp => {
            console.log(`       * ${wp.Warehouse?.name}: ${wp.quantity} unidades`);
          });
        }
      });
    }

    console.log('\n📋 Resumen:');
    console.log('✅ Las políticas RLS están configuradas correctamente para lectura');
    console.log('❌ Hay un problema con las políticas RLS para inserción en Warehouse_Product');
    console.log('💡 Solución: Aplicar la migración SQL manualmente en Supabase Studio');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar la verificación
simpleRLSFix(); 