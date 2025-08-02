// Tipos para el sistema de configuración de temporadas
export interface SeasonConfiguration {
  id: number;
  name: string;
  season_type: 'low' | 'mid' | 'high';
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  discount_percentage: number;
  priority: number;
  applies_to_rooms: boolean;
  applies_to_programs: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SeasonInfo {
  id: number;
  name: string;
  season_type: 'low' | 'mid' | 'high';
  discount_percentage: number;
  applies_to_rooms: boolean;
  applies_to_programs: boolean;
}

export interface SeasonFormData {
  name: string;
  season_type: 'low' | 'mid' | 'high';
  start_date: string;
  end_date: string;
  discount_percentage: number;
  priority: number;
  applies_to_rooms: boolean;
  applies_to_programs: boolean;
  is_active: boolean;
}

export interface PriceCalculation {
  base_price: number;
  seasonal_price: number;
  discount_percentage: number;
  season_name?: string;
  season_type?: 'low' | 'mid' | 'high';
}

// Tipos de temporada con etiquetas en español
export const SEASON_TYPES = {
  low: {
    label: 'Temporada Baja',
    color: 'green',
    icon: '🟢',
    description: 'Menor demanda - Descuentos'
  },
  mid: {
    label: 'Temporada Media', 
    color: 'yellow',
    icon: '🟡',
    description: 'Demanda normal - Precio base'
  },
  high: {
    label: 'Temporada Alta',
    color: 'red', 
    icon: '🔴',
    description: 'Mayor demanda - Incremento'
  }
} as const; 