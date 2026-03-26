/**
 * Módulo compartido para MCP servers de TodoConstructor.
 * Provee: cliente Supabase, helpers de respuesta, caché TTL.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ---------------------------------------------------------------------------
// Supabase singleton
// ---------------------------------------------------------------------------
const globalForSupabase = globalThis as unknown as {
  mcpSupabase: SupabaseClient | undefined;
};

export function getMcpSupabase(): SupabaseClient {
  if (globalForSupabase.mcpSupabase) return globalForSupabase.mcpSupabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (process.env.NODE_ENV !== "production") {
    globalForSupabase.mcpSupabase = client;
  }

  return client;
}

// ---------------------------------------------------------------------------
// Helpers de respuesta MCP
// ---------------------------------------------------------------------------
export function ok(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data) },
    ],
  };
}

export function err(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
  };
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function parseDate(input?: string): string {
  if (!input) return today();
  const lower = input.trim().toLowerCase();
  const now = new Date();

  switch (lower) {
    case "hoy":
      return today();
    case "ayer": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split("T")[0];
    }
    default:
      return input;
  }
}

export function parseDateRange(input?: string): { desde: string; hasta: string } {
  if (!input) {
    const t = today();
    return { desde: t, hasta: t };
  }
  const lower = input.trim().toLowerCase();
  const now = new Date();

  switch (lower) {
    case "hoy": {
      const t = today();
      return { desde: t, hasta: t };
    }
    case "ayer": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const s = d.toISOString().split("T")[0];
      return { desde: s, hasta: s };
    }
    case "esta_semana": {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { desde: monday.toISOString().split("T")[0], hasta: sunday.toISOString().split("T")[0] };
    }
    case "semana_pasada": {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { desde: monday.toISOString().split("T")[0], hasta: sunday.toISOString().split("T")[0] };
    }
    case "este_mes": {
      const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      return { desde, hasta };
    }
    case "ultimo_mes":
    case "mes_pasado": {
      const desde = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const hasta = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      return { desde, hasta };
    }
    default:
      return { desde: input, hasta: input };
  }
}

// ---------------------------------------------------------------------------
// Caché TTL simple en memoria
// ---------------------------------------------------------------------------
const cache = new Map<string, { data: unknown; expires: number }>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) {
    return Promise.resolve(entry.data as T);
  }
  return fn().then((result) => {
    cache.set(key, { data: result, expires: Date.now() + ttlMs });
    return result;
  });
}

// ---------------------------------------------------------------------------
// MCP Resources estáticos (se cachean 30 min)
// ---------------------------------------------------------------------------
export function registerStaticResources(server: McpServer) {
  const supabase = getMcpSupabase();
  const TTL = 30 * 60 * 1000;

  server.resource(
    "categorias-productos",
    "todoconstructor://categorias-productos",
    { description: "Categorías de productos del inventario" },
    async () => {
      const data = await cached("res:categorias", TTL, async () => {
        const { data } = await supabase.from("Category").select("id, name, description, parentId").order("name");
        return data || [];
      });
      return { contents: [{ uri: "todoconstructor://categorias-productos", text: JSON.stringify(data), mimeType: "application/json" }] };
    }
  );

  server.resource(
    "bodegas",
    "todoconstructor://bodegas",
    { description: "Bodegas/almacenes del sistema" },
    async () => {
      const data = await cached("res:bodegas", TTL, async () => {
        const { data } = await supabase.from("Warehouse").select("id, name, description, location, type, isActive").order("name");
        return data || [];
      });
      return { contents: [{ uri: "todoconstructor://bodegas", text: JSON.stringify(data), mimeType: "application/json" }] };
    }
  );

  server.resource(
    "unidades-medida",
    "todoconstructor://unidades-medida",
    { description: "Unidades de medida (kg, L, pcs, etc.)" },
    async () => {
      const data = await cached("res:unidades", TTL, async () => {
        const { data } = await supabase.from("UnitMeasure").select("id, name, abbreviation, category, unitType, isActive").order("name");
        return data || [];
      });
      return { contents: [{ uri: "todoconstructor://unidades-medida", text: JSON.stringify(data), mimeType: "application/json" }] };
    }
  );
}
