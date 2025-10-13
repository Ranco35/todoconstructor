/**
 * Script para agregar las columnas faltantes a la tabla Client
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

async function agregarColumnas() {
  console.log('🔧 Agregando columnas faltantes a la tabla Client...\n');
  console.log('=====================================\n');

  const columnas = [
    { nombre: 'calle2', tipo: 'VARCHAR(255)', descripcion: 'Segunda línea de dirección' },
    { nombre: 'idioma', tipo: 'VARCHAR(10) DEFAULT \'es\'', descripcion: 'Idioma preferido' },
    { nombre: 'zonaHoraria', tipo: 'VARCHAR(100)', descripcion: 'Zona horaria' },
    { nombre: 'imagen', tipo: 'TEXT', descripcion: 'URL de imagen' },
    { nombre: 'comentarios', tipo: 'TEXT', descripcion: 'Comentarios adicionales' },
    { nombre: 'numeroEmpleados', tipo: 'INTEGER', descripcion: 'Número de empleados (empresas)' },
    { nombre: 'facturacionAnual', tipo: 'DECIMAL(15,2)', descripcion: 'Facturación anual (empresas)' },
    { nombre: 'fechaNacimiento', tipo: 'DATE', descripcion: 'Fecha de nacimiento (personas)' },
    { nombre: 'genero', tipo: 'VARCHAR(50)', descripcion: 'Género (personas)' },
    { nombre: 'profesion', tipo: 'VARCHAR(255)', descripcion: 'Profesión (personas)' },
    { nombre: 'titulo', tipo: 'VARCHAR(100)', descripcion: 'Título (personas)' },
    { nombre: 'origenCliente', tipo: 'VARCHAR(100)', descripcion: 'Origen del cliente' },
    { nombre: 'recibirNewsletter', tipo: 'BOOLEAN DEFAULT true', descripcion: 'Recibir newsletter' },
    { nombre: 'aceptaMarketing', tipo: 'BOOLEAN DEFAULT false', descripcion: 'Acepta marketing' },
    { nombre: 'creadoPor', tipo: 'UUID', descripcion: 'Usuario que creó el registro' },
    { nombre: 'modificadoPor', tipo: 'UUID', descripcion: 'Usuario que modificó el registro' }
  ];

  let exitosas = 0;
  let errores = 0;

  for (const col of columnas) {
    try {
      console.log(`⏳ Agregando columna: ${col.nombre}...`);
      
      // Usar una consulta directa a través de la API de Supabase
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "${col.nombre}" ${col.tipo};`
      });

      if (error) {
        // Verificar si el error es porque la columna ya existe
        if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
          console.log(`   ✅ ${col.nombre} - Ya existe`);
          exitosas++;
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          errores++;
        }
      } else {
        console.log(`   ✅ ${col.nombre} - Agregada exitosamente`);
        exitosas++;
      }
    } catch (err) {
      console.error(`   ❌ Excepción: ${err.message}`);
      errores++;
    }
  }

  console.log('\n=====================================');
  console.log('📊 RESUMEN');
  console.log('=====================================');
  console.log(`✅ Exitosas: ${exitosas}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`📋 Total: ${columnas.length}`);

  if (exitosas > 0) {
    console.log('\n✅ ¡Columnas agregadas correctamente!');
    console.log('🔄 Ahora recarga tu aplicación web para que los cambios surtan efecto');
    console.log('   1. Presiona Ctrl + C en la terminal del servidor');
    console.log('   2. Ejecuta: npm run dev');
    console.log('   3. Recarga el navegador (Ctrl + F5)');
  }

  console.log('\n=====================================');
}

agregarColumnas()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });




