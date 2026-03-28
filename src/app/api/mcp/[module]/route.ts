/**
 * MCP HTTP Endpoint por módulo — TodoConstructor
 *
 * Endpoint dinámico que expone un MCP server específico por módulo.
 * Ej: /api/mcp/inventario?key=YOUR_KEY, /api/mcp/ventas?key=YOUR_KEY
 *
 * Módulos disponibles: inventario, ventas
 */

import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createModuleMcpServer, MCP_MODULES, McpModule } from "../../../../../mcp-server/tools";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = [
  "https://claude.ai",
  "https://console.anthropic.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-api-key, mcp-session-id, mcp-protocol-version",
    "Access-Control-Expose-Headers": "mcp-session-id",
    "Access-Control-Allow-Credentials": "true",
  };
}

function authenticateRequest(request: NextRequest, moduleName: string): boolean {
  const moduleKey = process.env[`MCP_API_KEY_${moduleName.toUpperCase()}`];
  const globalKey = process.env.MCP_API_KEY;
  const expectedKeys = [moduleKey, globalKey].filter(Boolean) as string[];

  if (expectedKeys.length === 0) return true;

  const keyParam = new URL(request.url).searchParams.get("key");
  if (keyParam && expectedKeys.includes(keyParam)) return true;

  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey && expectedKeys.includes(xApiKey)) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (expectedKeys.includes(token)) return true;
  }

  return false;
}

function getModule(params: { module: string }): McpModule | null {
  const mod = params.module as McpModule;
  return mod in MCP_MODULES ? mod : null;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  const origin = request.headers.get("origin");
  const { module: moduleParam } = await params;
  const mod = getModule({ module: moduleParam });

  if (!mod) {
    return NextResponse.json(
      {
        error: `Módulo '${moduleParam}' no encontrado`,
        modulos_disponibles: Object.keys(MCP_MODULES),
      },
      { status: 404, headers: getCorsHeaders(origin) }
    );
  }

  const info = MCP_MODULES[mod];
  return NextResponse.json(
    {
      status: "ok",
      name: `todoconstructor-${mod}`,
      version: "1.1.0",
      module: mod,
      description: info.description,
    },
    { headers: getCorsHeaders(origin) }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const { module: moduleParam } = await params;
  const mod = getModule({ module: moduleParam });

  if (!mod) {
    return NextResponse.json(
      { error: `Módulo '${moduleParam}' no encontrado`, modulos_disponibles: Object.keys(MCP_MODULES) },
      { status: 404, headers: corsHeaders }
    );
  }

  if (!authenticateRequest(request, mod)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const server = createModuleMcpServer(mod);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    const response = await transport.handleRequest(request);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: { ...Object.fromEntries(response.headers.entries()), ...corsHeaders },
    });
  } catch (error) {
    console.error(`[MCP:${mod}] Error:`, error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: error instanceof Error ? error.message : "Internal error" },
        id: null,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { status: "ok", message: "Session terminated (stateless mode)" },
    { headers: getCorsHeaders(request.headers.get("origin")) }
  );
}
