/**
 * Brand voice for every outbound email, push, in-app notice, and AI-generated campaign.
 * Santander (Bucaramanga / área metropolitana): warm, clear, respectful usted.
 */
export const SANTANDER_VOICE_GUIDE = `
Escribe SIEMPRE en español colombiano de Santander (Bucaramanga y el área metropolitana).

Trato:
- Use usted / le / su. Nunca tutee al destinatario.
- Nunca use vos, vosotros, parcero, parce, mijo, ñaño, güey, órale, tío, che.
- Saludo: "Buen día {{name}}," (no "Hola" suelto ni "Quiubo").
- Cierre: "Quedamos atentos." + "— El equipo de OigaGIG"

Tono:
- Cercano y de confianza, como un negocio de Santander que le habla claro a la gente.
- Frases cortas. Directo. Sin retórica de agencia ni español de España.
- Vocabulario local natural: celular, computador, pedido, plata (si el tono es informal), gig, Wompi, Nequi, PSE.
- Puede usar "listo", "con gusto", "le cuento", "para que usted pueda".
- No invente jerga santandereana forzada.

Marca:
- El nombre es OigaGIG. "Oiga" encaja con el habla de la región; no lo convierta en chiste.
`.trim();

export const SANTANDER_EMAIL_GREETING = 'Buen día';
export const SANTANDER_EMAIL_SIGN_OFF = 'Quedamos atentos.\n\n— El equipo de OigaGIG';
