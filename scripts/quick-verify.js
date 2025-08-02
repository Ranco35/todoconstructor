#!/usr/bin/env node

/**
 * Verificación rápida del estado de Vercel
 * Para uso diario y debugging rápido
 */

const { execSync } = require('child_process');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

console.log('⚡ VERIFICACIÓN RÁPIDA - ADMINTERMAS');
console.log('===================================\n');

// Helper para requests HTTP simples
function quickCheck(url) {
  return new Promise((resolve) => {
    const req = https.request(url, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode < 400 });
    });
    req.on('error', () => resolve({ status: 'ERROR', ok: false }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', ok: false });
    });
    req.end();
  });
}

const supabase = createClient(
  'https://bvzfuibqlprrfbudnauc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function quickVerify() {
  try {
    // 1. Obtener URL del deployment actual
    console.log('🔍 Obteniendo información del deployment...');
    const deployments = execSync('vercel ls', { encoding: 'utf8' });
    console.log('📋 Deployments disponibles:');
    console.log(deployments);
    
    // Buscar la URL más reciente (formato manual)
    const lines = deployments.split('\n');
    let DEPLOYMENT_URL = '';
    
    // Buscar líneas que contengan URLs de Vercel
    for (const line of lines) {
      if (line.includes('.vercel.app')) {
        // Extraer la URL de la línea
        const urlMatch = line.match(/https?:\/\/[^\s]+\.vercel\.app/);
        if (urlMatch) {
          DEPLOYMENT_URL = urlMatch[0];
          break;
        }
        // Si no tiene https, agregar
        const domainMatch = line.match(/([a-zA-Z0-9\-]+\.vercel\.app)/);
        if (domainMatch) {
          DEPLOYMENT_URL = `https://${domainMatch[1]}`;
          break;
        }
      }
    }
    
    if (!DEPLOYMENT_URL) {
      // Usar la URL que conocemos del último deployment exitoso
      DEPLOYMENT_URL = 'https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app';
      console.log('⚠️  Usando URL del último deployment conocido');
    }
    
    console.log(`✅ URL a verificar: ${DEPLOYMENT_URL}\n`);
    
    // 2. Verificar URLs críticas
    console.log('🌐 Verificando URLs críticas...');
    
    const urls = [
      { name: 'Home', url: DEPLOYMENT_URL },
      { name: 'Login', url: `${DEPLOYMENT_URL}/login` },
      { name: 'Dashboard', url: `${DEPLOYMENT_URL}/dashboard` }
    ];
    
    for (const { name, url } of urls) {
      process.stdout.write(`  ${name}... `);
      const result = await quickCheck(url);
      if (result.ok) {
        console.log(`✅ ${result.status}`);
      } else {
        console.log(`❌ ${result.status}`);
      }
    }
    
    console.log('');
    
    // 3. Verificar variables de entorno rápidamente
    console.log('🔧 Verificando variables críticas...');
    try {
      const envOutput = execSync('vercel env ls', { encoding: 'utf8' });
      
      const criticalVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
      for (const varName of criticalVars) {
        if (envOutput.includes(varName)) {
          console.log(`  ✅ ${varName}`);
        } else {
          console.log(`  ❌ ${varName} - NO ENCONTRADA`);
        }
      }
    } catch (envError) {
      console.log('  ⚠️  No se pudieron verificar variables de entorno');
    }
    
    console.log('');
    
    // 4. Información adicional
    console.log('📊 Información del proyecto:');
    console.log(`  🌍 URL principal: ${DEPLOYMENT_URL}`);
    console.log(`  📅 Verificación: ${new Date().toLocaleString()}`);
    console.log(`  🎯 Proyecto: Admintermas`);
    
    console.log('\n🚀 COMANDOS ÚTILES:');
    console.log('  vercel ls              # Ver deployments');
    console.log('  vercel --prod          # Nuevo deployment');
    console.log('  vercel logs --follow   # Monitor logs');
    console.log('  vercel env ls          # Ver variables');
    
    console.log('\n⚡ VERIFICACIÓN RÁPIDA COMPLETADA');
    
    // 1. Verificar usuario
    const { data: user } = await supabase
      .from('User')
      .select('*')
      .eq('email', 'eduardo@termasllifen.cl')
      .single();
    
    console.log('👤 Usuario:', user?.name, user?.id);
    
    // 2. Verificar sesión activa
    const { data: activeSession } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open')
      .limit(1)
      .single();
    
    console.log('💰 Sesión activa:', activeSession?.sessionNumber || 'Ninguna');
    
    // 3. Si no hay sesión, crear una nueva
    if (!activeSession && user) {
      console.log('🚀 Creando nueva sesión...');
      
      const sessionData = {
        sessionNumber: `TEST-${Date.now()}`,
        userId: user.id,
        cashRegisterId: 1,
        openingAmount: 1000,
        currentAmount: 1000,
        status: 'open'
      };
      
      const { data: newSession, error } = await supabase
        .from('CashSession')
        .insert(sessionData)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error:', error.message);
      } else {
        console.log('✅ Nueva sesión creada:', newSession.sessionNumber);
      }
    }
    
  } catch (error) {
    console.log('❌ Error durante verificación:', error.message);
    console.log('💡 Asegúrate de estar logueado: vercel login');
    
    // Fallback: verificar al menos la URL conocida
    console.log('\n🔄 Intentando verificación con URL conocida...');
    const FALLBACK_URL = 'https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app';
    
    try {
      const result = await quickCheck(FALLBACK_URL);
      if (result.ok) {
        console.log(`✅ ${FALLBACK_URL} responde con status ${result.status}`);
      } else {
        console.log(`❌ ${FALLBACK_URL} no responde (${result.status})`);
      }
    } catch (fallbackError) {
      console.log('❌ No se pudo verificar la URL conocida');
    }
  }
}

quickVerify().catch(console.error); 