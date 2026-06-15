import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';

export async function POST(req: NextRequest) {
  let parsedBody: any = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    parsedBody = await req.json();
    const { title, category, type } = parsedBody;

    if (!title || !category) {
      return NextResponse.json({ error: "Title and category are required" }, { status: 400 });
    }

    let prompt = '';
    if (type === 'faq') {
      prompt = `Eres un experto en soporte al cliente para Oigagig, el marketplace de servicios locales en Colombia (gigs con Nequi/PayU, chat por WhatsApp, perfiles públicos de vendedores).

Genera UNA entrada de FAQ útil, clara y precisa en español.

Tema sugerido: ${title}
Categoría: ${category}

Devuelve SOLO un JSON válido (sin markdown, sin explicaciones) con esta forma exacta:
{
  "question": "Pregunta clara y natural que haría un usuario",
  "answer": "Respuesta útil, paso a paso si aplica, máximo 120 palabras, tono cercano y profesional. Menciona Nequi, pedidos, perfiles públicos o lo que corresponda cuando sea relevante."
}`;
    } else {
      prompt = `Eres un experto en servicios locales en Colombia. 
Crea una descripción atractiva, profesional y persuasiva (máximo 250 palabras) para este gig:

Título: ${title}
Categoría: ${category}

Incluye:
- Qué ofrece exactamente
- Beneficios para el cliente
- Por qué elegir este servicio en Colombia
- Tono cercano y confiable

Responde SOLO con la descripción, sin introducciones.`;
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY || process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      devLog("Grok API error:", data);
      throw new Error("Grok API failed");
    }

    const content = data.choices?.[0]?.message?.content?.trim() || '';

    if (type === 'faq') {
      // Try to parse JSON from the model
      let parsedFaq: any = null;
      try {
        // The model sometimes wraps in ```json ... ```
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsedFaq = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch {
        // Fallback FAQ structure
        parsedFaq = {
          question: title,
          answer: content || `Respuesta generada para: ${title}. Por favor edita este texto en el admin.`,
        };
      }
      return NextResponse.json({ 
        question: parsedFaq.question || title, 
        answer: parsedFaq.answer || content 
      });
    }

    const description = content || 
      `Ofrezco ${title} en la categoría de ${category}. Servicio profesional y confiable en Colombia.`;

    return NextResponse.json({ description });

  } catch (error) {
    devLog("Grok generate error:", error);
    // Fallback using the title from the request (safe)
    const fallbackTitle = parsedBody.title || "este servicio";
    
    if (parsedBody.type === 'faq') {
      return NextResponse.json({ 
        question: fallbackTitle,
        answer: `Respuesta de respaldo para ${fallbackTitle}. Edita este texto en Admin > Settings > FAQ.`
      });
    }

    return NextResponse.json({ 
      description: `Ofrezco ${fallbackTitle} de forma profesional y confiable. Contáctame para coordinar detalles.` 
    });
  }
}
