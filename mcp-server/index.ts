#!/usr/bin/env node
/**
 * MCP Server TodoConstructor - Modo stdio
 *
 * Uso:
 *   npx tsx mcp-server/index.ts              # Server completo
 *   npx tsx mcp-server/index.ts inventario   # Solo módulo inventario
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer, createModuleMcpServer, MCP_MODULES, McpModule } from "./tools";

async function main() {
  const moduleArg = process.argv[2] as McpModule | undefined;

  let server;
  if (moduleArg) {
    if (!(moduleArg in MCP_MODULES)) {
      console.error(`Módulo desconocido: '${moduleArg}'`);
      console.error(`Módulos disponibles: ${Object.keys(MCP_MODULES).join(", ")}`);
      process.exit(1);
    }
    server = createModuleMcpServer(moduleArg);
    console.error(`TodoConstructor MCP server (${moduleArg}) running on stdio`);
  } else {
    server = createMcpServer();
    console.error("TodoConstructor MCP server (completo) running on stdio");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
