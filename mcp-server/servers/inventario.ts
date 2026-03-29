/**
 * MCP Server: Inventario & Compras — TodoConstructor
 *
 * Productos, categorías, proveedores, bodegas, stock, movimientos,
 * órdenes de compra, facturas de compra, pagos a proveedores.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMcpSupabase, ok, err } from "./shared";

export function registerInventarioTools(server: McpServer) {
  const supabase = getMcpSupabase();

  // 1. Buscar productos
  server.tool(
    "inventario-buscar_productos",
    "Buscar productos por nombre, SKU o código de barras.",
    {
      termino: z.string().describe("Término de búsqueda (nombre, SKU, barcode)"),
      tipo: z.enum(["CONSUMIBLE", "ALMACENABLE", "SERVICIO", "COMBO", "INVENTARIO"]).optional(),
      limite: z.number().optional().default(20),
      offset: z.number().optional().default(0).describe("Registros a saltar para paginación"),
    },
    async ({ termino, tipo, limite, offset }) => {
      let query = supabase
        .from("Product")
        .select(
          `id, name, sku, type, costprice, saleprice, vat, brand, description,
           category:Category(id, name), supplier:Supplier(id, name)`
        )
        .or(`name.ilike.%${termino}%,sku.ilike.%${termino}%`)
        .range(offset, offset + limite - 1);

      if (tipo) query = query.eq("type", tipo);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, productos: data || [] });
    }
  );

  // 2. Detalle producto
  server.tool(
    "inventario-detalle_producto",
    "Información completa de un producto: stock por bodega, proveedores, componentes.",
    { id: z.number().describe("ID del producto") },
    async ({ id }) => {
      const { data: producto, error } = await supabase
        .from("Product")
        .select("*, category:Category(id, name), supplier:Supplier(id, name)")
        .eq("id", id)
        .single();

      if (error) return err(error.message);

      const { data: stock } = await supabase
        .from("Warehouse_Product")
        .select("*, warehouse:Warehouse(id, name, location)")
        .eq("productId", id);

      const { data: proveedores } = await supabase
        .from("product_suppliers")
        .select("*, supplier:Supplier(id, name, email)")
        .eq("product_id", id);

      const { data: componentes } = await supabase
        .from("product_components")
        .select("*, component:Product!component_product_id(id, name, sku)")
        .eq("combo_product_id", id);

      return ok({
        producto,
        stock_por_bodega: stock || [],
        proveedores_adicionales: proveedores || [],
        componentes: componentes || [],
      });
    }
  );

  // 3. Crear producto
  server.tool(
    "inventario-crear_producto",
    "Crear un producto nuevo en el sistema.",
    {
      name: z.string().describe("Nombre del producto"),
      sku: z.string().optional().describe("SKU (se genera automáticamente si no se provee)"),
      type: z.enum(["CONSUMIBLE", "ALMACENABLE", "SERVICIO", "INVENTARIO", "COMBO"]).default("ALMACENABLE"),
      costprice: z.number().optional().default(0),
      saleprice: z.number().optional().default(0),
      vat: z.number().optional().default(19).describe("IVA en porcentaje (19 por defecto)"),
      categoryId: z.number().optional().describe("ID de la categoría"),
      supplierid: z.number().optional().describe("ID del proveedor principal"),
      brand: z.string().optional(),
      description: z.string().optional(),
      unit: z.string().optional(),
      bodega_id: z.number().optional().describe("ID de bodega para stock inicial"),
      stock_inicial: z.number().optional().default(0).describe("Cantidad de stock inicial"),
    },
    async ({ name, sku, type, costprice, saleprice, vat, categoryId, supplierid, brand, description, unit, bodega_id, stock_inicial }) => {
      // Generar SKU si no se provee
      let finalSku = sku;
      if (!finalSku) {
        const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
        const timestamp = Date.now().toString().slice(-6);
        finalSku = `${prefix}-${timestamp}`;
      }

      // Verificar SKU único
      const { data: existing } = await supabase
        .from("Product")
        .select("id")
        .eq("sku", finalSku)
        .maybeSingle();

      if (existing) {
        finalSku = `${finalSku}-${Math.random().toString(36).slice(2, 6)}`;
      }

      // Calcular precio final con IVA
      const finalPriceWithVat = saleprice ? saleprice * (1 + (vat || 0) / 100) : 0;

      const { data: producto, error } = await supabase
        .from("Product")
        .insert({
          name,
          sku: finalSku,
          type,
          costprice: costprice || 0,
          saleprice: saleprice || 0,
          vat: vat || 19,
          finalPrice: finalPriceWithVat,
          categoryid: categoryId || null,
          supplierid: supplierid || null,
          brand: brand || null,
          description: description || null,
          unit: unit || null,
        })
        .select("id, name, sku, type, costprice, saleprice, vat")
        .single();

      if (error) return err(error.message);

      // Crear stock inicial si se especifica bodega
      if (bodega_id && producto) {
        await supabase.from("Warehouse_Product").insert({
          productId: producto.id,
          warehouseId: bodega_id,
          quantity: stock_inicial || 0,
          minStock: 0,
          maxStock: 0,
        });
      }

      return ok({ mensaje: "Producto creado exitosamente", producto });
    }
  );

  // 4. Actualizar producto
  server.tool(
    "inventario-actualizar_producto",
    "Actualizar campos de un producto existente.",
    {
      id: z.number().describe("ID del producto"),
      name: z.string().optional(),
      sku: z.string().optional(),
      type: z.enum(["CONSUMIBLE", "ALMACENABLE", "SERVICIO", "INVENTARIO", "COMBO"]).optional(),
      costprice: z.number().optional(),
      saleprice: z.number().optional(),
      vat: z.number().optional(),
      categoryId: z.number().optional(),
      supplierid: z.number().optional(),
      brand: z.string().optional(),
      description: z.string().optional(),
    },
    async ({ id, name, sku, type, costprice, saleprice, vat, categoryId, supplierid, brand, description }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (sku !== undefined) updates.sku = sku;
      if (type !== undefined) updates.type = type;
      if (costprice !== undefined) updates.costprice = costprice;
      if (saleprice !== undefined) updates.saleprice = saleprice;
      if (vat !== undefined) updates.vat = vat;
      if (categoryId !== undefined) updates.categoryid = categoryId;
      if (supplierid !== undefined) updates.supplierid = supplierid;
      if (brand !== undefined) updates.brand = brand;
      if (description !== undefined) updates.description = description;

      // Recalcular precio final si cambió precio o IVA
      if (saleprice !== undefined || vat !== undefined) {
        const { data: current } = await supabase.from("Product").select("saleprice, vat").eq("id", id).single();
        const sp = saleprice ?? current?.saleprice ?? 0;
        const v = vat ?? current?.vat ?? 19;
        updates.finalPrice = sp * (1 + v / 100);
      }

      if (Object.keys(updates).length === 0) return err("No se proporcionaron campos para actualizar");

      const { data, error } = await supabase
        .from("Product")
        .update(updates)
        .eq("id", id)
        .select("id, name, sku, type, costprice, saleprice, vat")
        .single();

      if (error) return err(error.message);
      return ok({ mensaje: "Producto actualizado", producto: data });
    }
  );

  // 5. Categorías
  server.tool(
    "inventario-categorias",
    "Listar todas las categorías de productos.",
    {},
    async () => {
      const { data, error } = await supabase.from("Category").select("id, name, description, parentId").order("name");
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, categorias: data || [] });
    }
  );

  // 6. Consultar stock
  server.tool(
    "inventario-stock",
    "Consultar stock de productos en bodegas. Filtrar por bodega, producto o solo bajo stock.",
    {
      bodega_id: z.number().optional(),
      producto_id: z.number().optional(),
      solo_bajo_stock: z.boolean().optional().default(false),
      limite: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    },
    async ({ bodega_id, producto_id, solo_bajo_stock, limite, offset }) => {
      let query = supabase
        .from("Warehouse_Product")
        .select(
          `id, quantity, "minStock", "maxStock",
           product:Product(id, name, sku, type),
           warehouse:Warehouse(id, name, location)`
        )
        .range(offset, offset + limite - 1);

      if (bodega_id) query = query.eq("warehouseId", bodega_id);
      if (producto_id) query = query.eq("productId", producto_id);

      const { data, error } = await query;
      if (error) return err(error.message);

      let resultados = data || [];
      if (solo_bajo_stock) {
        resultados = resultados.filter(
          (item: Record<string, unknown>) =>
            item.minStock != null && (item.quantity as number) < (item.minStock as number)
        );
      }

      return ok({ total: resultados.length, inventario: resultados });
    }
  );

  // 7. Bodegas
  server.tool(
    "inventario-bodegas",
    "Listar todas las bodegas/almacenes del sistema.",
    {},
    async () => {
      const { data, error } = await supabase.from("Warehouse").select("id, name, description, location, type, isActive").order("name");
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, bodegas: data || [] });
    }
  );

  // 8. Movimientos de inventario
  server.tool(
    "inventario-movimientos",
    "Consultar movimientos de inventario (entradas, salidas, transferencias, ajustes).",
    {
      producto_id: z.number().optional(),
      bodega_id: z.number().optional(),
      tipo: z.enum(["TRANSFER", "ENTRADA", "SALIDA", "AJUSTE"]).optional(),
      fecha_desde: z.string().optional(),
      fecha_hasta: z.string().optional(),
      limite: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    },
    async ({ producto_id, bodega_id, tipo, fecha_desde, fecha_hasta, limite, offset }) => {
      let query = supabase
        .from("InventoryMovement")
        .select(
          `id, "movementType", quantity, reason, notes, "movementDate", "createdAt", batch_id,
           product:Product(id, name, sku),
           fromWarehouse:Warehouse!fromWarehouseId(id, name),
           toWarehouse:Warehouse!toWarehouseId(id, name)`
        )
        .order("createdAt", { ascending: false })
        .range(offset, offset + limite - 1);

      if (producto_id) query = query.eq("productId", producto_id);
      if (bodega_id) query = query.or(`fromWarehouseId.eq.${bodega_id},toWarehouseId.eq.${bodega_id}`);
      if (tipo) query = query.eq("movementType", tipo);
      if (fecha_desde) query = query.gte("movementDate", fecha_desde);
      if (fecha_hasta) query = query.lte("movementDate", fecha_hasta);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, movimientos: data || [] });
    }
  );

  // 9. Alerta stock bajo
  server.tool(
    "inventario-alerta_stock_bajo",
    "Productos con stock por debajo del mínimo configurado en todas las bodegas.",
    {},
    async () => {
      const { data, error } = await supabase
        .from("Warehouse_Product")
        .select(
          `id, quantity, "minStock", "maxStock",
           product:Product(id, name, sku, type),
           warehouse:Warehouse(id, name)`
        );

      if (error) return err(error.message);

      const bajoStock = (data || []).filter(
        (item: Record<string, unknown>) =>
          item.minStock != null && (item.quantity as number) < (item.minStock as number)
      );

      return ok({
        total_productos_bajo_stock: bajoStock.length,
        productos: bajoStock,
      });
    }
  );

  // 10. Unidades de medida
  server.tool(
    "inventario-unidades_medida",
    "Listar unidades de medida del sistema (kg, L, pcs, etc.).",
    {},
    async () => {
      const { data, error } = await supabase.from("UnitMeasure").select("id, name, abbreviation, category, unitType, isActive, isDefault").order("name");
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, unidades: data || [] });
    }
  );

  // 11. Buscar proveedores
  server.tool(
    "inventario-buscar_proveedores",
    "Buscar proveedores por nombre, email o RUT.",
    {
      termino: z.string().describe("Término de búsqueda (nombre, email, RUT)"),
      limite: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    },
    async ({ termino, limite, offset }) => {
      const { data, error } = await supabase
        .from("Supplier")
        .select("id, name, email, phone, city, country, taxId, vat, companyType, supplierRank, active")
        .or(`name.ilike.%${termino}%,email.ilike.%${termino}%,taxId.ilike.%${termino}%,vat.ilike.%${termino}%`)
        .range(offset, offset + limite - 1);

      if (error) return err(error.message);
      return ok({ total: data?.length || 0, proveedores: data || [] });
    }
  );

  // 12. Detalle proveedor
  server.tool(
    "inventario-detalle_proveedor",
    "Información completa de un proveedor: contactos, bancos, últimas órdenes.",
    { id: z.number().describe("ID del proveedor") },
    async ({ id }) => {
      const { data: proveedor, error } = await supabase
        .from("Supplier")
        .select("id, name, email, phone, address, city, country, taxId, companyType, supplierRank, active, website, currency, vat, notes, displayName")
        .eq("id", id)
        .single();

      if (error) return err(error.message);

      const { data: ordenes } = await supabase
        .from("purchase_orders")
        .select("id, number, status, total, created_at")
        .eq("supplier_id", id)
        .order("created_at", { ascending: false })
        .limit(5);

      return ok({
        proveedor,
        ultimas_ordenes: ordenes || [],
      });
    }
  );

  // 13. Órdenes de compra
  server.tool(
    "inventario-ordenes_compra",
    "Consultar órdenes de compra a proveedores.",
    {
      estado: z.enum(["draft", "sent", "approved", "received", "cancelled"]).optional(),
      proveedor_id: z.number().optional(),
      fecha_desde: z.string().optional(),
      fecha_hasta: z.string().optional(),
      limite: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    },
    async ({ estado, proveedor_id, fecha_desde, fecha_hasta, limite, offset }) => {
      let query = supabase
        .from("purchase_orders")
        .select(
          `id, number, status, total, currency, expected_delivery_date, notes, created_at,
           supplier:Supplier(id, name)`
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limite - 1);

      if (estado) query = query.eq("status", estado);
      if (proveedor_id) query = query.eq("supplier_id", proveedor_id);
      if (fecha_desde) query = query.gte("created_at", `${fecha_desde}T00:00:00`);
      if (fecha_hasta) query = query.lte("created_at", `${fecha_hasta}T23:59:59`);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, ordenes: data || [] });
    }
  );

  // 14. Detalle orden de compra
  server.tool(
    "inventario-detalle_orden_compra",
    "Detalle completo de una orden de compra: líneas, aprobaciones.",
    { id: z.number().describe("ID de la orden") },
    async ({ id }) => {
      const { data: orden, error } = await supabase
        .from("purchase_orders")
        .select("*, supplier:Supplier(*)")
        .eq("id", id)
        .single();

      if (error) return err(error.message);

      const { data: lineas } = await supabase
        .from("purchase_order_lines")
        .select("*, product:Product(id, name, sku)")
        .eq("order_id", id);

      return ok({ orden, lineas: lineas || [] });
    }
  );

  // 15. Facturas de compra
  server.tool(
    "inventario-facturas_compra",
    "Consultar facturas de compra recibidas de proveedores.",
    {
      estado: z.enum(["draft", "approved", "paid", "disputed", "cancelled"]).optional(),
      proveedor_id: z.number().optional(),
      limite: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    },
    async ({ estado, proveedor_id, limite, offset }) => {
      let query = supabase
        .from("purchase_invoices")
        .select(
          `id, invoice_number, number, status, payment_status, total_amount, total, currency,
           invoice_date, due_date, created_at,
           supplier:Supplier(id, name)`
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limite - 1);

      if (estado) query = query.eq("status", estado);
      if (proveedor_id) query = query.eq("supplier_id", proveedor_id);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, facturas_compra: data || [] });
    }
  );

  // 16. Detalle factura de compra
  server.tool(
    "inventario-detalle_factura_compra",
    "Detalle completo de una factura de compra: líneas, pagos.",
    { id: z.number().describe("ID de la factura de compra") },
    async ({ id }) => {
      const { data: factura, error } = await supabase
        .from("purchase_invoices")
        .select("*, supplier:Supplier(*)")
        .eq("id", id)
        .single();

      if (error) return err(error.message);

      const { data: lineas } = await supabase
        .from("purchase_invoice_lines")
        .select("*, product:Product(id, name, sku)")
        .eq("purchase_invoice_id", id);

      return ok({ factura, lineas: lineas || [] });
    }
  );

  // 17. Productos de un proveedor
  server.tool(
    "inventario-productos_proveedor",
    "Consultar productos asociados a un proveedor.",
    {
      proveedor_id: z.number().describe("ID del proveedor"),
      limite: z.number().optional().default(50),
    },
    async ({ proveedor_id, limite }) => {
      const { data, error } = await supabase
        .from("product_suppliers")
        .select("*, product:Product(id, name, sku, costprice, saleprice)")
        .eq("supplier_id", proveedor_id)
        .limit(limite);

      if (error) return err(error.message);
      return ok({ total: data?.length || 0, productos: data || [] });
    }
  );

  // 18. Registrar ajuste de stock
  server.tool(
    "inventario-registrar_ajuste",
    "Registrar un ajuste de stock: entrada, salida o ajuste de inventario para un producto en una bodega.",
    {
      producto_id: z.number().describe("ID del producto"),
      bodega_id: z.number().describe("ID de la bodega"),
      tipo: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]).describe("Tipo de movimiento"),
      cantidad: z.number().describe("Cantidad a ajustar (positiva)"),
      razon: z.string().describe("Razón del ajuste"),
      notas: z.string().optional().describe("Notas adicionales"),
    },
    async ({ producto_id, bodega_id, tipo, cantidad, razon, notas }) => {
      if (cantidad <= 0) return err("La cantidad debe ser mayor a 0");

      // Verificar que el producto existe
      const { data: producto, error: prodError } = await supabase
        .from("Product")
        .select("id, name, sku")
        .eq("id", producto_id)
        .single();

      if (prodError || !producto) return err(`Producto con ID ${producto_id} no encontrado`);

      // Verificar que la bodega existe
      const { data: bodega, error: bodError } = await supabase
        .from("Warehouse")
        .select("id, name")
        .eq("id", bodega_id)
        .single();

      if (bodError || !bodega) return err(`Bodega con ID ${bodega_id} no encontrada`);

      // Obtener stock actual
      const { data: wp } = await supabase
        .from("Warehouse_Product")
        .select("id, quantity")
        .eq("productId", producto_id)
        .eq("warehouseId", bodega_id)
        .single();

      const stockAnterior = wp ? Number(wp.quantity || 0) : 0;
      let nuevoStock: number;

      if (tipo === "ENTRADA") {
        nuevoStock = stockAnterior + cantidad;
      } else if (tipo === "SALIDA") {
        nuevoStock = stockAnterior - cantidad;
        if (nuevoStock < 0) return err(`Stock insuficiente. Stock actual: ${stockAnterior}, intentando sacar: ${cantidad}`);
      } else {
        // AJUSTE: la cantidad ES el nuevo stock
        nuevoStock = cantidad;
      }

      // Actualizar o crear el registro de stock
      if (wp) {
        const { error: updateError } = await supabase
          .from("Warehouse_Product")
          .update({ quantity: nuevoStock, updatedAt: new Date().toISOString() })
          .eq("id", wp.id);

        if (updateError) return err(`Error actualizando stock: ${updateError.message}`);
      } else {
        const { error: insertError } = await supabase
          .from("Warehouse_Product")
          .insert({
            productId: producto_id,
            warehouseId: bodega_id,
            quantity: nuevoStock,
            minStock: 0,
            maxStock: 0,
          });

        if (insertError) return err(`Error creando registro de stock: ${insertError.message}`);
      }

      // Registrar el movimiento
      const movimiento: Record<string, unknown> = {
        productId: producto_id,
        movementType: tipo,
        quantity: cantidad,
        reason: razon,
        notes: notas || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (tipo === "ENTRADA" || tipo === "AJUSTE") {
        movimiento.toWarehouseId = bodega_id;
      } else {
        movimiento.fromWarehouseId = bodega_id;
      }

      const { error: movError } = await supabase
        .from("InventoryMovement")
        .insert(movimiento);

      if (movError) {
        // El stock ya se actualizó, solo falla el registro de movimiento
        return ok({
          mensaje: "Stock actualizado pero error registrando movimiento",
          advertencia: movError.message,
          producto: producto.name,
          bodega: bodega.name,
          stock_anterior: stockAnterior,
          stock_nuevo: nuevoStock,
        });
      }

      return ok({
        mensaje: "Ajuste de stock registrado exitosamente",
        producto: producto.name,
        sku: producto.sku,
        bodega: bodega.name,
        tipo,
        cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: nuevoStock,
        razon,
      });
    }
  );

  // 19. Ajuste masivo de stock
  server.tool(
    "inventario-ajuste_masivo",
    "Ajustar stock de múltiples productos a la vez en una bodega (inventario físico).",
    {
      bodega_id: z.number().describe("ID de la bodega"),
      ajustes: z.array(z.object({
        sku: z.string().describe("SKU del producto"),
        cantidad: z.number().describe("Nueva cantidad (stock real contado)"),
      })).describe("Lista de ajustes: SKU y cantidad real"),
      razon: z.string().optional().default("Ajuste de inventario físico vía MCP"),
    },
    async ({ bodega_id, ajustes, razon }) => {
      const { data: bodega } = await supabase
        .from("Warehouse")
        .select("id, name")
        .eq("id", bodega_id)
        .single();

      if (!bodega) return err(`Bodega con ID ${bodega_id} no encontrada`);

      let actualizados = 0;
      let errores = 0;
      const resultados: Array<{ sku: string; nombre: string; anterior: number; nuevo: number }> = [];
      const erroresDetalle: string[] = [];

      for (const ajuste of ajustes) {
        // Buscar producto por SKU
        const { data: producto } = await supabase
          .from("Product")
          .select("id, name")
          .eq("sku", ajuste.sku)
          .single();

        if (!producto) {
          errores++;
          erroresDetalle.push(`SKU ${ajuste.sku} no encontrado`);
          continue;
        }

        // Obtener stock actual
        const { data: wp } = await supabase
          .from("Warehouse_Product")
          .select("id, quantity")
          .eq("productId", producto.id)
          .eq("warehouseId", bodega_id)
          .single();

        const stockAnterior = wp ? Number(wp.quantity || 0) : 0;

        if (stockAnterior === ajuste.cantidad) continue; // Sin cambios

        // Actualizar stock
        if (wp) {
          await supabase
            .from("Warehouse_Product")
            .update({ quantity: ajuste.cantidad, updatedAt: new Date().toISOString() })
            .eq("id", wp.id);
        } else {
          await supabase
            .from("Warehouse_Product")
            .insert({ productId: producto.id, warehouseId: bodega_id, quantity: ajuste.cantidad, minStock: 0, maxStock: 0 });
        }

        // Registrar movimiento
        await supabase.from("InventoryMovement").insert({
          productId: producto.id,
          toWarehouseId: bodega_id,
          movementType: "AJUSTE",
          quantity: ajuste.cantidad,
          reason: razon,
          notes: `Ajuste masivo: ${stockAnterior} → ${ajuste.cantidad}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        actualizados++;
        resultados.push({
          sku: ajuste.sku,
          nombre: producto.name,
          anterior: stockAnterior,
          nuevo: ajuste.cantidad,
        });
      }

      return ok({
        mensaje: `Ajuste masivo completado: ${actualizados} actualizados, ${errores} errores`,
        bodega: bodega.name,
        actualizados,
        errores,
        errores_detalle: erroresDetalle,
        resultados,
      });
    }
  );

  // 20. Historial inventario físico
  server.tool(
    "inventario-historial_fisico",
    "Consultar historial de conteos de inventario físico.",
    {
      bodega_id: z.number().optional(),
      limite: z.number().optional().default(10),
      offset: z.number().optional().default(0),
    },
    async ({ bodega_id, limite, offset }) => {
      let query = supabase
        .from("InventoryPhysicalHistory")
        .select("id, warehouseId, userId, fecha, comentarios, totalActualizados, totalErrores, createdAt, warehouse:Warehouse(id, name)")
        .order("fecha", { ascending: false })
        .range(offset, offset + limite - 1);

      if (bodega_id) query = query.eq("warehouseId", bodega_id);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ total: data?.length || 0, historial: data || [] });
    }
  );
}
