'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import {
  createPurchaseInvoice as createPurchaseInvoiceAdvanced,
  createPurchaseInvoiceLines,
} from '@/actions/purchases/purchase-invoices';
import { findProductsForInvoiceLines } from '@/actions/purchases/common';

type ImportStatus = 'created' | 'duplicate' | 'error';

export interface XmlBatchImportItemResult {
  fileName: string;
  sourceFileName?: string;
  sourceDocumentIndex?: number; // 1-based dentro del XML SetDTE
  status: ImportStatus;
  supplierRut?: string;
  supplierName?: string;
  supplierInvoiceNumber?: string;
  invoiceId?: number;
  internalInvoiceNumber?: string;
  message: string;
}

export interface XmlBatchImportBatchResult {
  success: boolean;
  summary: {
    total: number;
    created: number;
    duplicates: number;
    errors: number;
  };
  results: XmlBatchImportItemResult[];
  error?: string;
}

interface ParsedXmlInvoice {
  supplierRut: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxBreakdown: string[];
  standardVatRate?: number | null;
  hasAdditionalTaxes: boolean;
  lines: Array<{
    description: string;
    quantity: number;
    subtotal: number;
    unit_price: number;
    productCode?: string | null;
    unit?: string | null;
    isExempt?: boolean;
  }>;
}

async function getLastWarehouseForSupplier(supplierId: number): Promise<number | null> {
  try {
    if (!supplierId) return null;
    const supabase = await getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('purchase_invoices')
      .select('warehouse_id, issue_date, created_at')
      .eq('supplier_id', supplierId)
      .not('warehouse_id', 'is', null)
      .order('issue_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('⚠️ [XML_BATCH] No se pudo obtener historial de bodega por proveedor:', error.message);
      return null;
    }

    const row = (data || []).find((r: any) => Number(r.warehouse_id) > 0);
    return row ? Number(row.warehouse_id) : null;
  } catch (error) {
    console.warn('⚠️ [XML_BATCH] Error obteniendo historial de bodega por proveedor:', error);
    return null;
  }
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeRut(value: string): string {
  return String(value || '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase();
}

function normalizeSupplierInvoiceNumber(value: string): string {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';

  // Si es solo numérico, ignorar ceros a la izquierda (812308 == 00812308)
  if (/^\d+$/.test(raw)) {
    return String(parseInt(raw, 10) || 0);
  }

  // Para formatos mixtos (ej. F00123A), normalizar espacios/separadores pero mantener estructura
  return raw.replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
}

function buildRutVariants(rut: string): string[] {
  const clean = normalizeRut(rut);
  if (!clean || clean.length < 2) return [];
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const dottedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return Array.from(
    new Set([
      clean,
      `${body}-${dv}`,
      `${dottedBody}-${dv}`,
      `${dottedBody}${dv}`,
    ].filter(Boolean))
  );
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[(.*)\]\]>$/s, '$1');
}

function getTagValue(xml: string, tag: string): string | null {
  const pattern = new RegExp(
    `<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`,
    'i'
  );
  const match = xml.match(pattern);
  if (!match) return null;
  return decodeXmlEntities(stripCdata(match[1]).trim());
}

function getFirstTagValue(xml: string, tags: string[]): string | null {
  for (const tag of tags) {
    const value = getTagValue(xml, tag);
    if (value) return value;
  }
  return null;
}

function getTagBlocks(xml: string, tag: string): string[] {
  const pattern = new RegExp(
    `<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`,
    'gi'
  );
  const results: string[] = [];
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(xml)) !== null) {
    results.push(match[0]);
  }
  return results;
}

function parseNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const raw = String(value).trim().replace(/\s+/g, '');
  if (!raw) return 0;

  let normalized = raw;

  const hasDot = raw.includes('.');
  const hasComma = raw.includes(',');

  if (hasDot && hasComma) {
    // Usar como separador decimal el último símbolo que aparezca
    const lastDot = raw.lastIndexOf('.');
    const lastComma = raw.lastIndexOf(',');
    const decimalSep = lastDot > lastComma ? '.' : ',';
    if (decimalSep === '.') {
      normalized = raw.replace(/,/g, '');
    } else {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    // 1.234,56 => 1234.56 | 25,5 => 25.5
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else {
    // Solo punto o entero. En XML DTE normalmente el punto es decimal (25.0000, 2600.000000)
    normalized = raw;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function parseXmlInvoice(xmlContent: string): ParsedXmlInvoice {
  const headerBlock = getFirstTagValue(xmlContent, ['Encabezado']) || xmlContent;
  const idDocBlock = getFirstTagValue(headerBlock, ['IdDoc']) || headerBlock;
  const emisorBlock = getFirstTagValue(headerBlock, ['Emisor']) || headerBlock;
  const totalsBlock = getFirstTagValue(headerBlock, ['Totales']) || headerBlock;
  const tipoDte = getFirstTagValue(idDocBlock, ['TipoDTE']);

  const supplierRut = getFirstTagValue(emisorBlock, ['RUTEmisor', 'RutEmisor']);
  const supplierName = getFirstTagValue(emisorBlock, ['RznSoc', 'RznSocEmisor', 'RznSocRecep']) || 'Proveedor sin nombre';
  const folio = getFirstTagValue(idDocBlock, ['Folio']);
  const issueDate = normalizeDate(getFirstTagValue(idDocBlock, ['FchEmis'])) || new Date().toISOString().slice(0, 10);
  const dueDate = normalizeDate(getFirstTagValue(idDocBlock, ['FchVenc'])) || issueDate;

  if (!supplierRut) {
    throw new Error('No se encontró RUT del proveedor (RUTEmisor)');
  }
  if (!folio) {
    throw new Error('No se encontró número de factura (Folio)');
  }
  if (tipoDte && tipoDte !== '33') {
    throw new Error(`TipoDTE ${tipoDte} no soportado aún (solo 33)`);
  }

  const detailBlocks = getTagBlocks(xmlContent, 'Detalle');
  const lines = detailBlocks.map((detail) => {
    const name = getFirstTagValue(detail, ['NmbItem']) || 'Ítem sin descripción';
    const desc = getFirstTagValue(detail, ['DscItem']);
    const quantity = parseNumber(getFirstTagValue(detail, ['QtyItem'])) || 1;
    const lineTotal = parseNumber(getFirstTagValue(detail, ['MontoItem']));
    const explicitPrice = parseNumber(getFirstTagValue(detail, ['PrcItem']));
    const indExe = getFirstTagValue(detail, ['IndExe']);
    const isExempt = String(indExe || '').trim() === '1';
    const productCode = getFirstTagValue(detail, ['VlrCodigo']);
    const unit = getFirstTagValue(detail, ['UnmdItem']);
    const unitPrice = explicitPrice > 0 ? explicitPrice : (lineTotal > 0 ? lineTotal / quantity : 0);

    return {
      description: [name, desc].filter(Boolean).join(' - ').slice(0, 250),
      quantity: quantity > 0 ? quantity : 1,
      subtotal: lineTotal > 0 ? lineTotal : (quantity > 0 ? unitPrice * quantity : 0),
      unit_price: unitPrice > 0 ? unitPrice : 0,
      productCode: productCode ? String(productCode).trim() : null,
      unit: unit ? String(unit).trim() : null,
      isExempt,
    };
  }).filter((line) => line.quantity > 0 && (line.unit_price > 0 || line.subtotal > 0));

  if (lines.length === 0) {
    throw new Error('No se encontraron líneas válidas en el XML');
  }

  const mntNeto = parseNumber(getFirstTagValue(totalsBlock, ['MntNeto']));
  const mntExe = parseNumber(getFirstTagValue(totalsBlock, ['MntExe']));
  const iva = parseNumber(getFirstTagValue(totalsBlock, ['IVA']));
  const tasaIva = parseNumber(getFirstTagValue(totalsBlock, ['TasaIVA']));
  const totalAmount = parseNumber(getFirstTagValue(totalsBlock, ['MntTotal']));

  const imptoRetenBlocks = getTagBlocks(totalsBlock, 'ImptoReten');
  let additionalTaxes = 0;
  const taxBreakdown: string[] = [];

  if (iva > 0) {
    taxBreakdown.push(`IVA:${iva}`);
  }

  for (const impBlock of imptoRetenBlocks) {
    const tipoImp = getFirstTagValue(impBlock, ['TipoImp']) || 'N/A';
    const tasaImp = getFirstTagValue(impBlock, ['TasaImp']) || '0';
    const montoImp = parseNumber(getFirstTagValue(impBlock, ['MontoImp']));
    additionalTaxes += montoImp;
    taxBreakdown.push(`ImptoReten(${tipoImp}) ${tasaImp}%:${montoImp}`);
  }

  const subtotalFromHeader = (mntNeto || 0) + (mntExe || 0);
  const subtotalFromLines = Math.round(lines.reduce((sum, line) => sum + (line.subtotal || 0), 0));
  const subtotalAmount = subtotalFromHeader > 0 ? subtotalFromHeader : subtotalFromLines;
  const taxAmount = totalAmount > 0
    ? Math.max(0, Math.round(totalAmount - subtotalAmount))
    : Math.round(iva + additionalTaxes);

  return {
    supplierRut,
    supplierName,
    supplierInvoiceNumber: String(folio).trim(),
    issueDate,
    dueDate,
    subtotalAmount,
    taxAmount,
    totalAmount,
    taxBreakdown,
    standardVatRate: tasaIva > 0 ? tasaIva : (iva > 0 ? 19 : null),
    hasAdditionalTaxes: imptoRetenBlocks.length > 0,
    lines,
  };
}

function allocateTaxByLines(
  lines: ParsedXmlInvoice['lines'],
  totalTaxAmount: number,
  options?: {
    standardVatRate?: number | null;
    forceUniformVatRate?: boolean;
  }
): Array<{ taxAmount: number; taxRate: number; lineTotal: number }> {
  const lineBases = lines.map((line) => Math.round(Number(line.subtotal || (line.quantity * line.unit_price) || 0)));
  const taxableIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) => !line.isExempt && lineBases[index] > 0)
    .map(({ index }) => index);

  const taxableBaseTotal = taxableIndexes.reduce((sum, index) => sum + lineBases[index], 0);

  const allocated = lines.map((_, index) => ({
    taxAmount: 0,
    taxRate: 0,
    lineTotal: lineBases[index],
  }));

  if (totalTaxAmount <= 0 || taxableBaseTotal <= 0) {
    return allocated;
  }

  let accumulated = 0;
  taxableIndexes.forEach((lineIndex, pos) => {
    const base = lineBases[lineIndex];
    const isLast = pos === taxableIndexes.length - 1;
    const taxAmount = isLast
      ? (totalTaxAmount - accumulated)
      : Math.round((totalTaxAmount * base) / taxableBaseTotal);

    accumulated += taxAmount;
    allocated[lineIndex] = {
      taxAmount,
      taxRate: (
        options?.forceUniformVatRate &&
        typeof options?.standardVatRate === 'number' &&
        options.standardVatRate > 0
      )
        ? Number(options.standardVatRate)
        : (base > 0 ? Number(((taxAmount / base) * 100).toFixed(6)) : 0),
      lineTotal: base + taxAmount,
    };
  });

  return allocated;
}

export async function importPurchaseInvoicesXmlBatch(formData: FormData): Promise<XmlBatchImportBatchResult> {
  try {
    const warehouseRaw = String(formData.get('warehouse_id') || '').trim();
    const manualWarehouseId =
      warehouseRaw && warehouseRaw !== '__AUTO__' ? Number(warehouseRaw) : null;
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);
    const targetDocIndexRaw = formData.get('target_doc_index');
    const targetDocIndex = targetDocIndexRaw ? Number(targetDocIndexRaw) : null;

    if (manualWarehouseId !== null && (Number.isNaN(manualWarehouseId) || manualWarehouseId <= 0)) {
      return {
        success: false,
        error: 'La bodega seleccionada no es válida',
        summary: { total: 0, created: 0, duplicates: 0, errors: 0 },
        results: [],
      };
    }

    if (files.length === 0) {
      return {
        success: false,
        error: 'Debe seleccionar al menos un archivo XML',
        summary: { total: 0, created: 0, duplicates: 0, errors: 0 },
        results: [],
      };
    }

    const supabase = await getSupabaseServiceClient();

    let suppliers: any[] | null = null;
    let suppliersError: any = null;

    // Compatibilidad de esquemas: algunos ambientes tienen taxId, otros tax_id
    let suppliersRes = await supabase
      .from('Supplier')
      .select('id, name, vat, taxId, active');
    suppliers = suppliersRes.data as any[] | null;
    suppliersError = suppliersRes.error;

    if (suppliersError && String(suppliersError.message || '').toLowerCase().includes('taxid')) {
      suppliersRes = await supabase
        .from('Supplier')
        .select('id, name, vat, tax_id, active');
      suppliers = suppliersRes.data as any[] | null;
      suppliersError = suppliersRes.error;
    }

    if (suppliersError) {
      throw new Error(`Error cargando proveedores: ${suppliersError.message}`);
    }

    const suppliersByRut = new Map<string, { id: number; name: string; vat?: string | null; active?: boolean | null }>();
    const inactiveSuppliersByRut = new Map<string, { id: number; name: string; vat?: string | null; active?: boolean | null }>();
    for (const supplier of suppliers || []) {
      const rutCandidates = [
        (supplier as any).vat,
        (supplier as any).taxId,
        (supplier as any).tax_id,
      ].filter(Boolean);

      for (const rutCandidate of rutCandidates) {
        const variants = buildRutVariants(String(rutCandidate || ''));
        for (const variant of variants) {
          const targetMap = (supplier as any).active === false ? inactiveSuppliersByRut : suppliersByRut;
          targetMap.set(variant, supplier as any);
          targetMap.set(normalizeRut(variant), supplier as any);
        }
      }
    }

    const results: XmlBatchImportItemResult[] = [];

    for (const file of files) {
      try {
        const xmlText = await file.text();
        const documentBlocks = getTagBlocks(xmlText, 'Documento');
        const docsToProcess = documentBlocks.length > 0 ? documentBlocks : [xmlText];
        const filteredDocs = targetDocIndex && docsToProcess.length > 1
          ? docsToProcess.filter((_, idx) => idx + 1 === targetDocIndex)
          : docsToProcess;

        for (let index = 0; index < filteredDocs.length; index++) {
          const docXml = filteredDocs[index];
          const originalDocIndex = targetDocIndex && docsToProcess.length > 1
            ? targetDocIndex
            : index + 1;
          const baseResult: XmlBatchImportItemResult = {
            fileName: docsToProcess.length > 1 ? `${file.name} [Doc ${originalDocIndex}]` : file.name,
            sourceFileName: file.name,
            sourceDocumentIndex: docsToProcess.length > 1 ? originalDocIndex : 1,
            status: 'error',
            message: 'Error no especificado',
          };

          try {
            const parsed = parseXmlInvoice(docXml);
            const normalizedSupplierRut = normalizeRut(parsed.supplierRut);

            baseResult.supplierRut = parsed.supplierRut;
            baseResult.supplierName = parsed.supplierName;
            baseResult.supplierInvoiceNumber = parsed.supplierInvoiceNumber;

            const supplier =
              suppliersByRut.get(normalizedSupplierRut) ||
              buildRutVariants(parsed.supplierRut).map((v) => suppliersByRut.get(v)).find(Boolean) ||
              inactiveSuppliersByRut.get(normalizedSupplierRut) ||
              buildRutVariants(parsed.supplierRut).map((v) => inactiveSuppliersByRut.get(v)).find(Boolean);

            if (!supplier) {
              throw new Error(
                `Proveedor no encontrado por RUT ${parsed.supplierRut}. Sugerencia: crear o actualizar proveedor "${parsed.supplierName}" con ese RUT en el maestro de proveedores.`
              );
            }

            baseResult.supplierName = supplier.name;

            const { data: existingCandidates, error: duplicateCheckError } = await supabase
              .from('purchase_invoices')
              .select('id, number, supplier_invoice_number')
              .eq('supplier_id', supplier.id)
              .not('supplier_invoice_number', 'is', null)
              .limit(500);

            if (duplicateCheckError) {
              throw new Error(`Error validando duplicado: ${duplicateCheckError.message}`);
            }

            const normalizedInvoiceNumber = normalizeSupplierInvoiceNumber(parsed.supplierInvoiceNumber);
            const existing = (existingCandidates || []).find((candidate: any) =>
              normalizeSupplierInvoiceNumber(candidate?.supplier_invoice_number || '') === normalizedInvoiceNumber
            );

            if (existing) {
              results.push({
                ...baseResult,
                status: 'duplicate',
                invoiceId: Number(existing.id),
                internalInvoiceNumber: String(existing.number || ''),
                message: `Ya existe (${existing.number || 'sin número interno'})`,
              });
              continue;
            }

            const normalizedTotal = parsed.totalAmount > 0
              ? Math.round(parsed.totalAmount)
              : Math.round(parsed.subtotalAmount + parsed.taxAmount);
            const normalizedSubtotal = Math.round(parsed.subtotalAmount);
            const normalizedTax = Math.round(parsed.taxAmount);
            const productMatches = await findProductsForInvoiceLines(
              parsed.lines.map((line) => ({
                description: line.description,
                productCode: line.productCode || undefined,
                quantity: line.quantity,
                unitPrice: line.unit_price,
                unit: line.unit || undefined,
              })),
              supplier.id
            );

            const preparedLines = parsed.lines.map((line, lineIndex) => {
              const match = productMatches[lineIndex];
              const matchType = String(match?.matchType || '');
              const confidence = Number(match?.confidence || 0);
              const hasAutoMatch =
                !!match?.productMatch &&
                (confidence >= 0.85 || matchType === 'sku_exact' || matchType === 'memory');

              const topSuggestions = (match?.suggestions || [])
                .slice(0, 3)
                .map((s: any) => `${s.name}${s.sku ? ` (${s.sku})` : ''}`);

              return {
                ...line,
                _matchedProductId: hasAutoMatch ? Number(match?.productMatch?.id) : null,
                _matchConfidence: confidence,
                _matchType: matchType || 'none',
                _suggestions: topSuggestions,
              };
            });

            const unmatchedLines = preparedLines.filter((line) => !line._matchedProductId);
            const matchingSummary = `Matching productos XML: ${preparedLines.length - unmatchedLines.length}/${preparedLines.length} autoasignados`;
            // Solo mostrar sugerencias cuando la confianza es >= 0.5 para evitar sugerencias irrelevantes (ej. Sonoterapia para "Otros Cargos")
            const minConfidenceForSuggestions = 0.5;
            const unmatchedSummary = unmatchedLines.length > 0
              ? `Revisar productos: ${unmatchedLines.slice(0, 6).map((line, idx) => {
                  const showSuggestions = line._matchConfidence >= minConfidenceForSuggestions && (line._suggestions || []).length > 0;
                  return `L${idx + 1} ${line.description}${showSuggestions ? ` -> ${(line._suggestions || []).join(', ')}` : ''}`;
                }).join(' | ')}`
              : '';

            // Detalle del XML para datos adjuntos: montos totales y líneas con productos
            const xmlDetailParts: string[] = [];
            xmlDetailParts.push(`Detalle XML: Subtotal $${normalizedSubtotal.toLocaleString('es-CL')} | IVA $${normalizedTax.toLocaleString('es-CL')} | Total $${normalizedTotal.toLocaleString('es-CL')}`);
            preparedLines.forEach((line, idx) => {
              const qty = Number(line.quantity) || 1;
              const unitPrice = Number(line.unit_price) || 0;
              const subtotal = Math.round(Number(line.subtotal) || qty * unitPrice);
              xmlDetailParts.push(`L${idx + 1}: ${line.description} | ${qty} x $${unitPrice.toLocaleString('es-CL')} = $${subtotal.toLocaleString('es-CL')}`);
            });

            const historicalWarehouseId = await getLastWarehouseForSupplier(supplier.id);
            const resolvedInvoiceWarehouseId = manualWarehouseId || historicalWarehouseId || null;

            const createResult = await createPurchaseInvoiceAdvanced({
              number: '',
              supplier_id: supplier.id,
              supplier_invoice_number: parsed.supplierInvoiceNumber,
              warehouse_id: resolvedInvoiceWarehouseId,
              issue_date: parsed.issueDate,
              due_date: parsed.dueDate,
              subtotal: normalizedSubtotal,
              tax_amount: normalizedTax,
              total: normalizedTotal,
              status: 'draft',
              notes: [
                `Importada desde XML (${file.name})`,
                resolvedInvoiceWarehouseId
                  ? `Bodega cabecera autoasignada: ${manualWarehouseId ? 'selección manual' : 'historial proveedor'} (${resolvedInvoiceWarehouseId})`
                  : 'Bodega cabecera no asignada (se usará revisión por línea/producto si aplica)',
                xmlDetailParts.join(' | '),
                parsed.taxBreakdown.length > 0 ? `Impuestos XML: ${parsed.taxBreakdown.join(' | ')}` : '',
                matchingSummary,
                unmatchedSummary,
              ].filter(Boolean).join(' - '),
            });

            if (!createResult.success || !createResult.data) {
              const err = createResult.error || 'No se pudo crear la factura';
              if (err.toLowerCase().includes('ya existe una factura')) {
                results.push({
                  ...baseResult,
                  status: 'duplicate',
                  message: err,
                });
                continue;
              }
              throw new Error(err);
            }

            const allocations = allocateTaxByLines(parsed.lines, normalizedTax, {
              standardVatRate: parsed.standardVatRate,
              // Si el DTE trae solo IVA (sin impuestos adicionales), mostrar la tasa uniforme del XML
              forceUniformVatRate: !parsed.hasAdditionalTaxes && !!parsed.standardVatRate,
            });
            const linesResult = await createPurchaseInvoiceLines(
              Number(createResult.data.id),
              preparedLines.map((line, lineIndex) => ({
                productId: line._matchedProductId || null,
                description: line._matchedProductId ? line.description : `[REVISAR PRODUCTO] ${line.description}`,
                productCode: line.productCode || null,
                quantity: Number(line.quantity) || 0,
                unitPrice: Number(line.unit_price) || 0,
                discountPercent: 0,
                discountAmount: 0,
                taxRate: allocations[lineIndex]?.taxRate || 0,
                taxAmount: allocations[lineIndex]?.taxAmount || 0,
                lineTotal: allocations[lineIndex]?.lineTotal ?? Math.round(line.subtotal || 0),
              }))
            );

            if (!linesResult.success) {
              throw new Error(linesResult.error || 'Factura creada pero falló la creación de líneas');
            }

            results.push({
              ...baseResult,
              status: 'created',
              invoiceId: Number(createResult.data.id),
              internalInvoiceNumber: String(createResult.data.number || ''),
              message: `Creada por $${normalizedTotal.toLocaleString('es-CL')} (impuestos: $${normalizedTax.toLocaleString('es-CL')}, productos auto: ${preparedLines.length - unmatchedLines.length}/${preparedLines.length})`,
            });
          } catch (error) {
            results.push({
              ...baseResult,
              status: 'error',
              message: error instanceof Error ? error.message : 'Error procesando XML',
            });
          }
        }
      } catch (error) {
        results.push({
          fileName: file.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Error procesando XML',
        });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.status === 'created').length,
      duplicates: results.filter((r) => r.status === 'duplicate').length,
      errors: results.filter((r) => r.status === 'error').length,
    };

    if (summary.created > 0) {
      revalidatePath('/dashboard/purchases');
      revalidatePath('/dashboard/purchases/invoices');
    }

    return {
      success: true,
      summary,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno importando XML',
      summary: { total: 0, created: 0, duplicates: 0, errors: 0 },
      results: [],
    };
  }
}
