// app/api/grok/route.ts
import { NextRequest } from "next/server";

const GROK_API_KEY = process.env.GROK_API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log("🔑 GROK_API_KEY exists:", !!GROK_API_KEY);
    console.log("GROK_API_KEY length:", GROK_API_KEY?.length || 0);

    if (!GROK_API_KEY) {
      return Response.json({ 
        error: "Grok API key not configured",
        reply: "Lo siento, la clave de Grok no está configurada."
      }, { status: 500 });
    }

    const { message } = await request.json();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3",                    // ← Latest model
        messages: [
          { 
            role: "system", 
            content: "Eres Grok, un asistente útil y amigable para OigaUsted, la plataforma colombiana de gigs y servicios locales. Ayuda a crear descripciones atractivas, profesionales y persuasivas en español colombiano natural." 
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 700,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("xAI API Error:", response.status, errorText);
      throw new Error(`xAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 
      "Lo siento, no pude generar la descripción en este momento.";

    console.log("✅ Grok response received successfully");

    return Response.json({ reply });

  } catch (error: any) {
    console.error("Grok API full error:", error.message || error);
    return Response.json({ 
      error: "Error connecting to Grok",
      reply: "Lo siento, no pude procesar tu consulta en este momento. Inténtalo de nuevo."
    });
  }
}