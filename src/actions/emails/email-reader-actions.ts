'use server';

import { EmailReader, EmailFilter, ReceivedEmail, testEmailReaderConfiguration } from '@/lib/email-reader-service';

// Acción para obtener emails recibidos
export async function getReceivedEmails(filter: EmailFilter = {}): Promise<{
  success: boolean;
  emails?: ReceivedEmail[];
  error?: string;
}> {
  try {
    console.log('📥 Obteniendo emails recibidos...');

    const reader = new EmailReader();
    await reader.connect();
    
    const emails = await reader.getEmails(filter);
    
    await reader.disconnect();

    console.log(`✅ Obtenidos ${emails.length} emails`);
    return {
      success: true,
      emails
    };

  } catch (error) {
    console.error('❌ Error obteniendo emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido obteniendo emails'
    };
  }
}

// Acción para obtener estadísticas de emails
export async function getEmailStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    unread: number;
    spam: number;
    nonSpam: number;
    lastReceived: string | null;
    spamRate: number;
  };
  error?: string;
}> {
  try {
    console.log('📊 Obteniendo estadísticas de emails...');

    const reader = new EmailReader();
    await reader.connect();
    
    // Obtener todos los emails recientes (últimos 50)
    const allEmails = await reader.getEmails({ limit: 50 });
    
    await reader.disconnect();

    const stats = {
      total: allEmails.length,
      unread: allEmails.filter(email => !email.isRead).length,
      spam: allEmails.filter(email => email.isSpam).length,
      nonSpam: allEmails.filter(email => !email.isSpam).length,
      lastReceived: allEmails.length > 0 ? allEmails[0].date.toISOString() : null,
      spamRate: allEmails.length > 0 ? (allEmails.filter(email => email.isSpam).length / allEmails.length) * 100 : 0
    };

    console.log('✅ Estadísticas obtenidas:', stats);
    return {
      success: true,
      stats
    };

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido obteniendo estadísticas'
    };
  }
}

// Acción para marcar emails como leídos
export async function markEmailsAsRead(messageIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('📖 Marcando emails como leídos:', messageIds);

    const reader = new EmailReader();
    await reader.connect();
    
    await reader.markAsRead(messageIds);
    
    await reader.disconnect();

    console.log('✅ Emails marcados como leídos');
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ Error marcando como leídos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido marcando emails como leídos'
    };
  }
}

// Acción para mover emails a spam
export async function moveEmailsToSpam(messageIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('🗑️ Moviendo emails a spam:', messageIds);

    const reader = new EmailReader();
    await reader.connect();
    
    await reader.moveToSpam(messageIds);
    
    await reader.disconnect();

    console.log('✅ Emails movidos a spam');
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ Error moviendo a spam:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido moviendo emails a spam'
    };
  }
}

// Acción para eliminar emails
export async function deleteEmails(messageIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('🗑️ Eliminando emails:', messageIds);

    const reader = new EmailReader();
    await reader.connect();
    
    await reader.deleteEmails(messageIds);
    
    await reader.disconnect();

    console.log('✅ Emails eliminados');
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ Error eliminando emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido eliminando emails'
    };
  }
}

// Acción para verificar configuración de lectura de emails
export async function checkEmailReaderConfiguration(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('🔍 Verificando configuración de lectura de emails...');
    
    const result = await testEmailReaderConfiguration();
    
    console.log('✅ Verificación completada:', result);
    return result;

  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido verificando configuración'
    };
  }
}

// Acción para obtener solo emails no spam
export async function getNonSpamEmails(limit: number = 20): Promise<{
  success: boolean;
  emails?: ReceivedEmail[];
  error?: string;
}> {
  return getReceivedEmails({
    isSpam: false,
    limit
  });
}

// Acción para obtener solo emails spam
export async function getSpamEmails(limit: number = 20): Promise<{
  success: boolean;
  emails?: ReceivedEmail[];
  error?: string;
}> {
  return getReceivedEmails({
    isSpam: true,
    limit
  });
}

// Acción para obtener emails no leídos
export async function getUnreadEmails(limit: number = 20): Promise<{
  success: boolean;
  emails?: ReceivedEmail[];
  error?: string;
}> {
  return getReceivedEmails({
    isRead: false,
    limit
  });
} 