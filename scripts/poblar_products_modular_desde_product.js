// Script para poblar automáticamente products_modular desde Product
// Ejecutar con: node scripts/poblar_products_modular_desde_product.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateProductCode(name, id) {
  return (
    name
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9_]/g, '') + '_' + id
  );
}

async function poblarProductsModular() {
  // 1. Obtener todos los productos reales
  const { data: products, error } = await supabase
    .from('Product')
    .select('id, name');

  if (error) {
    console.error('Error obteniendo productos:', error);
    process.exit(1);
  }

  for (const product of products) {
    // 2. Verificar si ya existe en products_modular
    const { data: existing } = await supabase
      .from('products_modular')
      .select('id')
      .eq('original_id', product.id)
      .maybeSingle();

    if (existing) {
      console.log(`Ya existe modular para Product ID ${product.id}`);
      continue;
    }

    // 3. Insertar nuevo producto modular
    const code = generateProductCode(product.name, product.id);
    const { error: insertError } = await supabase
      .from('products_modular')
      .insert({
        code,
        name: product.name,
        original_id: product.id,
        is_active: true
      });
    if (insertError) {
      console.error(`Error insertando modular para Product ID ${product.id}:`, insertError);
    } else {
      console.log(`Producto modular creado para Product ID ${product.id}`);
    }
  }
  console.log('Poblado completo.');
}

poblarProductsModular(); 