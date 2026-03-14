'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserCheck, UserPlus, X, Search } from 'lucide-react';
import { createCRMLead } from '@/actions/crm/leads';
import { getCRMStages } from '@/actions/crm/stages';
import { createClient } from '@/actions/clients/create';
import { toast } from 'sonner';
import { getClientByRut, getClientByEmail } from '@/lib/client-actions';

export function CreateLeadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState([]);

  // Contact info fields
  const [contactData, setContactData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    email: '',
    telefono: '',
  });

  // Client matching state
  const [matchedClient, setMatchedClient] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: 'manual',
    stage_id: 1,
    priority: 'medium',
    estimated_value: 0,
    probability: 50,
    expected_close_date: '',
    notes: '',
    tags: [] as string[],
  });

  // Load stages
  useEffect(() => {
    const loadStages = async () => {
      try {
        const result = await getCRMStages();
        if (result.success && result.data) {
          setStages(result.data);
          if (result.data.length > 0) {
            setFormData(prev => ({ ...prev, stage_id: result.data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error loading stages:', error);
      }
    };
    loadStages();
  }, []);

  // Search for existing client by RUT or email with debounce
  const searchClient = useCallback(async () => {
    const rut = contactData.rut.trim();
    const email = contactData.email.trim();

    if (!rut && !email) {
      setMatchedClient(null);
      setSearchDone(false);
      return;
    }

    setSearching(true);
    setMatchedClient(null);

    try {
      // Search by RUT first (most unique identifier)
      if (rut) {
        const result = await getClientByRut(rut);
        if (result.success && result.client) {
          setMatchedClient(result.client);
          setSearching(false);
          setSearchDone(true);
          return;
        }
      }

      // If no match by RUT, try email
      if (email) {
        const result = await getClientByEmail(email);
        if (result.success && result.client) {
          setMatchedClient(result.client);
          setSearching(false);
          setSearchDone(true);
          return;
        }
      }

      // No match found
      setSearchDone(true);
    } catch (error) {
      console.error('Error searching client:', error);
    } finally {
      setSearching(false);
    }
  }, [contactData.rut, contactData.email]);

  // Auto-search when RUT or email changes (debounced)
  useEffect(() => {
    const rut = contactData.rut.trim();
    const email = contactData.email.trim();

    if (!rut && !email) {
      setMatchedClient(null);
      setSearchDone(false);
      return;
    }

    // Minimum length to trigger search
    if (rut.length < 7 && email.length < 5) return;

    const timer = setTimeout(() => {
      searchClient();
    }, 600);

    return () => clearTimeout(timer);
  }, [contactData.rut, contactData.email, searchClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('El título del lead es obligatorio');
      return;
    }

    if (!contactData.nombre.trim()) {
      toast.error('El nombre del contacto es obligatorio');
      return;
    }

    setLoading(true);

    try {
      let clientId: number | undefined;

      if (matchedClient) {
        // Use existing client
        clientId = matchedClient.id;
      } else if (contactData.nombre.trim()) {
        // Create new client
        const clientResult = await createClient({
          tipoCliente: 'PERSONA',
          nombrePrincipal: contactData.nombre.trim(),
          apellido: contactData.apellido.trim() || undefined,
          rut: contactData.rut.trim() || undefined,
          email: contactData.email.trim() || undefined,
          telefonoMovil: contactData.telefono.trim() || undefined,
        });

        if (clientResult.success && clientResult.data) {
          clientId = clientResult.data.id;
          toast.success('Cliente creado automáticamente');
        } else {
          // Don't block lead creation if client creation fails
          console.error('Error creating client:', clientResult.error);
          toast.error(`No se pudo crear el cliente: ${clientResult.error}`);
          setLoading(false);
          return;
        }
      }

      const result = await createCRMLead({
        ...formData,
        client_id: clientId,
        estimated_value: Number(formData.estimated_value),
        probability: Number(formData.probability),
        expected_close_date: formData.expected_close_date || undefined,
        tags: formData.tags
      });

      if (result.success) {
        toast.success('Lead creado exitosamente');
        router.push('/dashboard/crm');
      } else {
        toast.error(result.error || 'Error al crear el lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Error al crear el lead');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
    // Reset match when changing contact info
    if (field === 'rut' || field === 'email') {
      setMatchedClient(null);
      setSearchDone(false);
    }
  };

  const clearMatchedClient = () => {
    setMatchedClient(null);
    setSearchDone(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Lead info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Título del Lead *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ej: Cotización materiales - María González"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Fuente</Label>
          <select
            id="source"
            value={formData.source}
            onChange={(e) => handleInputChange('source', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="web">Web</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telefono">Teléfono</option>
            <option value="email">Email</option>
            <option value="referido">Referido</option>
            <option value="manual">Manual</option>
            <option value="walk_in">Walk-in</option>
          </select>
        </div>
      </div>

      {/* Contact info section */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Label className="text-base font-semibold">Datos del Contacto</Label>
          <span className="text-xs text-gray-500">Se buscará automáticamente si el cliente ya existe</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_nombre">Nombre *</Label>
            <Input
              id="contact_nombre"
              value={contactData.nombre}
              onChange={(e) => handleContactChange('nombre', e.target.value)}
              placeholder="María"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_apellido">Apellido</Label>
            <Input
              id="contact_apellido"
              value={contactData.apellido}
              onChange={(e) => handleContactChange('apellido', e.target.value)}
              placeholder="González"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_rut">RUT</Label>
            <Input
              id="contact_rut"
              value={contactData.rut}
              onChange={(e) => handleContactChange('rut', e.target.value)}
              placeholder="12.345.678-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={contactData.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              placeholder="maria@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_telefono">Teléfono</Label>
            <Input
              id="contact_telefono"
              value={contactData.telefono}
              onChange={(e) => handleContactChange('telefono', e.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </div>
        </div>

        {/* Search indicator */}
        {searching && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Buscando cliente...
          </div>
        )}

        {/* Matched client alert */}
        {matchedClient && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 text-sm">
                    Cliente encontrado - Se vinculará automáticamente
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    {matchedClient.nombrePrincipal} {matchedClient.apellido || ''}
                  </p>
                  <p className="text-xs text-green-700">
                    {matchedClient.rut && `RUT: ${matchedClient.rut}`}
                    {matchedClient.rut && matchedClient.email && ' | '}
                    {matchedClient.email && `Email: ${matchedClient.email}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearMatchedClient}
                className="text-green-600 hover:text-green-800"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* No match found - will create new */}
        {searchDone && !matchedClient && !searching && (contactData.rut.trim() || contactData.email.trim()) && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 text-sm">
                  Cliente no encontrado - Se creará automáticamente
                </p>
                <p className="text-xs text-blue-700">
                  Al crear el lead, se registrará un nuevo cliente con los datos ingresados.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe el lead y sus necesidades..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="stage">Etapa del Pipeline</Label>
          <select
            id="stage"
            value={formData.stage_id}
            onChange={(e) => handleInputChange('stage_id', Number(e.target.value))}
            className="w-full p-2 border rounded-md"
          >
            {stages.map((stage: any) => (
              <option key={stage.id} value={stage.id}>
                {stage.description}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="estimated_value">Valor Estimado</Label>
          <Input
            id="estimated_value"
            type="number"
            value={formData.estimated_value}
            onChange={(e) => handleInputChange('estimated_value', Number(e.target.value))}
            placeholder="0"
            min="0"
            step="1000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="probability">Probabilidad (%)</Label>
          <Input
            id="probability"
            type="number"
            value={formData.probability}
            onChange={(e) => handleInputChange('probability', Number(e.target.value))}
            placeholder="50"
            min="0"
            max="100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expected_close_date">Fecha Esperada</Label>
          <Input
            id="expected_close_date"
            type="date"
            value={formData.expected_close_date}
            onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Notas adicionales sobre el lead..."
          rows={3}
        />
      </div>

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/crm')}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear Lead
        </Button>
      </div>
    </form>
  );
}
