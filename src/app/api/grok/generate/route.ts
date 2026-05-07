import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return Response.json({ error: "Prompt required" }, { status: 400 });

    const GROK_API_KEY = process.env.GROK_API_KEY;

    if (!GROK_API_KEY) {
      return Response.json({ 
        description: "¡${title || 'Servicio Profesional'}! Ofrecemos un servicio de alta calidad, confiable y con atención al detalle." 
      });
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const data = await res.json();
    const description = data.choices?.[0]?.message?.content || "No pude generar la descripción.";
    return Response.json({ description });
  } catch (error) {
    console.error(error);
    return Response.json({ description: "Lo siento, hubo un error con Grok." });
  }
}
