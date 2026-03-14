// Tipos para el módulo CRM - Gestión de Leads y Pipeline

export type LeadSource =
  | 'web'
  | 'whatsapp'
  | 'telefono'
  | 'referido'
  | 'manual'
  | 'email'
  | 'walk_in';

export type LeadPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'whatsapp'
  | 'note'
  | 'task'
  | 'sms';

export type ActivityStatus =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'in_progress';

export type ActivityOutcome =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'no_answer'
  | 'callback_requested';

export type LossReasonCategory =
  | 'price'
  | 'competitor'
  | 'timing'
  | 'no_response'
  | 'requirements'
  | 'other';

// Interfaz para etapas del pipeline
export interface CRMStage {
  id: number;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  is_active: boolean;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaz principal para leads
export interface CRMLead {
  id: number;
  client_id?: number;
  budget_id?: number;

  // Información básica
  title: string;
  description?: string;
  source: LeadSource;

  // Pipeline
  stage_id: number;
  stage?: CRMStage;
  priority: LeadPriority;

  // Información comercial
  estimated_value: number;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;

  // Asignación
  assigned_to?: string;
  assigned_user?: {
    id: number;
    name: string;
    email: string;
  };

  // Razón de pérdida
  loss_reason?: string;
  loss_reason_category?: LossReasonCategory;

  // Metadatos
  notes?: string;
  tags: string[];

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Información del cliente (populated opcionalmente)
  client?: {
    id: number;
    nombrePrincipal: string;
    apellido?: string;
    email?: string;
    rut?: string;
    telefono?: string;
    telefonoMovil?: string;
    calle?: string;
    ciudad?: string;
    region?: string;
  };
}

// Interfaz para actividades
export interface CRMActivity {
  id: number;
  lead_id: number;

  type: ActivityType;
  subject: string;
  description?: string;

  scheduled_at?: string;
  completed_at?: string;
  due_date?: string;

  status: ActivityStatus;

  outcome?: ActivityOutcome;
  next_action?: string;

  assigned_to?: string;
  assigned_user?: {
    id: number;
    name: string;
    email: string;
  };

  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Tipos para formularios
export interface CreateLeadInput {
  title: string;
  description?: string;
  source: LeadSource;
  client_id?: number;
  budget_id?: number;
  stage_id: number;
  priority: LeadPriority;
  estimated_value?: number;
  probability?: number;
  expected_close_date?: string;
  assigned_to?: string;
  created_by?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  id: number;
  actual_close_date?: string;
  loss_reason?: string;
  loss_reason_category?: LossReasonCategory;
}

export interface CreateActivityInput {
  lead_id: number;
  type: ActivityType;
  subject: string;
  description?: string;
  scheduled_at?: string;
  due_date?: string;
  assigned_to?: string;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  id: number;
  status?: ActivityStatus;
  outcome?: ActivityOutcome;
  next_action?: string;
  completed_at?: string;
}

// Tipos para filtros y búsqueda
export interface LeadFilters {
  search?: string;
  stage_id?: number;
  source?: LeadSource;
  priority?: LeadPriority;
  assigned_to?: string;
  created_from?: string;
  created_to?: string;
  expected_close_from?: string;
  expected_close_to?: string;
}

export interface ActivityFilters {
  lead_id?: number;
  type?: ActivityType;
  status?: ActivityStatus;
  assigned_to?: string;
  scheduled_from?: string;
  scheduled_to?: string;
}

// Tipos para estadísticas y dashboard
export interface CRMStats {
  total_leads: number;
  leads_by_stage: {
    stage_name: string;
    stage_color: string;
    count: number;
    total_value: number;
  }[];
  leads_by_source: {
    source: LeadSource;
    count: number;
    percentage: number;
  }[];
  leads_by_priority: {
    priority: LeadPriority;
    count: number;
    percentage: number;
  }[];
  conversion_rate: number;
  average_deal_size: number;
  pipeline_value: number;
}

export interface PipelineData {
  stage_id: number;
  stage_name: string;
  stage_color: string;
  leads: CRMLead[];
  total_value: number;
  lead_count: number;
}

// Tipos para conversión desde presupuestos
export interface ConvertBudgetToLeadInput {
  budget_id: number;
  client_id?: number;
  title?: string;
  description?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  estimated_value?: number;
  assigned_to?: string;
  notes?: string;
}
