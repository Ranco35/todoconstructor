/**
 * Script para crear un cliente de prueba con datos completos
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function crearClientePrueba() {
  console.log('👤 CREANDO CLIENTE DE PRUEBA\n');
  console.log('=====================================\n');

  try {
    // 1. Obtener un país para asignar
    const { data: paises } = await supabase
      .from('Country')
      .select('id, nombre')
      .eq('codigo', 'CL')
      .single();

    // 2. Obtener un sector económico
    const { data: sectores } = await supabase
      .from('EconomicSector')
      .select('id, nombre')
      .eq('nombre', 'Turismo')
      .single();

    // 3. Crear cliente tipo EMPRESA
    console.log('📋 Creando cliente tipo EMPRESA...\n');
    
    const clienteEmpresa = {
      tipoCliente: 'EMPRESA',
      nombrePrincipal: 'Termas Llifen',
      razonSocial: 'Termas Llifen S.A.',
      rut: '76.123.456-7',
      giro: 'Servicios turísticos y hotelería',
      email: 'contacto@termasllifen.cl',
      telefono: '+56 9 1234 5678',
      telefonoMovil: '+56 9 8765 4321',
      sitioWeb: 'https://termasllifen.cl',
      
      // Dirección
      calle: 'Av. Principal 123',
      calle2: 'Oficina 456',
      ciudad: 'Pucón',
      region: 'Araucanía',
      codigoPostal: '4920000',
      paisId: paises?.id || null,
      
      // Información de empresa
      sectorEconomicoId: sectores?.id || null,
      numeroEmpleados: 50,
      facturacionAnual: 500000000,
      
      // Estado y configuración
      estado: 'activo',
      idioma: 'es',
      zonaHoraria: 'America/Santiago',
      esClienteFrecuente: true,
      totalCompras: 15000000,
      rankingCliente: 5,
      origenCliente: 'Referido',
      
      // Preferencias
      recibirNewsletter: true,
      aceptaMarketing: true,
      
      // Notas
      comentarios: 'Cliente VIP. Atención preferencial. Realiza compras mensuales de servicios y productos.'
    };

    const { data: empresa, error: empresaError } = await supabase
      .from('Client')
      .insert(clienteEmpresa)
      .select()
      .single();

    if (empresaError) {
      console.error('❌ Error creando empresa:', empresaError.message);
      return;
    }

    console.log('✅ Cliente EMPRESA creado exitosamente!');
    console.log(`   ID: ${empresa.id}`);
    console.log(`   Nombre: ${empresa.nombrePrincipal}`);
    console.log(`   RUT: ${empresa.rut}`);
    console.log(`   Email: ${empresa.email}\n`);

    // 4. Crear contactos para la empresa
    console.log('📞 Creando contactos para la empresa...\n');

    const contactos = [
      {
        clienteId: empresa.id,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@termasllifen.cl',
        telefono: '+56 9 1111 2222',
        cargo: 'Gerente General',
        departamento: 'Gerencia',
        esContactoPrincipal: true,
        notas: 'Contacto principal para decisiones estratégicas'
      },
      {
        clienteId: empresa.id,
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@termasllifen.cl',
        telefono: '+56 9 3333 4444',
        cargo: 'Gerente de Compras',
        departamento: 'Compras',
        esContactoPrincipal: false,
        notas: 'Encargada de órdenes de compra'
      }
    ];

    const { data: contactosCreados, error: contactosError } = await supabase
      .from('ClientContact')
      .insert(contactos)
      .select();

    if (contactosError) {
      console.error('⚠️  Error creando contactos:', contactosError.message);
    } else {
      console.log(`✅ ${contactosCreados.length} contactos creados`);
      contactosCreados.forEach(c => {
        console.log(`   - ${c.nombre} ${c.apellido} (${c.cargo})`);
      });
    }

    // 5. Asignar etiquetas
    console.log('\n🏷️  Asignando etiquetas...\n');

    const { data: etiquetas } = await supabase
      .from('ClientTag')
      .select('id, nombre')
      .in('nombre', ['VIP', 'Frecuente']);

    if (etiquetas && etiquetas.length > 0) {
      const asignaciones = etiquetas.map(etiqueta => ({
        clienteId: empresa.id,
        etiquetaId: etiqueta.id
      }));

      const { data: asignacionesCreadas, error: asignacionError } = await supabase
        .from('ClientTagAssignment')
        .insert(asignaciones)
        .select();

      if (asignacionError) {
        console.error('⚠️  Error asignando etiquetas:', asignacionError.message);
      } else {
        console.log(`✅ ${asignacionesCreadas.length} etiquetas asignadas`);
        etiquetas.forEach(e => {
          console.log(`   - ${e.nombre}`);
        });
      }
    }

    // 6. Crear cliente tipo PERSONA
    console.log('\n📋 Creando cliente tipo PERSONA...\n');

    const clientePersona = {
      tipoCliente: 'PERSONA',
      nombrePrincipal: 'Carlos',
      apellido: 'Ramírez',
      rut: '12.345.678-9',
      email: 'carlos.ramirez@gmail.com',
      telefono: '+56 9 5555 6666',
      telefonoMovil: '+56 9 7777 8888',
      
      // Dirección
      calle: 'Los Robles 456',
      ciudad: 'Santiago',
      region: 'Metropolitana',
      codigoPostal: '8320000',
      paisId: paises?.id || null,
      
      // Información de persona
      fechaNacimiento: '1985-03-15',
      genero: 'Masculino',
      profesion: 'Ingeniero',
      titulo: 'Ingeniero Civil',
      
      // Estado y configuración
      estado: 'activo',
      idioma: 'es',
      esClienteFrecuente: false,
      totalCompras: 250000,
      rankingCliente: 3,
      origenCliente: 'Web',
      
      // Preferencias
      recibirNewsletter: true,
      aceptaMarketing: false,
      
      // Notas
      comentarios: 'Cliente nuevo. Interesado en productos premium.'
    };

    const { data: persona, error: personaError } = await supabase
      .from('Client')
      .insert(clientePersona)
      .select()
      .single();

    if (personaError) {
      console.error('❌ Error creando persona:', personaError.message);
    } else {
      console.log('✅ Cliente PERSONA creado exitosamente!');
      console.log(`   ID: ${persona.id}`);
      console.log(`   Nombre: ${persona.nombrePrincipal} ${persona.apellido}`);
      console.log(`   RUT: ${persona.rut}`);
      console.log(`   Email: ${persona.email}\n`);

      // Asignar etiqueta "Nuevo"
      const { data: etiquetaNuevo } = await supabase
        .from('ClientTag')
        .select('id')
        .eq('nombre', 'Nuevo')
        .single();

      if (etiquetaNuevo) {
        await supabase
          .from('ClientTagAssignment')
          .insert({
            clienteId: persona.id,
            etiquetaId: etiquetaNuevo.id
          });
        console.log('✅ Etiqueta "Nuevo" asignada\n');
      }
    }

    console.log('=====================================');
    console.log('✅ ¡CLIENTES DE PRUEBA CREADOS!\n');
    console.log('📊 RESUMEN:');
    console.log('   ✅ 1 Cliente tipo EMPRESA (Termas Llifen)');
    console.log('   ✅ 2 Contactos empresariales');
    console.log('   ✅ 2 Etiquetas asignadas (VIP, Frecuente)');
    console.log('   ✅ 1 Cliente tipo PERSONA (Carlos Ramírez)');
    console.log('   ✅ 1 Etiqueta asignada (Nuevo)');
    console.log('\n🚀 AHORA VE A TU APLICACIÓN:');
    console.log('   1. Recarga el navegador (Ctrl + F5)');
    console.log('   2. Ve a http://localhost:3001/dashboard/customers');
    console.log('   3. ¡Verás los 2 clientes de prueba!');
    console.log('\n=====================================\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

crearClientePrueba()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });

