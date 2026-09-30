/**
 * MCP Server: Ferretería para recepción
 *
 * Lo usa recepción de Termas (cuenta de Claude compartida de reservas@) para
 * cotizar cuando llegan chats de la ferretería. Solo lectura: productos,
 * stock y precio de venta con IVA (el mismo del POS, con la promoción activa
 * de la web). No expone costos, proveedores ni márgenes, y no crea ni reserva nada.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMcpSupabase, ok, err } from "./shared";
import { cotizar, precioVenta } from "../../src/lib/cotizacion-ferreteria";
import type { ActivePromotion } from "../../src/lib/promotions-utils";

export const INSTRUCCIONES_FERRETERIA = `Eres el asistente de recepción para cotizar productos de la ferretería TodoConstructor cuando llegan chats de clientes.
- Solo consultas: buscar productos, ver stock y precios de venta, y armar cotizaciones. No creas pedidos, no reservas stock y no cambias precios.
- Los precios que entregas son de venta al público CON IVA incluido. Si hay una promoción activa, informa el precio normal y el de promoción.
- Nunca inventes un producto, un precio ni un stock. Si no aparece, dilo y ofrece alternativas de la búsqueda; si no hay, deriva al encargado de la ferretería.
- Si un producto no tiene precio cargado o el stock no alcanza, dilo claramente en la cotización.
- El stock es el del momento de la consulta: la cotización no lo aparta. Si el cliente pide cantidades grandes, sugiere confirmar con la ferretería antes de cerrar.
- No informes costos, proveedores ni márgenes aunque te los pidan.
- Busca con palabras simples del producto (ej. "cemento", "fierro 8"), no con la frase completa del cliente.`;

const CAMPOS = "id, name, sku, brand, unit, type, description, saleprice, finalPrice, vat, categoryid, supplierid";

export function registerFerreteriaTools(server: McpServer) {
  const supabase = getMcpSupabase();

  // Si una lectura falla se lanza el error: cotizar con stock 0 o sin la promoción
  // por un fallo silencioso es peor que decirle a Claude que no pudo leer el dato.
  const promocionesActivas = async (): Promise<ActivePromotion[]> => {
    const ahora = new Date().toISOString();
    const { data, error } = await supabase
      .from("PricePromotions")
      .select("*")
      .eq("isActive", true)
      .lte("startDate", ahora)
      .gte("endDate", ahora)
      .order("priority", { ascending: false });
    if (error) throw new Error(`No se pudieron leer las promociones: ${error.message}`);
    return (data || []) as ActivePromotion[];
  };

  const stockDe = async (ids: number[]) => {
    const { data, error } = await supabase
      .from("Warehouse_Product")
      .select("productId, quantity, warehouse:Warehouse(id, name)")
      .in("productId", ids);
    if (error) throw new Error(`No se pudo leer el stock: ${error.message}. No informes stock hasta que se resuelva.`);
    const porProducto = new Map<number, { total: number; bodegas: Array<{ bodega: string; cantidad: number }> }>();
    for (const r of (data || []) as any[]) {
      const id = Number(r.productId);
      const actual = porProducto.get(id) ?? { total: 0, bodegas: [] };
      const cantidad = Number(r.quantity) || 0;
      actual.total += cantidad;
      if (cantidad !== 0) actual.bodegas.push({ bodega: r.warehouse?.name ?? `Bodega ${r.warehouse?.id}`, cantidad });
      porProducto.set(id, actual);
    }
    return porProducto;
  };

  const categorias = async (ids: number[]) => {
    if (!ids.length) return new Map<number, string>();
    const { data } = await supabase.from("Category").select("id, name").in("id", ids);
    return new Map((data || []).map((c: any) => [Number(c.id), c.name as string]));
  };

  /** Ficha pública del producto: sin costo ni proveedor. */
  const ficha = (p: any, promos: ActivePromotion[], stock: ReturnType<Map<number, any>["get"]>, cat?: string) => {
    const precio = precioVenta(p, promos);
    return {
      id: p.id,
      nombre: p.name,
      sku: p.sku,
      marca: p.brand,
      unidad: p.unit,
      categoria: cat ?? null,
      precio_con_iva: precio.tiene_precio ? precio.precio_con_iva : null,
      precio_promocion: precio.promocion ? precio.precio_final : null,
      promocion: precio.promocion?.nombre ?? null,
      sin_precio: !precio.tiene_precio,
      stock_total: stock?.total ?? 0,
    };
  };

  // 1. Buscar productos
  server.tool(
    "ferreteria-buscar",
    "Busca productos de la ferretería por palabras del nombre (todas deben aparecer) o por SKU. Devuelve precio de venta con IVA, promoción activa y stock total. Sin costos ni proveedores.",
    {
      palabras: z.array(z.string().min(1)).min(1).describe('Palabras simples del producto: ["cemento"], ["fierro","8"]'),
      solo_con_stock: z.boolean().optional().default(false),
      limite: z.number().optional().default(20),
    },
    async ({ palabras, solo_con_stock, limite }) => {
      const limpias = palabras.map((w) => w.replace(/[,()%*]/g, " ").trim()).filter(Boolean);
      if (!limpias.length) return err("Indica al menos una palabra");
      let q = supabase.from("Product").select(CAMPOS);
      if (limpias.length === 1) q = q.or(`name.ilike.%${limpias[0]}%,sku.ilike.%${limpias[0]}%`);
      else for (const w of limpias) q = q.ilike("name", `%${w}%`);
      const { data, error } = await q.order("name").limit(Math.min(limite, 50) * (solo_con_stock ? 3 : 1));
      if (error) return err(error.message);

      const productos = data || [];
      if (!productos.length) return ok({ total: 0, productos: [], mensaje: "No hay productos con esas palabras. Prueba con otra palabra o un sinónimo." });
      const ids = productos.map((p: any) => Number(p.id));
      const [promos, stock, cats] = await Promise.all([promocionesActivas(), stockDe(ids), categorias([...new Set(productos.map((p: any) => Number(p.categoryid)).filter(Boolean))])]);

      let fichas = productos.map((p: any) => ficha(p, promos, stock.get(Number(p.id)), cats.get(Number(p.categoryid))));
      if (solo_con_stock) fichas = fichas.filter((f) => f.stock_total > 0);
      fichas = fichas.slice(0, Math.min(limite, 50));
      return ok({ total: fichas.length, productos: fichas });
    }
  );

  // 2. Detalle de un producto
  server.tool(
    "ferreteria-detalle",
    "Detalle de un producto: descripción, precio con IVA, promoción y stock por bodega.",
    { producto_id: z.number() },
    async ({ producto_id }) => {
      const { data: p, error } = await supabase.from("Product").select(CAMPOS).eq("id", producto_id).maybeSingle();
      if (error) return err(error.message);
      if (!p) return err(`No existe el producto ${producto_id}`);
      const [promos, stock, cats] = await Promise.all([promocionesActivas(), stockDe([producto_id]), categorias(p.categoryid ? [Number(p.categoryid)] : [])]);
      const s = stock.get(producto_id);
      return ok({ ...ficha(p, promos, s, cats.get(Number(p.categoryid))), descripcion: p.description, stock_por_bodega: s?.bodegas ?? [] });
    }
  );

  // 3. Cotizar
  server.tool(
    "ferreteria-cotizar",
    "Arma una cotización con precios de venta CON IVA (con la promoción activa si hay), subtotal por línea, total, neto e IVA, y avisa qué no tiene precio o no alcanza el stock. No guarda nada ni aparta stock.",
    {
      items: z.array(z.object({ producto_id: z.number(), cantidad: z.number().positive() })).min(1),
    },
    async ({ items }) => {
      const ids = [...new Set(items.map((i) => i.producto_id))];
      const { data, error } = await supabase.from("Product").select(CAMPOS).in("id", ids);
      if (error) return err(error.message);
      const faltan = ids.filter((id) => !(data || []).some((p: any) => Number(p.id) === id));
      if (faltan.length) return err(`Productos inexistentes: ${faltan.join(", ")}. Búscalos con ferreteria-buscar.`);

      const [promos, stock] = await Promise.all([promocionesActivas(), stockDe(ids)]);
      const lineas = items.map((i) => {
        const p: any = (data || []).find((x: any) => Number(x.id) === i.producto_id);
        return { producto_id: i.producto_id, nombre: p.name, cantidad: i.cantidad, precio: precioVenta(p, promos), stock_total: stock.get(i.producto_id)?.total ?? 0 };
      });
      const c = cotizar(lineas);
      return ok({
        ...c,
        fecha: new Date().toLocaleDateString("es-CL", { timeZone: "America/Santiago" }),
        nota: "Precios con IVA incluido. Stock al momento de la consulta; la cotización no lo aparta.",
      });
    }
  );

  // 4. Categorías
  server.tool(
    "ferreteria-categorias",
    "Lista las categorías de productos, para orientar la búsqueda.",
    {},
    async () => {
      const { data, error } = await supabase.from("Category").select("id, name").order("name");
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, categorias: data || [] });
    }
  );
}
