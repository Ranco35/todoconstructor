export interface GroupBudgetData {
  budgetNumber: string;
  date: string;
  validUntil: string;
  totalGuests: number;
  totalTrips: number;
  guestsPerTrip: number;
  clientName: string;
  services: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    icon: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

export function generateGroupBudgetHTML(data: GroupBudgetData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presupuesto Grupal - Hotel Spa Termas LLifén</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+Pro:wght@300;400;600&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Source Sans Pro', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .logo {
            font-family: 'Playfair Display', serif;
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 2;
        }
        
        .tagline {
            font-size: 1.2em;
            font-weight: 300;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }
        
        .location {
            font-size: 0.9em;
            opacity: 0.9;
            position: relative;
            z-index: 2;
        }
        
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .hero-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.2em;
            margin-bottom: 15px;
        }
        
        .hero-subtitle {
            font-size: 1.1em;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .presupuesto-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
            padding: 25px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 10px;
            border-left: 5px solid #667eea;
        }
        
        .info-item {
            text-align: center;
        }
        
        .info-label {
            font-weight: 600;
            color: #667eea;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 1.1em;
            color: #333;
        }
        
        .programa-destacado {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 40px;
            text-align: center;
        }
        
        .programa-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.8em;
            margin-bottom: 15px;
        }
        
        .programa-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .programa-stat {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .experiencia-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.8em;
            color: #667eea;
            margin-bottom: 20px;
            text-align: center;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .experiencia-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .experiencia-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border: 1px solid #e9ecef;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .experiencia-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        
        .experiencia-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
            display: block;
            text-align: center;
        }
        
        .experiencia-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.3em;
            color: #333;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .experiencia-desc {
            color: #666;
            font-size: 0.95em;
            text-align: center;
            line-height: 1.5;
        }
        
        .servicios-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            margin-bottom: 30px;
        }
        
        .table-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .table-header h3 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5em;
            margin-bottom: 5px;
        }
        
        .table-subheader {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .servicio-item {
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
            display: grid;
            grid-template-columns: 1fr auto auto auto;
            gap: 20px;
            align-items: center;
        }
        
        .servicio-item:last-child {
            border-bottom: none;
        }
        
        .servicio-item:nth-child(even) {
            background: #f8f9fa;
        }
        
        .servicio-nombre {
            font-weight: 600;
            color: #333;
        }
        
        .servicio-detalle {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
            line-height: 1.4;
        }
        
        .servicio-cantidad {
            text-align: center;
            font-weight: 600;
            color: #667eea;
        }
        
        .servicio-precio {
            text-align: right;
            font-weight: 600;
            color: #333;
        }
        
        .servicio-total {
            text-align: right;
            font-weight: 700;
            color: #28a745;
            font-size: 1.1em;
        }
        
        .totales {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
        }
        
        .total-row:last-child {
            border-bottom: none;
            font-size: 1.3em;
            font-weight: 700;
            color: #667eea;
            padding-top: 15px;
            border-top: 2px solid #667eea;
        }
        
        .condiciones {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            border-left: 5px solid #ffc107;
        }
        
        .condiciones h4 {
            color: #333;
            margin-bottom: 15px;
            font-family: 'Playfair Display', serif;
        }
        
        .condiciones ul {
            list-style: none;
            padding: 0;
        }
        
        .condiciones li {
            padding: 8px 0;
            position: relative;
            padding-left: 25px;
        }
        
        .condiciones li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #28a745;
            font-weight: bold;
        }
        
        .footer {
            background: #333;
            color: white;
            padding: 20px 30px;
            text-align: center;
        }
        
        .contacto {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .contacto-item {
            text-align: center;
        }
        
        .contacto-icon {
            font-size: 1.5em;
            margin-bottom: 5px;
            display: block;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            
            .servicio-item {
                grid-template-columns: 1fr;
                gap: 10px;
                text-align: center;
            }
            
            .experiencia-grid {
                grid-template-columns: 1fr;
            }
            
            .programa-details {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .presupuesto-info {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hotel Spa Termas LLifén</div>
            <div class="tagline">Encuentra el descanso que estabas buscando</div>
            <div class="location">LLifén s/n, Futrono, Chile</div>
        </div>
        
        <div class="hero-section">
            <h2 class="hero-title">Una Experiencia de Bienestar Única</h2>
            <p class="hero-subtitle">Sumérgete en un oasis de tranquilidad donde las aguas termales naturales, la gastronomía local y los paisajes de la Región de Los Ríos se combinan para renovar tu cuerpo y alma.</p>
        </div>
        
        <div class="content">
            <div class="presupuesto-info">
                <div class="info-item">
                    <div class="info-label">Presupuesto N°</div>
                    <div class="info-value">${data.budgetNumber}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha</div>
                    <div class="info-value">${data.date}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Válido hasta</div>
                    <div class="info-value">${data.validUntil}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Huéspedes</div>
                    <div class="info-value">${data.totalGuests} Personas</div>
                </div>
            </div>
            
            <div class="programa-destacado">
                <h2 class="programa-title">Programa Especial de Bienestar</h2>
                <p>Experiencias diseñadas especialmente para grupos en Hotel Spa Termas LLifén</p>
                <div class="programa-details">
                    <div class="programa-stat">
                        <div class="stat-number">${data.totalTrips}</div>
                        <div class="stat-label">Viajes Programados</div>
                    </div>
                    <div class="programa-stat">
                        <div class="stat-number">${data.guestsPerTrip}</div>
                        <div class="stat-label">Personas por Viaje</div>
                    </div>
                    <div class="programa-stat">
                        <div class="stat-number">${data.totalGuests}</div>
                        <div class="stat-label">Total de Huéspedes</div>
                    </div>
                    <div class="programa-stat">
                        <div class="stat-number">1</div>
                        <div class="stat-label">Día Completo</div>
                    </div>
                </div>
            </div>
            
            <div class="experiencia-section">
                <h2 class="section-title">Tu Experiencia de Bienestar</h2>
                <div class="experiencia-grid">
                    <div class="experiencia-card">
                        <span class="experiencia-icon">♨️</span>
                        <h3 class="experiencia-title">Aguas Termales</h3>
                        <p class="experiencia-desc">Relájate en nuestras 3 piscinas termales techadas con aguas minerales naturales que renuevan tu energía</p>
                    </div>
                    <div class="experiencia-card">
                        <span class="experiencia-icon">🍽️</span>
                        <h3 class="experiencia-title">Gastronomía Local</h3>
                        <p class="experiencia-desc">Sabores auténticos de la región en cada comida, preparados con ingredientes frescos y locales</p>
                    </div>
                    <div class="experiencia-card">
                        <span class="experiencia-icon">🧘‍♀️</span>
                        <h3 class="experiencia-title">Sonoterapia</h3>
                        <p class="experiencia-desc">Experimenta la sanación a través del sonido con cuencos tibetanos en un entorno natural único</p>
                    </div>
                    <div class="experiencia-card">
                        <span class="experiencia-icon">🌿</span>
                        <h3 class="experiencia-title">Conexión Natural</h3>
                        <p class="experiencia-desc">Desconéctate del mundo y reconéctate contigo mismo en medio de la naturaleza patagónica</p>
                    </div>
                </div>
            </div>
            
            <div class="servicios-table">
                <div class="table-header">
                    <h3>Programa de Bienestar - Día Completo</h3>
                    <div class="table-subheader">${data.totalTrips} Viajes × ${data.guestsPerTrip} Personas c/u = ${data.totalGuests} Huéspedes Total</div>
                </div>
                
                ${data.services.map(service => `
                <div class="servicio-item">
                    <div>
                        <div class="servicio-nombre">${service.icon} ${service.name}</div>
                        <div class="servicio-detalle">${service.description}</div>
                    </div>
                    <div class="servicio-cantidad">${service.quantity.toLocaleString('es-CL')} ${service.quantity > 1 ? 'personas' : 'persona'}</div>
                    <div class="servicio-precio">$${service.unitPrice.toLocaleString('es-CL')} c/u</div>
                    <div class="servicio-total">$${service.total.toLocaleString('es-CL')}</div>
                </div>
                `).join('')}
            </div>
            
            <div class="totales">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>$${data.subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div class="total-row">
                    <span>IVA (19%)</span>
                    <span>$${data.tax.toLocaleString('es-CL')}</span>
                </div>
                <div class="total-row">
                    <span>TOTAL</span>
                    <span>$${data.total.toLocaleString('es-CL')}</span>
                </div>
            </div>
            
            <div class="condiciones">
                <h4>🔄 Condiciones de Reserva y Flexibilidad</h4>
                <ul>
                    <li>Las reservas se confirman con el 50% del total del programa</li>
                    <li>Cancelación gratuita hasta 5 días antes del check-in</li>
                    <li>Posibles ajustes por cambio de temporada</li>
                    <li>Horarios: Ingreso 14:00 hrs - Salida 11:00 hrs</li>
                    <li>Todos los cambios sujetos a disponibilidad del hotel</li>
                    <li>Programa especialmente diseñado para grupos</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <div class="contacto">
                <div class="contacto-item">
                    <span class="contacto-icon">📧</span>
                    <div>reservas@termasllifen.cl</div>
                </div>
                <div class="contacto-item">
                    <span class="contacto-icon">📱</span>
                    <div>Instagram: @hotelspatermasllifen</div>
                </div>
                <div class="contacto-item">
                    <span class="contacto-icon">📍</span>
                    <div>LLifén s/n, Futrono, Chile</div>
                </div>
            </div>
            <p style="margin-top: 15px; opacity: 0.8;">✨ Donde la naturaleza se encuentra con el bienestar ✨</p>
        </div>
    </div>
</body>
</html>`;
} 