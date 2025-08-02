export interface UserData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_USER' | 'ADMINISTRADOR' | 'JEFE_SECCION' | 'USUARIO_FINAL' | 'GARZONES' | 'COCINA' | string;
  department: string | null;
  isCashier: boolean;
  isActive: boolean;
  lastLogin: Date | null;
}

export interface CreateUserResult {
  success: boolean;
  error?: string;
  userId?: string;
}

// Definir permisos específicos para cada rol
export interface RolePermissions {
  canAccessFullDashboard: boolean;
  canAccessPOS: boolean;
  canAccessRestaurantPOS: boolean;
  canAccessReceptionPOS: boolean;
  canAccessReservations: boolean;
  canEditReservations: boolean;
  canAccessKitchenScreen: boolean;
  canAccessCalendar: boolean;
  canEditCalendar: boolean;
  canAccessAccounting: boolean;
  canAccessSuppliers: boolean;
  canAccessInventory: boolean;
}

// Mapeo de permisos por rol
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  SUPER_USER: {
    canAccessFullDashboard: true,
    canAccessPOS: true,
    canAccessRestaurantPOS: true,
    canAccessReceptionPOS: true,
    canAccessReservations: true,
    canEditReservations: true,
    canAccessKitchenScreen: true,
    canAccessCalendar: true,
    canEditCalendar: true,
    canAccessAccounting: true,
    canAccessSuppliers: true,
    canAccessInventory: true,
  },
  ADMINISTRADOR: {
    canAccessFullDashboard: true,
    canAccessPOS: true,
    canAccessRestaurantPOS: true,
    canAccessReceptionPOS: true,
    canAccessReservations: true,
    canEditReservations: true,
    canAccessKitchenScreen: true,
    canAccessCalendar: true,
    canEditCalendar: true,
    canAccessAccounting: true,
    canAccessSuppliers: true,
    canAccessInventory: true,
  },
  JEFE_SECCION: {
    canAccessFullDashboard: true,
    canAccessPOS: true,
    canAccessRestaurantPOS: true,
    canAccessReceptionPOS: true,
    canAccessReservations: true,
    canEditReservations: true,
    canAccessKitchenScreen: true,
    canAccessCalendar: true,
    canEditCalendar: true,
    canAccessAccounting: false,
    canAccessSuppliers: true,
    canAccessInventory: true,
  },
  USUARIO_FINAL: {
    canAccessFullDashboard: true,
    canAccessPOS: false,
    canAccessRestaurantPOS: false,
    canAccessReceptionPOS: false,
    canAccessReservations: false,
    canEditReservations: false,
    canAccessKitchenScreen: false,
    canAccessCalendar: false,
    canEditCalendar: false,
    canAccessAccounting: false,
    canAccessSuppliers: false,
    canAccessInventory: false,
  },
  GARZONES: {
    canAccessFullDashboard: false,
    canAccessPOS: true,
    canAccessRestaurantPOS: true,  // Solo acceso a POS restaurante
    canAccessReceptionPOS: false,   // NO acceso a POS recepción
    canAccessReservations: false,   // NO acceso al módulo completo de reservas
    canEditReservations: false,
    canAccessKitchenScreen: false,
    canAccessCalendar: true,        // SÍ acceso al calendario (solo lectura)
    canEditCalendar: false,         // NO pueden editar el calendario
    canAccessAccounting: false,
    canAccessSuppliers: false,
    canAccessInventory: false,
  },
  COCINA: {
    canAccessFullDashboard: false,
    canAccessPOS: false,
    canAccessRestaurantPOS: false,
    canAccessReceptionPOS: false,
    canAccessReservations: false,
    canEditReservations: false,
    canAccessKitchenScreen: true,   // SÍ acceso a pantalla de cocina
    canAccessCalendar: true,        // SÍ acceso al calendario (solo lectura)
    canEditCalendar: false,         // NO pueden editar el calendario
    canAccessAccounting: false,
    canAccessSuppliers: false,
    canAccessInventory: false,
  },
};

// Función helper para obtener permisos de un rol
export function getRolePermissions(role: string): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.USUARIO_FINAL;
} 