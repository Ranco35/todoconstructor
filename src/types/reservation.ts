// ================================================
// TIPOS PARA EL MÓDULO DE RESERVAS
// ================================================

export interface Company {
  id: number;
  name: string;
  rut: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms: string;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: number;
  company_id: number;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  can_make_reservations: boolean;
  can_authorize_expenses: boolean;
  spending_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: number;
  number: string;
  type: string;
  capacity: number;
  floor?: number;
  amenities?: string;
  price_per_night?: number;
  is_active: boolean;
  created_at: string;
}

export interface SpaProduct {
  id: number;
  name: string;
  description?: string;
  category: string;
  type: 'SERVICIO' | 'COMBO' | 'HOSPEDAJE';
  price: number;
  duration?: string;
  sku: string;
  is_active: boolean;
  created_at: string;
}

export interface Reservation {
  id: number;
  client_id?: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  room_id: number;
  client_type: 'individual' | 'corporate';
  contact_id?: number;
  company_id?: number;
  billing_name: string;
  billing_rut: string;
  billing_address: string;
  authorized_by: string;
  status: 'prereserva' | 'confirmada' | 'en_curso' | 'finalizada' | 'cancelled' | 'active';
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: 'no_payment' | 'partial' | 'paid' | 'overdue';
  payment_method?: string;
  // Campos de descuento
  discount_type?: 'none' | 'percentage' | 'fixed_amount';
  discount_value?: number;
  discount_amount?: number;
  discount_reason?: string;
  // Campos de recargo (surcharge)
  surcharge_type?: 'none' | 'percentage' | 'fixed_amount';
  surcharge_value?: number;
  surcharge_amount?: number;
  surcharge_reason?: string;
  created_at: string;
  updated_at: string;
  
  // Campos de auditoría
  created_by?: string | null;
  updated_by?: string | null;
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  updated_by_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  
  // Campos del sistema modular
  room_code?: string;
  package_code?: string;
  package_modular_name?: string;
  modular_reservation?: {
    id: number;
    final_price?: number;
    grand_total?: number;
    discount_type?: string;
    discount_value?: number;
    discount_amount?: number;
    surcharge_type?: string;
    surcharge_value?: number;
    surcharge_amount?: number;
  };
  
  // Relaciones
  room?: Room;
  company?: Company;
  contact?: CompanyContact;
  reservation_products?: ReservationProduct[];
  reservation_comments?: ReservationComment[];
  payments?: Payment[];
}

export interface ReservationProduct {
  id: number;
  reservation_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  
  // Campos adicionales del sistema modular
  modular_product_name?: string;
  name?: string;
  
  // Relaciones
  product?: SpaProduct;
}

export interface ReservationComment {
  id: number;
  reservation_id: number;
  text: string;
  author: string;
  comment_type: 'general' | 'payment' | 'service' | 'cancellation';
  created_at: string;
}

export interface Payment {
  id: number;
  reservation_id: number;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  processed_by: string;
  created_at: string;
}

// ================================================
// TIPOS PARA FORMULARIOS
// ================================================

export interface CreateReservationFormData {
  client_id?: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  room_id: number;
  client_type: 'individual' | 'corporate';
  contact_id?: number;
  company_id?: number;
  billing_name: string;
  billing_rut: string;
  billing_address: string;
  authorized_by: string;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: 'no_payment' | 'partial' | 'paid' | 'overdue';
  payment_method?: string;
  // Campos de descuento
  discount_type?: 'none' | 'percentage' | 'fixed_amount';
  discount_value?: number;
  discount_amount?: number;
  discount_reason?: string;
  // Campos de recargo (surcharge)
  surcharge_type?: 'none' | 'percentage' | 'fixed_amount';
  surcharge_value?: number;
  surcharge_amount?: number;
  surcharge_reason?: string;
  selected_products: SelectedProduct[];
}

export interface SelectedProduct {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateCompanyFormData {
  name: string;
  rut: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms: string;
  credit_limit: number;
}

export interface CreateContactFormData {
  company_id: number;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  can_make_reservations: boolean;
  can_authorize_expenses: boolean;
  spending_limit: number;
}

export interface CreateRoomFormData {
  number: string;
  type: string;
  capacity: number;
  floor?: number;
  amenities?: string;
  price_per_night?: number;
}

export interface CreateSpaProductFormData {
  name: string;
  description?: string;
  category: string;
  type: 'SERVICIO' | 'COMBO' | 'HOSPEDAJE';
  price: number;
  duration?: string;
  sku: string;
}

// ================================================
// TIPOS PARA FILTROS Y BÚSQUEDAS
// ================================================

export interface ReservationFilters {
  status?: string;
  client_type?: string;
  check_in_from?: string;
  check_in_to?: string;
  room_id?: number;
  company_id?: number;
  payment_status?: string;
}

export interface RoomFilters {
  type?: string;
  floor?: number;
  capacity?: number;
  is_active?: boolean;
}

export interface SpaProductFilters {
  category?: string;
  type?: string;
  is_active?: boolean;
}

// ================================================
// TIPOS PARA ESTADÍSTICAS
// ================================================

export interface ReservationStats {
  total_reservations: number;
  pending_reservations: number;
  confirmed_reservations: number;
  cancelled_reservations: number;
  completed_reservations: number;
  total_revenue: number;
  pending_payments: number;
  occupancy_rate: number;
}

export interface RoomStats {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  maintenance_rooms: number;
  occupancy_rate: number;
} 