// Script simple para corregir la categoría de la habitación
const https = require('https');

const SUPABASE_URL = 'https://flwewxqgbmsyqrjvhfuw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsd2V3eHFnYm1zeXFyanZoZnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTAwNjczNCwiZXhwIjoyMDUwNTgyNzM0fQ.hcV2-F11nJy5ksqHBr_N8PLsQOGg6fBNQLxlOe4Hxcs';

async function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'flwewxqgbmsyqrjvhfuw.supabase.co',
      port: 443,
      path: `/rest/v1/${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve(jsonData);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function fixHabitacionCategory() {
  console.log('🔧 Corrigiendo categoría de Habitación Doble...');
  
  try {
    // 1. Verificar productos actuales
    console.log('📊 Verificando productos con "habitacion"...');
    const products = await makeRequest('GET', 'products_modular?name=ilike.*habitacion*&select=*');
    console.log('Productos encontrados:', products);
    
    if (products && products.length > 0) {
      products.forEach(p => {
        console.log(`  - ID: ${p.id}, Nombre: ${p.name}, Categoría: ${p.category}`);
      });
      
      // 2. Actualizar categoría
      console.log('🔄 Actualizando categoría...');
      const updateResult = await makeRequest('PATCH', 'products_modular?name=ilike.*habitacion*&category=eq.servicios', {
        category: 'alojamiento'
      });
      
      console.log('Resultado de actualización:', updateResult);
      
      // 3. Verificar resultado
      console.log('✅ Verificando resultado final...');
      const finalProducts = await makeRequest('GET', 'products_modular?name=ilike.*habitacion*&select=*');
      console.log('Estado final:', finalProducts);
      
      if (finalProducts && finalProducts.length > 0) {
        finalProducts.forEach(p => {
          console.log(`  - ${p.name} → categoría: ${p.category}`);
        });
      }
    } else {
      console.log('❌ No se encontraron productos con "habitacion"');
    }
    
    console.log('🎉 Script completado!');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

fixHabitacionCategory(); 