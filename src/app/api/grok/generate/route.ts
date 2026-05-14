import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { title, category } = await req.json();

    if (!title || !category) {
      return NextResponse.json({ error: "Title and category are required" }, { status: 400 });
    }

    const prompt = `Eres un experto en servicios locales en Colombia. 
Crea una descripción atractiva, profesional y persuasiva (máximo 250 palabras) para este gig:

Título: ${title}
Categoría: ${category}

Incluye:
- Qué ofrece exactamente
- Beneficios para el cliente
- Por qué elegir este servicio en Colombia
- Tono cercano y confiable

Responde SOLO con la descripción, sin introducciones.`;

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
      console.error("Grok API error:", data);
      throw new Error("Grok API failed");
    }

    const description = data.choices?.[0]?.message?.content?.trim() || 
      `Ofrezco ${title} en la categoría de ${category}. Servicio profesional y confiable en Colombia.`;

    return NextResponse.json({ description });

  } catch (error) {
    console.error("Grok generate error:", error);
    // Fallback using the title from the request (safe)
    const { title = "este servicio" } = await req.json().catch(() => ({}));
    
    return NextResponse.json({ 
      description: `Ofrezco ${title} de forma profesional y confiable. Contáctame para coordinar detalles.` 
    });
  }
}
