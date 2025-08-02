# Configuración de Gmail para Envío de Correos

## 📧 Configuración de Gmail SMTP

Para habilitar el envío de correos con la cuenta `reservas@termasllifen.cl`, sigue estos pasos:

### 1. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Gmail SMTP Configuration
GMAIL_USER=reservas@termasllifen.cl
GMAIL_APP_PASSWORD=your_app_password_here
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587

# Next.js Configuration (si no existe)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Generar App Password para Gmail

1. **Accede a tu cuenta de Gmail**: `reservas@termasllifen.cl`
2. **Ve a "Gestionar tu cuenta de Google"**
3. **Selecciona "Seguridad"** en el menú lateral
4. **Activa la verificación en 2 pasos** (requerido para App Passwords)
5. **Busca "Contraseñas de aplicaciones"**
6. **Genera una nueva contraseña** para "Aplicación personalizada"
7. **Nombra la aplicación**: "Admintermas Email System"
8. **Copia la contraseña generada** (16 caracteres sin espacios)
9. **Reemplaza `your_app_password_here`** en el archivo `.env.local`

### 3. Verificar Configuración

Las variables de entorno deben estar configuradas así:

```env
GMAIL_USER=reservas@termasllifen.cl
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # Sin espacios reales
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587
```

### 4. Reiniciar el Servidor

Después de configurar las variables de entorno:

```bash
npm run dev
```

### 5. Probar la Configuración

Una vez implementado el sistema, podrás probar el envío de emails desde el dashboard.

## 🔐 Seguridad

- **Nunca commits** el archivo `.env.local` al repositorio
- **Usa App Passwords** en lugar de la contraseña principal
- **Mantén las credenciales seguras** y restringe el acceso

## 📋 Solución de Problemas

### Error: "Less secure app access"
- **Solución**: Usa App Passwords en lugar de la contraseña principal

### Error: "Authentication failed"
- **Verificar**: Que el App Password sea correcto (sin espacios)
- **Verificar**: Que la cuenta tenga 2FA activado

### Error: "Connection timeout"
- **Verificar**: Configuración de red/firewall
- **Verificar**: Puerto 587 esté disponible 