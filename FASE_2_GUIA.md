# MELOIA — Fase 2

## Activado en la copia local

- Calendly configurado: `https://calendly.com/meloia0412/30min`.
- El botón de diagnóstico abre Calendly en una pestaña nueva.
- Calendly debe mostrar el evento de 20 minutos y Google Meet.
- El formulario prepara el mismo mensaje para correo, Gmail o WhatsApp.
- La analítica está preparada para activarse solo con consentimiento.
- Los eventos disponibles incluyen clics de CTA, WhatsApp, calendario, selección de plan y calculadora.
- La configuración pública está centralizada en `config.js`.

## Pendiente de activación externa

### Envío automático del formulario

Para dejar de usar el envío manual se necesita un endpoint HTTPS que reciba JSON y responda exactamente con `{"ok":true}`. Después se pega su URL en `formEndpoint` de `config.js`.

Ese endpoint debe:

1. Validar los campos en servidor.
2. Protegerse contra spam.
3. Enviar un correo a `meloia0412@gmail.com`.
4. Enviar o registrar el contacto en el canal autorizado.
5. Guardar consentimiento y fecha.
6. No almacenar datos sensibles innecesarios.

### CRM

La opción inicial recomendada es HubSpot gratuito. Para conectarlo hacen falta una cuenta, permisos y el método de integración elegido. No se incluyen credenciales en archivos públicos.

### Analítica

Para activarla se deben añadir el ID de Google Analytics y, si corresponde, el Pixel de Meta en `config.js`. El sitio no cargará esos proveedores sin consentimiento.

### Redes y dominio

Faltan los enlaces reales de Instagram, LinkedIn y un dominio propio. No se han inventado URLs.

### Testimonios y casos

Se añadirán únicamente cuando existan autorización, nombre o empresa aprobados y resultados verificables.

## Seguridad

No pegues contraseñas, claves privadas, tokens de CRM ni credenciales de Calendly en HTML, CSS, JavaScript o archivos públicos.
