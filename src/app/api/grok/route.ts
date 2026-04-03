import { NextRequest } from "next/server";

const GROK_API_KEY = process.env.GROK_API_KEY; // Add this to your .env

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!GROK_API_KEY) {
      return Response.json({ error: "Grok API key not configured" }, { status: 500 });
    }

    const systemPrompt = `You are Grok, a helpful AI assistant for OigaUsted - a Colombian freelance gigs platform.
    Help users with:
    - Debugging Next.js errors
    - Creating better gig descriptions
    - Understanding buyer/seller flows
    - Wompi payment integration
    - General platform questions
    Be friendly, practical, and speak in clear Spanish when appropriate.`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Context: ${context || "General app question"}\n\nUser question: ${message}` }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu consulta en este momento.";

    return Response.json({ reply });
  } catch (error) {
    console.error("Grok API error:", error);
    return Response.json({ reply: "Hubo un error al conectar con Grok. Inténtalo de nuevo." });
  }
}
