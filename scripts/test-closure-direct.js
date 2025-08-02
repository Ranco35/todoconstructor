console.log('🧪 Probando función de cierre directamente...');

// Importar la función de cierre
import { createCashClosure } from '../src/actions/configuration/cash-closure-actions.js';

async function testDirectClosure() {
  try {
    console.log('1️⃣ Simulando FormData para cierre...');
    
    // Crear FormData simulado
    const formData = new FormData();
    formData.append('sessionId', '1');
    formData.append('actualCash', '0'); // Efectivo contado
    formData.append('notes', 'Prueba de cierre directo desde script');

    console.log('2️⃣ Ejecutando createCashClosure...');
    
    const result = await createCashClosure(formData);
    
    console.log('3️⃣ Resultado:', result);
    
    if (result.success) {
      console.log('✅ CIERRE EXITOSO:');
      console.log(`   - Session ID: ${result.sessionId}`);
      console.log(`   - Difference: ${result.difference || 'N/A'}`);
      console.log(`   - Needs approval: ${result.needsSupervisorApproval || 'N/A'}`);
    } else {
      console.log('❌ ERROR EN CIERRE:');
      console.log(`   - Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    console.error('Stack:', error.stack);
  }
}

testDirectClosure(); 