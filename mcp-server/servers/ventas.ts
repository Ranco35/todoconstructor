/**
 * MCP Server: Ventas & POS — TodoConstructor
 *
 * Ventas del POS, sesiones de caja, facturas, estadísticas,
 * reportes por producto y por período.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMcpSupabase, ok, err, parseDate, parseDateRange } from "./shared";

export function registerVentasTools(server: McpServer) {
  const supabase = getMcpSupabase();

  // 1. Ventas del día (POS)
  server.tool(
    "ventas-del_dia",
    "Resumen de ventas POS del día: total vendido, cantidad de ventas, detalle por venta.",
    {
      fecha: z.string().optional().describe("Fecha (YYYY-MM-DD) o 'hoy', 'ayer'. Por defecto: hoy"),
    },
    async ({ fecha }) => {
      const dia = parseDate(fecha);
      const desde = `${dia}T00:00:00`;
      const hasta = `${dia}T23:59:59`;

      const { data: ventas, error } = await supabase
        .from("POSSale")
        .select(`
          id, saleNumber, customerName, subtotal, discountAmount, total,
          paymentMethod, status, saleType, createdAt, paidAmount, pendingAmount, paymentStatus,
          items:POSSaleItem(id, productName, quantity, unitPrice, total)
        `)
        .gte("createdAt", desde)
        .lte("createdAt", hasta)
        .order("createdAt", { ascending: false });

      if (error) return err(error.message);

      const completadas = (ventas || []).filter((v: any) => v.status !== "cancelled");
      const totalVentas = completadas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);
      const totalDescuentos = completadas.reduce((sum: number, v: any) => sum + Number(v.discountAmount || 0), 0);

      return ok({
        fecha: dia,
        resumen: {
          total_ventas: completadas.length,
          monto_total: totalVentas,
          total_descuentos: totalDescuentos,
          ventas_canceladas: (ventas || []).filter((v: any) => v.status === "cancelled").length,
        },
        ventas: ventas || [],
      });
    }
  );

  // 2. Resumen de ventas por período
  server.tool(
    "ventas-resumen_periodo",
    "Resumen de ventas por período: hoy, ayer, esta_semana, este_mes, mes_pasado, o rango de fechas.",
    {
      periodo: z.string().optional().describe("'hoy', 'ayer', 'esta_semana', 'este_mes', 'mes_pasado' o fecha YYYY-MM-DD"),
      fecha_desde: z.string().optional().describe("Fecha inicio (YYYY-MM-DD) para rango personalizado"),
      fecha_hasta: z.string().optional().describe("Fecha fin (YYYY-MM-DD) para rango personalizado"),
    },
    async ({ periodo, fecha_desde, fecha_hasta }) => {
      let desde: string, hasta: string;
      if (fecha_desde && fecha_hasta) {
        desde = fecha_desde;
        hasta = fecha_hasta;
      } else {
        const rango = parseDateRange(periodo || "hoy");
        desde = rango.desde;
        hasta = rango.hasta;
      }

      const { data: ventas, error } = await supabase
        .from("POSSale")
        .select("id, total, discountAmount, paymentMethod, status, saleType, createdAt")
        .gte("createdAt", `${desde}T00:00:00`)
        .lte("createdAt", `${hasta}T23:59:59`)
        .neq("status", "cancelled");

      if (error) return err(error.message);

      const totalMonto = (ventas || []).reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);
      const totalDescuentos = (ventas || []).reduce((sum: number, v: any) => sum + Number(v.discountAmount || 0), 0);

      // Agrupar por método de pago
      const porMetodoPago: Record<string, { cantidad: number; monto: number }> = {};
      for (const v of ventas || []) {
        const metodo = v.paymentMethod || "sin_especificar";
        if (!porMetodoPago[metodo]) porMetodoPago[metodo] = { cantidad: 0, monto: 0 };
        porMetodoPago[metodo].cantidad++;
        porMetodoPago[metodo].monto += Number(v.total || 0);
      }

      // Agrupar por día
      const porDia: Record<string, { cantidad: number; monto: number }> = {};
      for (const v of ventas || []) {
        const dia = (v.createdAt || "").split("T")[0];
        if (!porDia[dia]) porDia[dia] = { cantidad: 0, monto: 0 };
        porDia[dia].cantidad++;
        porDia[dia].monto += Number(v.total || 0);
      }

      return ok({
        periodo: { desde, hasta },
        resumen: {
          total_ventas: (ventas || []).length,
          monto_total: totalMonto,
          total_descuentos: totalDescuentos,
          promedio_por_venta: (ventas || []).length > 0 ? Math.round(totalMonto / (ventas || []).length) : 0,
        },
        por_metodo_pago: porMetodoPago,
        por_dia: porDia,
      });
    }
  );

  // 3. Productos más vendidos
  server.tool(
    "ventas-productos_mas_vendidos",
    "Ranking de productos más vendidos en un período.",
    {
      periodo: z.string().optional().describe("'hoy', 'esta_semana', 'este_mes', 'mes_pasado'"),
      fecha_desde: z.string().optional(),
      fecha_hasta: z.string().optional(),
      limite: z.number().optional().default(20),
    },
    async ({ periodo, fecha_desde, fecha_hasta, limite }) => {
      let desde: string, hasta: string;
      if (fecha_desde && fecha_hasta) {
        desde = fecha_desde;
        hasta = fecha_hasta;
      } else {
        const rango = parseDateRange(periodo || "este_mes");
        desde = rango.desde;
        hasta = rango.hasta;
      }

      // Obtener ventas no canceladas del período
      const { data: ventas, error: ventasError } = await supabase
        .from("POSSale")
        .select("id")
        .gte("createdAt", `${desde}T00:00:00`)
        .lte("createdAt", `${hasta}T23:59:59`)
        .neq("status", "cancelled");

      if (ventasError) return err(ventasError.message);

      const saleIds = (ventas || []).map((v: any) => v.id);
      if (saleIds.length === 0) return ok({ periodo: { desde, hasta }, productos: [] });

      const { data: items, error } = await supabase
        .from("POSSaleItem")
        .select("productId, productName, quantity, total")
        .in("saleId", saleIds);

      if (error) return err(error.message);

      // Agrupar por producto
      const productos: Record<number, { nombre: string; cantidad: number; monto: number }> = {};
      for (const item of items || []) {
        const pid = item.productId || 0;
        if (!productos[pid]) productos[pid] = { nombre: item.productName || "", cantidad: 0, monto: 0 };
        productos[pid].cantidad += Number(item.quantity || 0);
        productos[pid].monto += Number(item.total || 0);
      }

      const ranking = Object.entries(productos)
        .map(([id, data]) => ({ producto_id: Number(id), ...data }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, limite);

      return ok({ periodo: { desde, hasta }, total_productos_vendidos: ranking.length, productos: ranking });
    }
  );

  // 4. Detalle de una venta
  server.tool(
    "ventas-detalle",
    "Detalle completo de una venta POS: items, pagos, ajustes.",
    { id: z.number().describe("ID de la venta") },
    async ({ id }) => {
      const { data: venta, error } = await supabase
        .from("POSSale")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return err(error.message);

      const [items, pagos, ajustes] = await Promise.all([
        supabase.from("POSSaleItem").select("*").eq("saleId", id),
        supabase.from("POSSalePayment").select("*").eq("saleId", id),
        supabase.from("POSSaleAdjustment").select("*").eq("saleId", id),
      ]);

      return ok({
        venta,
        items: items.data || [],
        pagos: pagos.data || [],
        ajustes: ajustes.data || [],
      });
    }
  );

  // 5. Sesiones de caja
  server.tool(
    "ventas-sesiones_caja",
    "Consultar sesiones de caja abiertas y cerradas.",
    {
      estado: z.enum(["open", "closed", "all"]).optional().default("all"),
      limite: z.number().optional().default(10),
    },
    async ({ estado, limite }) => {
      let query = supabase
        .from("CashSession")
        .select("id, sessionNumber, openingAmount, currentAmount, closingAmount, expectedAmount, difference, status, isActive, openedAt, closedAt, notes")
        .order("openedAt", { ascending: false })
        .limit(limite);

      if (estado === "open") query = query.eq("status", "open");
      if (estado === "closed") query = query.eq("status", "closed");

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, sesiones: data || [] });
    }
  );

  // 6. Facturas (ventas formales)
  server.tool(
    "ventas-facturas",
    "Consultar facturas de venta emitidas.",
    {
      estado: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      fecha_desde: z.string().optional(),
      fecha_hasta: z.string().optional(),
      limite: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    },
    async ({ estado, fecha_desde, fecha_hasta, limite, offset }) => {
      let query = supabase
        .from("invoices")
        .select(`
          id, number, status, total, currency, due_date, notes, created_at,
          client:client_id(id, name)
        `)
        .order("created_at", { ascending: false })
        .range(offset, offset + limite - 1);

      if (estado) query = query.eq("status", estado);
      if (fecha_desde) query = query.gte("created_at", `${fecha_desde}T00:00:00`);
      if (fecha_hasta) query = query.lte("created_at", `${fecha_hasta}T23:59:59`);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, facturas: data || [] });
    }
  );

  // 7. Detalle factura
  server.tool(
    "ventas-detalle_factura",
    "Detalle completo de una factura: líneas y pagos.",
    { id: z.number().describe("ID de la factura") },
    async ({ id }) => {
      const { data: factura, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return err(error.message);

      const [lineas, pagos] = await Promise.all([
        supabase.from("invoice_lines").select("*").eq("invoice_id", id),
        supabase.from("invoice_payments").select("*").eq("invoice_id", id),
      ]);

      return ok({
        factura,
        lineas: lineas.data || [],
        pagos: pagos.data || [],
      });
    }
  );

  // 8. Buscar ventas
  server.tool(
    "ventas-buscar",
    "Buscar ventas POS por número de venta, cliente o producto.",
    {
      termino: z.string().describe("Término de búsqueda (número de venta, nombre cliente)"),
      limite: z.number().optional().default(20),
    },
    async ({ termino, limite }) => {
      const { data, error } = await supabase
        .from("POSSale")
        .select(`
          id, saleNumber, customerName, total, paymentMethod, status, saleType, createdAt,
          items:POSSaleItem(productName, quantity, total)
        `)
        .or(`saleNumber.ilike.%${termino}%,customerName.ilike.%${termino}%`)
        .order("createdAt", { ascending: false })
        .limit(limite);

      if (error) return err(error.message);
      return ok({ total: data?.length || 0, ventas: data || [] });
    }
  );

  // 9. Estadísticas generales
  server.tool(
    "ventas-estadisticas",
    "Estadísticas generales de ventas: hoy, esta semana, este mes, con comparativa.",
    {},
    async () => {
      const hoy = parseDate("hoy");
      const ayer = parseDate("ayer");
      const semana = parseDateRange("esta_semana");
      const mes = parseDateRange("este_mes");
      const mesPasado = parseDateRange("mes_pasado");

      const fetchTotal = async (desde: string, hasta: string) => {
        const { data } = await supabase
          .from("POSSale")
          .select("id, total")
          .gte("createdAt", `${desde}T00:00:00`)
          .lte("createdAt", `${hasta}T23:59:59`)
          .neq("status", "cancelled");
        const ventas = data || [];
        return {
          cantidad: ventas.length,
          monto: ventas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0),
        };
      };

      const [ventasHoy, ventasAyer, ventasSemana, ventasMes, ventasMesPasado] = await Promise.all([
        fetchTotal(hoy, hoy),
        fetchTotal(ayer, ayer),
        fetchTotal(semana.desde, semana.hasta),
        fetchTotal(mes.desde, mes.hasta),
        fetchTotal(mesPasado.desde, mesPasado.hasta),
      ]);

      return ok({
        hoy: ventasHoy,
        ayer: ventasAyer,
        esta_semana: ventasSemana,
        este_mes: ventasMes,
        mes_pasado: ventasMesPasado,
      });
    }
  );

  // 10. Cotizaciones / Presupuestos
  server.tool(
    "ventas-cotizaciones",
    "Consultar cotizaciones/presupuestos de venta.",
    {
      estado: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
      limite: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    },
    async ({ estado, limite, offset }) => {
      let query = supabase
        .from("sales_quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limite - 1);

      if (estado) query = query.eq("status", estado);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, cotizaciones: data || [] });
    }
  );
}
