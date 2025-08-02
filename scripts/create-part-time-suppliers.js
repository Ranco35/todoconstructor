require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Proveedores part-time de ejemplo para termas (usando estructura real)
const partTimeSuppliers = [
  {
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56912345678',
    address: 'Av. Las Termas 123',
    city: 'Pucón',
    state: 'Araucanía',
    country: 'Chile',
    postalCode: '4920000',
    taxId: '12345678-9',
    companyType: 'PERSONA',
    rank: 'PART_TIME',
    paymentTerm: 'CONTADO',
    creditLimit: 0,
    isActive: true,
    active: true,
    notes: 'Limpieza y mantenimiento de cabañas. Trabaja 3 días por semana, especializada en limpieza de cabañas premium'
  },
  {
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+56987654321',
    address: 'Camino Villarrica 456',
    city: 'Pucón',
    state: 'Araucanía',
    country: 'Chile',
    postalCode: '4920000',
    taxId: '87654321-0',
    companyType: 'PERSONA',
    rank: 'PART_TIME',
    paymentTerm: 'CONTADO',
    creditLimit: 0,
    isActive: true,
    active: true,
    notes: 'Mantenimiento de jardines y exteriores. Jardinero experto, disponible fines de semana y días festivos'
  },
  {
    name: 'Ana Silva',
    email: 'ana.silva@email.com',
    phone: '+56911223344',
    address: 'Ruta Internacional 789',
    city: 'Pucón',
    state: 'Araucanía',
    country: 'Chile',
    postalCode: '4920000',
    taxId: '11223344-5',
    companyType: 'PERSONA',
    rank: 'PART_TIME',
    paymentTerm: 'CONTADO',
    creditLimit: 0,
    isActive: true,
    active: true,
    notes: 'Servicios de spa y masajes. Masajista certificada, trabaja por turnos según demanda'
  },
  {
    name: 'Roberto Fuentes',
    email: 'roberto.fuentes@email.com',
    phone: '+56955667788',
    address: 'Av. O\'Higgins 321',
    city: 'Pucón',
    state: 'Araucanía',
    country: 'Chile',
    postalCode: '4920000',
    taxId: '55667788-9',
    companyType: 'PERSONA',
    rank: 'PART_TIME',
    paymentTerm: 'CONTADO',
    creditLimit: 0,
    isActive: true,
    active: true,
    notes: 'Mantenimiento de piscinas y jacuzzis. Técnico especializado en sistemas de agua termal'
  },
  {
    name: 'Patricia López',
    email: 'patricia.lopez@email.com',
    phone: '+56999887766',
    address: 'Camino a Caburgua 654',
    city: 'Pucón',
    state: 'Araucanía',
    country: 'Chile',
    postalCode: '4920000',
    taxId: '99887766-5',
    companyType: 'PERSONA',
    rank: 'PART_TIME',
    paymentTerm: 'CONTADO',
    creditLimit: 0,
    isActive: true,
    active: true,
    notes: 'Servicios de cocina y catering. Chef especializada en cocina local, disponible para eventos especiales'
  }
];

async function createPartTimeSuppliers() {
  console.log('🚀 Iniciando creación de proveedores part-time...');
  
  try {
    // Verificar conexión
    const { data: testData, error: testError } = await supabase
      .from('Supplier')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión a la base de datos:', testError);
      return;
    }
    
    console.log('✅ Conexión a base de datos exitosa');
    
    // Crear proveedores
    const results = [];
    
    for (const supplier of partTimeSuppliers) {
      console.log(`📝 Creando proveedor: ${supplier.name}`);
      
      const { data, error } = await supabase
        .from('Supplier')
        .insert(supplier)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creando ${supplier.name}:`, error);
        results.push({ name: supplier.name, success: false, error: error.message });
      } else {
        console.log(`✅ Proveedor creado: ${supplier.name} (ID: ${data.id})`);
        results.push({ name: supplier.name, success: true, id: data.id });
      }
    }
    
    // Resumen
    console.log('\n📊 RESUMEN DE CREACIÓN:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Exitosos: ${successful.length}`);
    successful.forEach(s => console.log(`   - ${s.name} (ID: ${s.id})`));
    
    if (failed.length > 0) {
      console.log(`❌ Fallidos: ${failed.length}`);
      failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
    }
    
    console.log(`\n🎯 Total: ${results.length} proveedores procesados`);
    
    if (successful.length > 0) {
      console.log('\n🎉 ¡Proveedores part-time creados exitosamente!');
      console.log('Ahora puedes usar el sistema de pagos a proveedores en Caja Chica.');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
createPartTimeSuppliers()
  .then(() => {
    console.log('🏁 Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 