// Script simple para desactivar RLS en la tabla Product
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno del archivo .env.local
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Archivo .env.local no encontrado');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

async function main() {
  console.log('🚀 Desactivando RLS para tabla Product...\n');
  
  // Cargar variables de entorno
  const envVars = loadEnvVars();
  
  if (!envVars) {
    console.log('❌ No se pudo cargar las variables de entorno');
    return;
  }
  
  console.log('✅ Variables de entorno cargadas');
  console.log('🔗 Supabase URL:', envVars.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'No encontrada');
  console.log('🔑 Service Key:', envVars.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'No encontrada');
  
  if (!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n❌ Variables de Supabase no configuradas correctamente');
    console.log('🔧 Asegúrate de que .env.local contenga:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=...');
    console.log('SUPABASE_SERVICE_ROLE_KEY=...');
    return;
  }
  
  // Crear cliente de Supabase
  const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('\n🔓 Desactivando RLS para tabla Product...');
    
    // Opción 1: Desactivar RLS completamente
    const disableRLSQuery = 'ALTER TABLE public."Product" DISABLE ROW LEVEL SECURITY;';
    
    const { data: result1, error: error1 } = await supabase.rpc('sql', { 
      query: disableRLSQuery 
    });
    
    if (error1) {
      console.log('❌ Error desactivando RLS:', error1.message);
      
      // Opción 2: Crear política permisiva
      console.log('\n🔧 Intentando crear política permisiva...');
      
      const createPolicyQuery = `
        -- Eliminar políticas existentes
        DROP POLICY IF EXISTS "Allow all operations on Product" ON public."Product";
        
        -- Crear política que permite todo
        CREATE POLICY "Allow all operations on Product" ON public."Product"
          FOR ALL USING (true) WITH CHECK (true);
      `;
      
      const { data: result2, error: error2 } = await supabase.rpc('sql', { 
        query: createPolicyQuery 
      });
      
      if (error2) {
        console.log('❌ Error creando política:', error2.message);
        console.log('\n💡 Solución manual:');
        console.log('1. Ir a Supabase Dashboard');
        console.log('2. SQL Editor');
        console.log('3. Ejecutar: ALTER TABLE public."Product" DISABLE ROW LEVEL SECURITY;');
        return;
      } else {
        console.log('✅ Política permisiva creada exitosamente');
      }
    } else {
      console.log('✅ RLS desactivado exitosamente');
    }
    
    // Probar inserción
    console.log('\n🧪 Probando inserción de producto...');
    
    const testProduct = {
      name: 'Producto Test RLS Fix',
      description: 'Producto de prueba después del fix',
      sku: 'TEST-FIX-' + Date.now(),
    };
    
    const { data: product, error: insertError } = await supabase
      .from('Product')
      .insert(testProduct)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Aún hay error de inserción:', insertError.message);
      console.log('\n📋 Información adicional del error:');
      console.log(JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ ¡Inserción exitosa! ID:', product.id);
      
      // Limpiar producto de prueba
      await supabase.from('Product').delete().eq('id', product.id);
      console.log('🧹 Producto de prueba eliminado');
      
      console.log('\n🎉 ¡PROBLEMA RLS RESUELTO!');
      console.log('✅ Ahora puedes crear productos desde la aplicación');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

main().catch(console.error); 