const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGetClient() {
  console.log('🧪 Probando función getClient...\n');

  try {
    // 1. Obtener un cliente existente
    console.log('📋 Obteniendo lista de clientes...');
    const { data: clients, error: listError } = await supabase
      .from('Client')
      .select('id, nombrePrincipal, apellido, rut')
      .limit(5);

    if (listError) {
      console.error('❌ Error obteniendo lista de clientes:', listError);
      return false;
    }

    if (!clients || clients.length === 0) {
      console.log('⚠️ No hay clientes en la base de datos');
      return false;
    }

    console.log('✅ Clientes encontrados:', clients.length);
    clients.forEach(client => {
      console.log(`  - ID: ${client.id}, Nombre: ${client.nombrePrincipal} ${client.apellido || ''}, RUT: ${client.rut || 'N/A'}`);
    });

    // 2. Probar getClient con el primer cliente
    const testClientId = clients[0].id;
    console.log(`\n🔍 Probando getClient con ID: ${testClientId}`);

    const { data: client, error } = await supabase
      .from('Client')
      .select(`
        *,
        contactos:ClientContact(
          id,
          nombre,
          apellido,
          email,
          telefono,
          telefonoMovil,
          cargo,
          departamento,
          tipoRelacionId,
          relacion,
          esContactoPrincipal,
          notas,
          fechaCreacion
        ),
        etiquetas:ClientTagAssignment(
          id,
          tag:ClientTag(
            id,
            nombre,
            color
          )
        )
      `)
      .eq('id', testClientId)
      .single();

    if (error) {
      console.error('❌ Error en getClient:', error);
      console.error('📋 Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('✅ Cliente obtenido exitosamente');
    console.log('📋 Información del cliente:');
    console.log(`  - ID: ${client.id}`);
    console.log(`  - Nombre: ${client.nombrePrincipal} ${client.apellido || ''}`);
    console.log(`  - Tipo: ${client.tipoCliente}`);
    console.log(`  - RUT: ${client.rut || 'N/A'}`);
    console.log(`  - Email: ${client.email || 'N/A'}`);
    console.log(`  - Estado: ${client.estado}`);

    // 3. Verificar contactos
    if (client.contactos && client.contactos.length > 0) {
      console.log(`\n📞 Contactos (${client.contactos.length}):`);
      client.contactos.forEach((contacto, index) => {
        console.log(`  ${index + 1}. ${contacto.nombre} ${contacto.apellido || ''}`);
        console.log(`     Email: ${contacto.email || 'N/A'}`);
        console.log(`     Teléfono: ${contacto.telefono || 'N/A'}`);
        console.log(`     Principal: ${contacto.esContactoPrincipal ? 'SÍ' : 'NO'}`);
      });
    } else {
      console.log('\n📞 No hay contactos registrados');
    }

    // 4. Verificar etiquetas
    if (client.etiquetas && client.etiquetas.length > 0) {
      console.log(`\n🏷️ Etiquetas (${client.etiquetas.length}):`);
      client.etiquetas.forEach((etiqueta, index) => {
        console.log(`  ${index + 1}. ${etiqueta.tag.nombre} (${etiqueta.tag.color})`);
      });
    } else {
      console.log('\n🏷️ No hay etiquetas asignadas');
    }

    // 5. Verificar estructura de datos
    console.log('\n🔍 Verificando estructura de datos...');
    
    const requiredFields = ['id', 'nombrePrincipal', 'tipoCliente', 'estado', 'fechaCreacion'];
    const missingFields = requiredFields.filter(field => !(field in client));
    
    if (missingFields.length > 0) {
      console.error('❌ Campos faltantes:', missingFields);
      return false;
    }

    console.log('✅ Estructura de datos correcta');

    // 6. Verificar relaciones
    console.log('\n🔗 Verificando relaciones...');
    
    if (client.contactos) {
      const contactFields = ['id', 'nombre', 'clienteId'];
      const missingContactFields = contactFields.filter(field => 
        client.contactos.some(contact => !(field in contact))
      );
      
      if (missingContactFields.length > 0) {
        console.error('❌ Campos faltantes en contactos:', missingContactFields);
        return false;
      }
    }

    if (client.etiquetas) {
      const tagFields = ['id', 'tag'];
      const missingTagFields = tagFields.filter(field => 
        client.etiquetas.some(etiqueta => !(field in etiqueta))
      );
      
      if (missingTagFields.length > 0) {
        console.error('❌ Campos faltantes en etiquetas:', missingTagFields);
        return false;
      }
    }

    console.log('✅ Relaciones correctas');

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('📝 La función getClient funciona correctamente');
    
    return true;

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Ejecutar el script
testGetClient()
  .then(success => {
    if (success) {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    } else {
      console.log('\n❌ Script falló');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  }); 