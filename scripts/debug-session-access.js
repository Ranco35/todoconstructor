#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 DEBUG SESSION ACCESS');
console.log('═════════════════════════════════════');
console.log('URL presente:', !!supabaseUrl);
console.log('Service key presente:', !!supabaseServiceKey);
console.log('Anon key presente:', !!supabaseAnonKey);
console.log('');

async function testSessionAccess() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno faltantes');
    return;
  }

  // 1. Cliente con Service Role
  console.log('1️⃣ PROBANDO CON SERVICE ROLE KEY...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: sessionsService, error: errorService } = await supabaseService
      .from('CashSession')
      .select('id, status, openingAmount, userId')
      .order('id', { ascending: false })
      .limit(5);
      
    console.log('   ✅ Service Role - Sesiones encontradas:', sessionsService?.length || 0);
    if (sessionsService && sessionsService.length > 0) {
      sessionsService.forEach(session => {
        console.log(`      ID: ${session.id} | Status: ${session.status} | Monto: $${session.openingAmount}`);
      });
    }
    if (errorService) {
      console.log('   ❌ Service Role - Error:', errorService);
    }
  } catch (err) {
    console.log('   ❌ Service Role - Excepción:', err.message);
  }

  console.log('');

  // 2. Cliente con Anon Key
  console.log('2️⃣ PROBANDO CON ANON KEY...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: sessionsAnon, error: errorAnon } = await supabaseAnon
      .from('CashSession')
      .select('id, status, openingAmount, userId')
      .order('id', { ascending: false })
      .limit(5);
      
    console.log('   ✅ Anon - Sesiones encontradas:', sessionsAnon?.length || 0);
    if (sessionsAnon && sessionsAnon.length > 0) {
      sessionsAnon.forEach(session => {
        console.log(`      ID: ${session.id} | Status: ${session.status} | Monto: $${session.openingAmount}`);
      });
    }
    if (errorAnon) {
      console.log('   ❌ Anon - Error:', errorAnon);
    }
  } catch (err) {
    console.log('   ❌ Anon - Excepción:', err.message);
  }

  console.log('');

  // 3. Buscar sesión específica (8) con Service Role
  console.log('3️⃣ BUSCANDO SESIÓN ID 8 CON SERVICE ROLE...');
  try {
    const { data: session8, error: error8 } = await supabaseService
      .from('CashSession')
      .select('*')
      .eq('id', 8)
      .single();
      
    console.log('   ✅ Sesión 8 encontrada:', !!session8);
    if (session8) {
      console.log(`      ID: ${session8.id} | Status: ${session8.status} | Monto: $${session8.openingAmount} | Usuario: ${session8.userId}`);
    }
    if (error8) {
      console.log('   ❌ Error buscando sesión 8:', error8);
    }
  } catch (err) {
    console.log('   ❌ Excepción buscando sesión 8:', err.message);
  }

  console.log('');

  // 4. Buscar sesión 8 con filtro status = open
  console.log('4️⃣ BUSCANDO SESIÓN ID 8 CON FILTRO STATUS=OPEN...');
  try {
    const { data: session8Open, error: error8Open } = await supabaseService
      .from('CashSession')
      .select('*')
      .eq('id', 8)
      .eq('status', 'open')
      .single();
      
    console.log('   ✅ Sesión 8 (open) encontrada:', !!session8Open);
    if (session8Open) {
      console.log(`      ID: ${session8Open.id} | Status: ${session8Open.status} | Monto: $${session8Open.openingAmount}`);
    }
    if (error8Open) {
      console.log('   ❌ Error buscando sesión 8 (open):', error8Open);
    }
  } catch (err) {
    console.log('   ❌ Excepción buscando sesión 8 (open):', err.message);
  }

  console.log('');
  console.log('🔍 DIAGNÓSTICO COMPLETO');
}

testSessionAccess().catch(console.error); 