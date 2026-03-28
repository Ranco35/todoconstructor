/**
 * MCP HTTP Endpoint principal — TodoConstructor
 *
 * Expone TODOS los módulos MCP en un solo endpoint.
 * URL: /api/mcp?key=YOUR_KEY
 *
 * Módulos: inventario (20 tools), ventas (10 tools)
 */

import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer, MCP_MODULES } from "../../../../mcp-server/tools";

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

function authenticateRequest(request: NextRequest): boolean {
  const globalKey = process.env.MCP_API_KEY;
  if (!globalKey) return true;

  const keyParam = new URL(request.url).searchParams.get("key");
  if (keyParam && keyParam === globalKey) return true;

  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey && xApiKey === globalKey) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token === globalKey) return true;
  }

  return false;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json(
    {
      status: "ok",
      name: "todoconstructor",
      version: "1.1.0",
      modules: MCP_MODULES,
      endpoints: Object.keys(MCP_MODULES).map(
        (m) => `/api/mcp/${m}`
      ),
    },
    { headers: getCorsHeaders(origin) }
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const server = createMcpServer();
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
    console.error("[MCP] Error:", error);
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
