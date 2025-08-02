'use server';

import { whatsappMultiUser, WhatsAppUser, ClientAssignment, MultiUserStatus } from '@/lib/whatsapp-multi-user';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

// ===============================
// GESTIÓN DE USUARIOS
// ===============================

/**
 * Registrar un usuario en el sistema multi-usuario de WhatsApp
 */
export async function registerWhatsAppUser(userData: {
  name: string;
  email: string;
  role: 'ADMIN' | 'RECEPTION' | 'SALES' | 'SUPPORT';
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const user: Omit<WhatsAppUser, 'lastActivity' | 'assignedClients' | 'status'> = {
      id: currentUser.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isActive: true,
    };

    const success = await whatsappMultiUser.registerUser(user);
    
    if (success) {
      return { 
        success: true, 
        data: { 
          message: 'Usuario registrado exitosamente',
          userId: currentUser.id 
        } 
      };
    } else {
      return { success: false, error: 'No se pudo registrar el usuario (límite alcanzado)' };
    }
  } catch (error) {
    console.error('Error registrando usuario WhatsApp:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Desregistrar un usuario del sistema multi-usuario
 */
export async function unregisterWhatsAppUser(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const success = await whatsappMultiUser.unregisterUser(currentUser.id);
    
    if (success) {
      return { 
        success: true, 
        data: { message: 'Usuario desregistrado exitosamente' } 
      };
    } else {
      return { success: false, error: 'Usuario no encontrado o ya desregistrado' };
    }
  } catch (error) {
    console.error('Error desregistrando usuario WhatsApp:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Actualizar estado de un usuario
 */
export async function updateWhatsAppUserStatus(status: 'online' | 'busy' | 'offline'): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const success = await whatsappMultiUser.updateUserStatus(currentUser.id, status);
    
    if (success) {
      return { 
        success: true, 
        data: { 
          message: 'Estado actualizado exitosamente',
          status 
        } 
      };
    } else {
      return { success: false, error: 'Usuario no encontrado' };
    }
  } catch (error) {
    console.error('Error actualizando estado de usuario:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ===============================
// ENVÍO DE MENSAJES
// ===============================

/**
 * Enviar mensaje como usuario específico
 */
export async function sendWhatsAppMessageAsUser(to: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Validar número de teléfono
    if (!to || to.length < 8) {
      return { success: false, error: 'Número de teléfono inválido' };
    }

    // Validar mensaje
    if (!message || message.trim().length === 0) {
      return { success: false, error: 'El mensaje no puede estar vacío' };
    }

    const success = await whatsappMultiUser.sendMessageAsUser(currentUser.id, to, message);
    
    if (success) {
      return { 
        success: true, 
        data: { 
          message: 'Mensaje enviado exitosamente',
          to,
          sentBy: currentUser.name 
        } 
      };
    } else {
      return { success: false, error: 'No se pudo enviar el mensaje' };
    }
  } catch (error) {
    console.error('Error enviando mensaje WhatsApp:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ===============================
// CONSULTAS Y ESTADOS
// ===============================

/**
 * Obtener lista de usuarios registrados
 */
export async function getWhatsAppUsers(): Promise<{ success: boolean; data?: WhatsAppUser[]; error?: string }> {
  try {
    const users = whatsappMultiUser.getUsers();
    return { success: true, data: users };
  } catch (error) {
    console.error('Error obteniendo usuarios WhatsApp:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener información del usuario actual
 */
export async function getCurrentWhatsAppUser(): Promise<{ success: boolean; data?: WhatsAppUser; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const user = whatsappMultiUser.getUser(currentUser.id);
    
    if (user) {
      return { success: true, data: user };
    } else {
      return { success: false, error: 'Usuario no registrado en WhatsApp' };
    }
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener asignaciones de clientes del usuario actual
 */
export async function getCurrentUserAssignments(): Promise<{ success: boolean; data?: ClientAssignment[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const assignments = whatsappMultiUser.getUserAssignments(currentUser.id);
    return { success: true, data: assignments };
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener todas las asignaciones de clientes
 */
export async function getAllClientAssignments(): Promise<{ success: boolean; data?: ClientAssignment[]; error?: string }> {
  try {
    const assignments = whatsappMultiUser.getClientAssignments();
    return { success: true, data: assignments };
  } catch (error) {
    console.error('Error obteniendo asignaciones de clientes:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener estado del sistema multi-usuario
 */
export async function getMultiUserStatus(): Promise<{ success: boolean; data?: MultiUserStatus; error?: string }> {
  try {
    const status = whatsappMultiUser.getSystemStatus();
    return { success: true, data: status };
  } catch (error) {
    console.error('Error obteniendo estado del sistema:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ===============================
// INICIALIZACIÓN Y GESTIÓN
// ===============================

/**
 * Inicializar el sistema multi-usuario
 */
export async function initializeMultiUserSystem(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    await whatsappMultiUser.initialize();
    return { 
      success: true, 
      data: { message: 'Sistema multi-usuario inicializado correctamente' } 
    };
  } catch (error) {
    console.error('Error inicializando sistema multi-usuario:', error);
    return { success: false, error: 'Error inicializando el sistema' };
  }
}

/**
 * Destruir el sistema multi-usuario
 */
export async function destroyMultiUserSystem(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    await whatsappMultiUser.destroy();
    return { 
      success: true, 
      data: { message: 'Sistema multi-usuario destruido correctamente' } 
    };
  } catch (error) {
    console.error('Error destruyendo sistema multi-usuario:', error);
    return { success: false, error: 'Error destruyendo el sistema' };
  }
}

// ===============================
// UTILIDADES
// ===============================

/**
 * Verificar si el usuario actual está registrado
 */
export async function isUserRegistered(): Promise<{ success: boolean; data?: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const user = whatsappMultiUser.getUser(currentUser.id);
    return { success: true, data: !!user };
  } catch (error) {
    console.error('Error verificando registro de usuario:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener estadísticas del usuario actual
 */
export async function getCurrentUserStats(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const user = whatsappMultiUser.getUser(currentUser.id);
    if (!user) {
      return { success: false, error: 'Usuario no registrado en WhatsApp' };
    }

    const assignments = whatsappMultiUser.getUserAssignments(currentUser.id);
    const activeAssignments = assignments.filter(a => a.status === 'active');
    const urgentAssignments = assignments.filter(a => a.priority === 'urgent');

    const stats = {
      totalAssignments: assignments.length,
      activeAssignments: activeAssignments.length,
      urgentAssignments: urgentAssignments.length,
      lastActivity: user.lastActivity,
      status: user.status,
      role: user.role,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error obteniendo estadísticas del usuario:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 