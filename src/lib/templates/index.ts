// Importar todas las plantillas del sistema
import { EmailTemplate } from '../template-engine';
import defaultTemplates from './default-templates';
import reservationTemplates from './reservation-templates';

// Combinar todas las plantillas
export const allTemplates: EmailTemplate[] = [
  ...defaultTemplates,
  ...reservationTemplates,
];

// Función para obtener plantillas por categoría
export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return allTemplates.filter(template => template.category === category);
}

// Función para obtener una plantilla por ID
export function getTemplateById(id: string): EmailTemplate | undefined {
  return allTemplates.find(template => template.id === id);
}

export default allTemplates;
