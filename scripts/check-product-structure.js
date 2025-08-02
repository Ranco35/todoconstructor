require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStructure() {
  try {
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Campos de la tabla Product:');
      Object.keys(data[0]).forEach(field => {
        console.log(`- ${field}: ${typeof data[0][field]}`);
      });
    } else {
      console.log('No hay productos en la tabla');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkStructure(); 