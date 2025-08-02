const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bvzfuibqlprrfbudnauc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function testCorrectedSession() {
  console.log('🧪 Probando apertura de sesión corregida...');
  
  try {
    // 1. Obtener usuario Eduardo
    const { data: user } = await supabase
      .from('User')
      .select('*')
      .eq('email', 'eduardo@termasllifen.cl')
      .single();
      
    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', user.name, user.id);
    
    // 2. Verificar si ya hay sesión activa
    const { data: activeSession } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .single();
      
    if (activeSession) {
      console.log('⚠️ Ya hay una sesión activa:', activeSession.id);
      console.log('📋 Sesión actual:', {
        id: activeSession.id,
        userId: activeSession.userId,
        openingAmount: activeSession.openingAmount,
        currentAmount: activeSession.currentAmount,
        status: activeSession.status
      });
      return;
    }
    
    console.log('✅ No hay sesión activa, procediendo a crear...');
    
    // 3. Crear nueva sesión con estructura corregida
    const sessionData = {
      userId: user.id, // UUID string
      cashRegisterId: 1,
      openingAmount: 1000,
      currentAmount: 1000, // Campo requerido
      status: 'open',
      notes: 'Sesión de prueba con estructura corregida'
    };
    
    console.log('📝 Datos a insertar:', sessionData);
    
    const { data: newSession, error } = await supabase
      .from('CashSession')
      .insert(sessionData)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creando sesión:', error);
      return;
    }
    
    console.log('🎉 ¡SESIÓN CREADA EXITOSAMENTE!');
    console.log('📋 Nueva sesión:', {
      id: newSession.id,
      sessionNumber: `S${newSession.id}`, // Número generado dinámicamente
      userId: newSession.userId,
      openingAmount: newSession.openingAmount,
      currentAmount: newSession.currentAmount,
      status: newSession.status,
      openedAt: newSession.openedAt
    });
    
    // 4. Verificar que la sesión es detectada por getCurrentCashSession
    const { data: verifySession } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .single();
      
    if (verifySession) {
      console.log('✅ Sesión verificada como activa');
      console.log('🎯 El dashboard debería detectar esta sesión automáticamente');
    } else {
      console.log('❌ Error: La sesión no se detecta como activa');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testCorrectedSession(); 