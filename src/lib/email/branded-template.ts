/**
 * Genera el HTML de un email con branding completo de TodoConstructor.
 * Incluye: header, contenido, firma y footer con datos de contacto.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://todoconstructor.cl';

const BRAND_COLORS = {
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  accent: '#f59e0b',
  bg: '#f3f4f6',
  cardBg: '#ffffff',
  text: '#374151',
  textLight: '#6b7280',
  footerBg: '#1e293b',
  footerText: '#d1d5db',
  border: '#e5e7eb',
};

export interface BrandedEmailOptions {
  clientName: string;
  bodyHtml: string;
  department?: string;
}

/**
 * Construye un email HTML completo con branding de TodoConstructor.
 */
export function buildBrandedEmailHtml(options: BrandedEmailOptions): string {
  const { clientName, bodyHtml, department = 'Departamento de Ventas' } = options;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TodoConstructor</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_COLORS.bg};font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND_COLORS.bg};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <!-- Container 600px -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLORS.footerBg} 0%,${BRAND_COLORS.primary} 100%);padding:28px 32px;border-radius:16px 16px 0 0;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">TodoConstructor</h1>
              <p style="margin:6px 0 0;color:${BRAND_COLORS.accent};font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Materiales & Construcción</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:${BRAND_COLORS.cardBg};padding:32px 36px;">
              <!-- Saludo -->
              <p style="font-size:16px;color:${BRAND_COLORS.primary};margin:0 0 20px;font-weight:600;">
                Estimado/a ${clientName},
              </p>

              <!-- Contenido principal -->
              <div style="font-size:14px;color:${BRAND_COLORS.text};line-height:1.7;">
                ${bodyHtml}
              </div>

              <!-- Firma -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;border-top:1px solid ${BRAND_COLORS.border};padding-top:20px;">
                <tr>
                  <td style="border-left:3px solid ${BRAND_COLORS.accent};padding-left:16px;">
                    <p style="margin:0;font-size:14px;color:${BRAND_COLORS.text};">Saludos cordiales,</p>
                    <p style="margin:4px 0 0;font-size:15px;color:${BRAND_COLORS.primary};font-weight:700;">Equipo de Ventas</p>
                    <p style="margin:2px 0 0;font-size:13px;color:${BRAND_COLORS.textLight};">TodoConstructor</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${BRAND_COLORS.textLight};">${department}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:${BRAND_COLORS.footerBg};padding:24px 36px;border-radius:0 0 16px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="text-align:center;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.15);">
                    <p style="margin:0 0 8px;font-size:13px;color:${BRAND_COLORS.accent};font-weight:600;letter-spacing:1px;text-transform:uppercase;">Contáctanos</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td style="padding:4px 12px;">
                          <a href="mailto:ventas@todoconstructor.cl" style="color:${BRAND_COLORS.footerText};font-size:13px;text-decoration:none;">ventas@todoconstructor.cl</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:14px;">
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">
                      TodoConstructor · Materiales de Construcción y Ferretería
                    </p>
                    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.35);">
                      © ${new Date().getFullYear()} TodoConstructor. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Convierte texto plano con saltos de línea a HTML con párrafos.
 */
export function textToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map(paragraph => {
      const inner = paragraph.replace(/\n/g, '<br>');
      return `<p style="margin:0 0 14px;">${inner}</p>`;
    })
    .join('');
}

/**
 * Genera versión texto plano del email con firma.
 */
export function buildBrandedEmailText(clientName: string, body: string): string {
  return `Estimado/a ${clientName},

${body}

Saludos cordiales,
Equipo de Ventas
TodoConstructor
Departamento de Ventas

---
ventas@todoconstructor.cl
TodoConstructor · Materiales de Construcción y Ferretería`;
}
