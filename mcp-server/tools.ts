/**
 * MCP Server para TodoConstructor - Módulo principal
 *
 * Orquesta MCPs especializados por dominio.
 * Se puede crear un server completo o uno individual por módulo.
 *
 * MCPs disponibles:
 *  - inventario (20 tools) - Productos, proveedores, stock, compras, ajustes
 *  - ventas (10 tools) - POS, facturas, sesiones de caja, estadísticas
 *  - ferreteria (4 tools) - Solo lectura para que recepción de Termas cotice: precio de venta con IVA,
 *                           promoción activa y stock. Sin costos ni proveedores. Key MCP_API_KEY_FERRETERIA.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpSupabase, registerStaticResources } from "./servers/shared";
import { registerInventarioTools } from "./servers/inventario";
import { registerVentasTools } from "./servers/ventas";
import { registerFerreteriaTools, INSTRUCCIONES_FERRETERIA } from "./servers/ferreteria";

export { getMcpSupabase };

export type McpModule = "inventario" | "ventas" | "ferreteria";

const MODULE_REGISTRY: Record<McpModule, (server: McpServer) => void> = {
  inventario: registerInventarioTools,
  ventas: registerVentasTools,
  ferreteria: registerFerreteriaTools,
};

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "todoconstructor",
    version: "1.1.0",
  });

  for (const register of Object.values(MODULE_REGISTRY)) {
    register(server);
  }

  registerStaticResources(server);
  return server;
}

export function createModuleMcpServer(module: McpModule): McpServer {
  const server = new McpServer(
    { name: `todoconstructor-${module}`, version: "1.1.0" },
    // La ferretería la usa recepción: recibe al conectarse las reglas para cotizar.
    module === "ferreteria" ? { instructions: INSTRUCCIONES_FERRETERIA } : undefined,
  );

  const register = MODULE_REGISTRY[module];
  if (!register) {
    throw new Error(`Módulo MCP desconocido: ${module}`);
  }

  register(server);
  registerStaticResources(server);
  return server;
}

export const MCP_MODULES: Record<McpModule, { name: string; description: string }> = {
  inventario: {
    name: "Inventario & Compras",
    description: "Productos, categorías, proveedores, stock, órdenes de compra, ajustes de inventario",
  },
  ventas: {
    name: "Ventas & POS",
    description: "Ventas POS del día, estadísticas, facturas, sesiones de caja, productos más vendidos",
  },
  ferreteria: {
    name: "Ferretería (recepción)",
    description: "Solo lectura para cotizar por chat: buscar productos, precio de venta con IVA y promoción, stock por bodega y cotización. Sin costos ni proveedores",
  },
};
