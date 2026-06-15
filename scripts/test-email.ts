/**
 * Quick real email test script using your production Resend key.
 *
 * Usage:
 *   npx tsx scripts/test-email.ts you@gmail.com welcome
 *   npx tsx scripts/test-email.ts you@gmail.com order
 *   npx tsx scripts/test-email.ts you@gmail.com review
 *   npx tsx scripts/test-email.ts you@gmail.com password-reset
 *
 * Override the FROM address easily (very useful while setting up domains):
 *   npx tsx scripts/test-email.ts you@gmail.com welcome --from "Oigagig <support@oigagig.com>"
 *
 * Or with env var (recommended for quick testing):
 *   RESEND_FROM_EMAIL="Oigagig <onboarding@resend.dev>" npx tsx scripts/test-email.ts you@gmail.com welcome
 *
 * It loads .env.development.local (the one with the real RESEND_API_KEY).
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load the prod-pulled env that contains the real Resend key
dotenv.config({ path: resolve(process.cwd(), '.env.development.local') });

const resendApiKey = process.env.RESEND_API_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';

if (!resendApiKey) {
  console.error('❌ RESEND_API_KEY not found in .env.development.local');
  process.exit(1);
}

const resend = new Resend(resendApiKey);

// Parse CLI args
const rawArgs = process.argv.slice(2);
const toEmail = rawArgs[0];
const emailType = rawArgs[1] || 'welcome';
let fromOverride: string | undefined;

// Support --from "Oigagig <...>"
const fromIndex = rawArgs.findIndex(arg => arg === '--from' || arg === '-f');
if (fromIndex !== -1 && rawArgs[fromIndex + 1]) {
  fromOverride = rawArgs[fromIndex + 1];
}

// Final from address priority: CLI override > env var > safe default
const fromEmail =
  fromOverride ||
  process.env.RESEND_FROM_EMAIL ||
  'Oigagig <onboarding@resend.dev>';

if (!toEmail || !toEmail.includes('@')) {
  console.error('\nUsage: npx tsx scripts/test-email.ts you@gmail.com [welcome|order|review|password-reset] [--from "Oigagig <support@oigagig.com>"]');
  process.exit(1);
}

async function send() {
  console.log(`\n📧 Sending test "${emailType}" email...`);
  console.log(`   To:      ${toEmail}`);
  console.log(`   From:    ${fromEmail}`);
  console.log(`   App URL: ${appUrl}\n`);

  let subject: string;
  let html: string;

  switch (emailType) {
    case 'welcome':
      subject = '¡Bienvenido a Oigagig!';
      html = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f97316, #dc2626); border-radius: 16px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 900;">O</div>
            <h1 style="color: #111; margin-top: 24px;">¡Bienvenido a Oigagig!</h1>
          </div>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Hola,<br><br>
            Gracias por registrarte en <strong>Oigagig</strong>, la plataforma que conecta personas con servicios locales de confianza en Colombia.
          </p>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Ya puedes explorar cientos de gigs o publicar tus propios servicios.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${appUrl}/gigs" style="background: #f97316; color: white; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">
              Explorar servicios
            </a>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            ¿Tienes preguntas? Escríbenos a <a href="mailto:support@oigagig.com" style="color: #f97316;">support@oigagig.com</a>
          </p>
        </div>
      `;
      break;

    case 'order':
      subject = 'Nuevo pedido: Limpieza Profunda';
      html = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #111;">¡Tienes un nuevo pedido!</h2>
          <p>Hola,</p>
          <p><strong>Cliente de Prueba</strong> ha realizado un pedido por tu servicio <strong>"Limpieza Profunda"</strong>.</p>
          <div style="background: #f8f8f8; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Monto:</strong> $185.000</p>
            <p style="margin: 0;"><strong>Pedido ID:</strong> test-12345</p>
          </div>
          <a href="${appUrl}/orders/test-12345" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Ver pedido
          </a>
          <p style="margin-top: 32px; color: #666; font-size: 14px;">Este es un correo de prueba.</p>
        </div>
      `;
      break;

    case 'review':
      subject = 'Nueva reseña en tu servicio';
      html = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #111;">¡Recibiste una nueva reseña!</h2>
          <p>Hola,</p>
          <p><strong>Cliente Satisfecho</strong> dejó una reseña de <strong>5 estrellas</strong> en tu servicio <strong>"Diseño de Logos"</strong>.</p>
          <a href="${appUrl}/seller/earnings" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Ver mis reseñas
          </a>
          <p style="margin-top: 32px; color: #666; font-size: 14px;">Este es un correo de prueba.</p>
        </div>
      `;
      break;

    case 'password-reset':
      subject = 'Restablece tu contraseña en Oigagig';
      const resetLink = `${appUrl}/reset-password?token=TEST-TOKEN-123`;
      html = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #111;">Restablece tu contraseña</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva:</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Este enlace expiraría en 1 hora. (Este es un correo de prueba)</p>
        </div>
      `;
      break;

    default:
      console.error('Unknown type. Use: welcome | order | review | password-reset');
      process.exit(1);
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      html,
    });

    if (result.error) {
      // Resend often returns errors inside the response object instead of throwing
      console.error('❌ Failed to send email (Resend error):');
      console.error('   Status:', result.error.statusCode);
      console.error('   Message:', result.error.message);

      if (result.error.message?.toLowerCase().includes('not verified') || result.error.message?.toLowerCase().includes('domain')) {
        console.log('\n⚠️  The FROM domain is not verified in Resend.');
        console.log('   → Go to https://resend.com/domains and verify support.oigagig.com');
        console.log('   → Or test right now with:');
        console.log('     RESEND_FROM_EMAIL="Oigagig <onboarding@resend.dev>" npx tsx scripts/test-email.ts ' + toEmail + ' ' + emailType);
      }
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('   From:', fromEmail);
    console.log('   To:', toEmail);
    console.log('   Resend ID:', result.data?.id);
    console.log('\nCheck your inbox (and spam folder).');
  } catch (error: unknown) {
    console.error('❌ Unexpected error while sending email:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

send();