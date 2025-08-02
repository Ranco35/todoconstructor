'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Edit, 
  Eye, 
  Copy, 
  Save, 
  Plus, 
  Trash2,
  Brackets,
  FileText,
  Mail,
  Users,
  Building,
  Settings,
  Calendar,
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  templateVariables, 
  replaceTemplateVariables,
  type TemplateVariable,
  type TemplateData
} from '@/lib/template-engine';
import { 
  allTemplates as defaultTemplates,
  getTemplatesByCategory
} from '@/lib/templates';
import { type EmailTemplate } from '@/lib/template-engine';

interface TemplatePreviewData {
  [key: string]: any;
}

export default function TemplateManager() {
  // Estado para plantillas personalizadas
  const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewData, setPreviewData] = useState<TemplatePreviewData>({});

  // Cargar plantillas personalizadas al inicio
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem('customTemplates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        setCustomTemplates(parsed);
        console.log('✅ Plantillas personalizadas cargadas:', parsed.length);
      }
    } catch (error) {
      console.error('❌ Error cargando plantillas personalizadas:', error);
    }
  }, []);

  // Función para obtener todas las plantillas (predeterminadas + personalizadas)
  const getAllTemplates = () => {
    const mergedTemplates = [...defaultTemplates];
    
    console.log('🔍 Debug plantillas:', {
      defaultTemplatesCount: defaultTemplates.length,
      customTemplatesCount: customTemplates.length,
      defaultReservationTemplates: defaultTemplates.filter(t => t.category === 'reservation').map(t => ({ id: t.id, name: t.name })),
      customReservationTemplates: customTemplates.filter(t => t.category === 'reservation').map(t => ({ id: t.id, name: t.name }))
    });
    
    // Reemplazar plantillas predeterminadas con versiones personalizadas si existen
    customTemplates.forEach(customTemplate => {
      const existingIndex = mergedTemplates.findIndex(t => t.id === customTemplate.id);
      if (existingIndex >= 0) {
        mergedTemplates[existingIndex] = customTemplate;
      } else {
        mergedTemplates.push(customTemplate);
      }
    });
    
    return mergedTemplates;
  };

  // Función para obtener plantillas por categoría (incluyendo personalizadas)
  const getTemplatesByCategoryMerged = (category: string) => {
    return getAllTemplates().filter(template => template.category === category);
  };

  // Función para obtener una plantilla por ID (incluyendo personalizadas)
  const getTemplateByIdMerged = (id: string) => {
    return getAllTemplates().find(template => template.id === id);
  };

  // Función helper para renderizar badges de plantilla
  const renderTemplateBadges = (template: EmailTemplate) => (
    <>
      <Badge variant="outline" className="text-xs">
        {template.variables.length} variables
      </Badge>
      {customTemplates.some(ct => ct.id === template.id) && (
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
          ✏️ Modificada
        </Badge>
      )}
      {template.attachmentType === 'pdf' && (
        <Badge variant="secondary" className="text-xs">
          📎 PDF
        </Badge>
      )}
    </>
  );

  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    // Inicializar con datos de ejemplo para preview
    if (selectedTemplate) {
      const sampleData: TemplatePreviewData = {
        // Valores por defecto comunes a todas las plantillas
        empresa: 'Termas Llifen',
        nombre_cliente: 'Juan Pérez',
        email_cliente: 'juan@example.com',
        contacto_persona: 'Equipo Comercial',
        contacto_telefono: '+56 63 2318 000',
        // Valores específicos para reservas
        numero_reserva: 'RES-' + Math.floor(100000 + Math.random() * 900000),
        habitacion: 'Habitación 101',
        paquete: 'Media Pensión',
        // Valores monetarios
        total_reserva: 450000,
        monto_pagado: 300000,
        saldo_restante: 150000,
        total_pagado: 300000,
        // Fechas
        fecha_actual: new Date().toISOString().split('T')[0],
        fecha_checkin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fecha_checkout: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fecha_pago: new Date().toISOString().split('T')[0],
        // Métodos de pago
        metodo_pago: 'Transferencia Bancaria',
        referencia_pago: 'REF-' + Math.floor(100000 + Math.random() * 900000)
      };

      // Asegurarse de que todas las variables de la plantilla tengan un valor
      selectedTemplate.variables.forEach(variable => {
        if (sampleData[variable.key] === undefined) {
          switch (variable.type) {
            case 'text':
              sampleData[variable.key] = 'Valor de ejemplo';
              break;
            case 'number':
              sampleData[variable.key] = 0;
              break;
            case 'currency':
              sampleData[variable.key] = 0;
              break;
            case 'date':
              sampleData[variable.key] = new Date().toISOString().split('T')[0];
              break;
            default:
              sampleData[variable.key] = 'Valor de ejemplo';
          }
        }
      });
      
      setPreviewData(sampleData);
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplate(null);
    setIsEditing(false);
    setActiveTab('preview');
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsEditing(true);
    setActiveTab('edit');
  };

  const handleCreateTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: `custom_${Date.now()}`,
      name: 'Nueva Plantilla',
      subject: 'Asunto del email',
      htmlBody: '<p>Contenido HTML aquí...</p>',
      textBody: 'Contenido en texto plano aquí...',
      variables: [],
      category: 'client'
    };
    setEditingTemplate(newTemplate);
    setIsEditing(true);
    setActiveTab('edit');
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      try {
        // Validar campos requeridos
        if (!editingTemplate.name.trim()) {
          toast.error('El nombre de la plantilla es requerido');
          return;
        }
        if (!editingTemplate.subject.trim()) {
          toast.error('El asunto de la plantilla es requerido');
          return;
        }
        if (!editingTemplate.htmlBody.trim()) {
          toast.error('El contenido HTML es requerido');
          return;
        }

        // Guardar en localStorage para persistencia temporal
        const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
        const templateIndex = savedTemplates.findIndex((t: any) => t.id === editingTemplate.id);
        
        if (templateIndex >= 0) {
          // Actualizar plantilla existente
          savedTemplates[templateIndex] = editingTemplate;
        } else {
          // Agregar nueva plantilla
          savedTemplates.push(editingTemplate);
        }
        
                localStorage.setItem('customTemplates', JSON.stringify(savedTemplates));
        
        // Actualizar estado local
        setCustomTemplates(savedTemplates);
        setSelectedTemplate(editingTemplate);
        setIsEditing(false);
        setActiveTab('preview');
        
        // Mostrar confirmación
        toast.success('✅ Plantilla guardada exitosamente');
        
        console.log('✅ Plantilla guardada:', editingTemplate.name);
      } catch (error) {
        console.error('❌ Error al guardar plantilla:', error);
        toast.error('❌ Error al guardar la plantilla');
      }
    }
  };

  const handlePreviewDataChange = (key: string, value: string) => {
    setPreviewData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const insertVariable = (variableKey: string) => {
    if (editingTemplate) {
      // Insertar variable en el cursor (simplificado - en HTML textarea)
      const variable = `{{${variableKey}}}`;
      // TODO: Implementar inserción en la posición del cursor
      console.log('Insertando variable:', variable);
    }
  };

  const getPreviewContent = () => {
    if (!selectedTemplate) return { subject: '', html: '', text: '' };
    
    return {
      subject: replaceTemplateVariables(selectedTemplate.subject, previewData),
      html: replaceTemplateVariables(selectedTemplate.htmlBody, previewData),
      text: replaceTemplateVariables(selectedTemplate.textBody, previewData)
    };
  };

  const preview = getPreviewContent();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Plantillas */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Plantillas Disponibles
                  </div>
                  <Button 
                    onClick={handleCreateTemplate}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva
                  </Button>
                </CardTitle>
                <CardDescription>
                  Selecciona una plantilla para ver o editar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Plantillas para Reservas */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Reservas
                    </h4>
                    {getTemplatesByCategoryMerged('reservation').map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {template.variables.length} variables
                              </Badge>
                              {template.attachmentType === 'pdf' && (
                                <Badge variant="secondary" className="text-xs">
                                  📎 PDF
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTemplate(template);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Plantillas para Clientes */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Para Clientes
                    </h4>
                    {getTemplatesByCategoryMerged('client').map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {template.variables.length} variables
                              </Badge>
                              {template.attachmentType === 'pdf' && (
                                <Badge variant="secondary" className="text-xs">
                                  📎 PDF
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTemplate(template);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Plantillas para Proveedores */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Building className="h-4 w-4 text-orange-600" />
                      Para Proveedores
                    </h4>
                    {getTemplatesByCategoryMerged('supplier').map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {template.variables.length} variables
                              </Badge>
                              {template.attachmentType === 'pdf' && (
                                <Badge variant="secondary" className="text-xs">
                                  📎 PDF
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTemplate(template);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor/Preview */}
          <div className="lg:col-span-2">
            {selectedTemplate || editingTemplate ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-600" />
                      {isEditing ? 'Editando: ' : 'Vista previa: '}
                      {(editingTemplate || selectedTemplate)?.name}
                    </span>
                    {isEditing && (
                      <Button onClick={handleSaveTemplate} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Guardar
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                      <TabsTrigger value="edit">Editar</TabsTrigger>
                      <TabsTrigger value="variables">Variables</TabsTrigger>
                    </TabsList>

                    {/* Vista Previa */}
                    <TabsContent value="preview" className="space-y-4">
                      {selectedTemplate && (
                        <div className="space-y-4">
                          {/* Configurar datos de preview */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="col-span-full font-semibold text-gray-700">
                              Datos para Vista Previa:
                            </h4>
                            {selectedTemplate.variables.slice(0, 6).map((variable) => (
                              <div key={variable.key}>
                                <Label htmlFor={variable.key} className="text-xs">
                                  {variable.label}
                                </Label>
                                <Input
                                  id={variable.key}
                                  type={variable.type === 'date' ? 'date' : 
                                        variable.type === 'number' || variable.type === 'currency' ? 'number' : 'text'}
                                  value={previewData[variable.key] || ''}
                                  onChange={(e) => handlePreviewDataChange(variable.key, e.target.value)}
                                  className="text-xs"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Preview del email */}
                          <div className="space-y-3">
                            <div>
                              <Label className="font-semibold">Asunto:</Label>
                              <div className="p-2 bg-blue-50 border rounded text-sm">
                                {preview.subject}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="font-semibold">Contenido HTML:</Label>
                              <div 
                                className="p-4 bg-white border rounded min-h-[300px] text-sm"
                                dangerouslySetInnerHTML={{ __html: preview.html }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Editor */}
                    <TabsContent value="edit" className="space-y-4">
                      {!editingTemplate && selectedTemplate && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">Haz clic en el botón "Editar" (✏️) para modificar esta plantilla</p>
                          <Button 
                            onClick={() => handleEditTemplate(selectedTemplate)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar esta plantilla
                          </Button>
                        </div>
                      )}
                      {!selectedTemplate && !editingTemplate && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Selecciona una plantilla de la lista para editarla</p>
                        </div>
                      )}
                      {editingTemplate && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="templateName">Nombre de la Plantilla</Label>
                              <Input
                                id="templateName"
                                value={editingTemplate.name}
                                onChange={(e) => setEditingTemplate(prev => 
                                  prev ? { ...prev, name: e.target.value } : null
                                )}
                              />
                            </div>
                            <div>
                              <Label htmlFor="templateCategory">Categoría</Label>
                              <Select
                                value={editingTemplate.category}
                                onValueChange={(value: 'client' | 'supplier' | 'system' | 'reservation') => 
                                  setEditingTemplate(prev => 
                                    prev ? { ...prev, category: value } : null
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client">Para Clientes</SelectItem>
                                  <SelectItem value="supplier">Para Proveedores</SelectItem>
                                  <SelectItem value="reservation">Para Reservas</SelectItem>
                                  <SelectItem value="system">Sistema</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="templateSubject">Asunto</Label>
                            <Input
                              id="templateSubject"
                              value={editingTemplate.subject}
                              onChange={(e) => setEditingTemplate(prev => 
                                prev ? { ...prev, subject: e.target.value } : null
                              )}
                              placeholder="Usa {{variable}} para datos dinámicos"
                            />
                          </div>

                          <div>
                            <Label htmlFor="templateHtml">Contenido HTML</Label>
                            <Textarea
                              id="templateHtml"
                              value={editingTemplate.htmlBody}
                              onChange={(e) => setEditingTemplate(prev => 
                                prev ? { ...prev, htmlBody: e.target.value } : null
                              )}
                              rows={12}
                              placeholder="Contenido HTML del email..."
                              className="font-mono text-sm"
                            />
                          </div>

                          <div>
                            <Label htmlFor="templateText">Contenido de Texto</Label>
                            <Textarea
                              id="templateText"
                              value={editingTemplate.textBody}
                              onChange={(e) => setEditingTemplate(prev => 
                                prev ? { ...prev, textBody: e.target.value } : null
                              )}
                              rows={6}
                              placeholder="Versión en texto plano..."
                            />
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Variables */}
                    <TabsContent value="variables" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <Brackets className="h-4 w-4" />
                            Variables Disponibles
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Haz clic en una variable para copiar su código. Úsala en el formato {`{{variable}}`} en tus plantillas.
                          </p>
                        </div>

                        {Object.entries(templateVariables).map(([category, variables]) => (
                          <div key={category} className="space-y-2">
                            <h5 className="font-medium text-gray-700 capitalize">{category}:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {variables.map((variable) => (
                                <div
                                  key={variable.key}
                                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`{{${variable.key}}}`);
                                    toast.success(`Variable {{${variable.key}}} copiada al portapapeles`);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{variable.label}</p>
                                      <p className="text-xs text-gray-500">{variable.description}</p>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {`{{${variable.key}}}`}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Badge variant={variable.required ? 'destructive' : 'secondary'} className="text-xs">
                                        {variable.required ? 'Requerido' : 'Opcional'}
                                      </Badge>
                                      <Copy className="h-3 w-3 text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Selecciona una Plantilla
                    </h3>
                    <p className="text-gray-500">
                      Elige una plantilla de la lista para verla o editarla
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Botón temporal para limpiar cache */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => {
            localStorage.removeItem('customTemplates');
            setCustomTemplates([]);
            setSelectedTemplate(null);
            setEditingTemplate(null);
            setIsEditing(false);
            toast.success('✅ Cache limpiado. Plantillas actualizadas.');
            window.location.reload();
          }}
          variant="outline"
          size="sm"
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          🔄 Limpiar Cache
        </Button>
      </div>
    </div>
  );
} 