import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return Response.json({ error: "Prompt required" }, { status: 400 });

    const GROK_API_KEY = process.env.GROK_API_KEY;
    if (!GROK_API_KEY) {
      return Response.json({ reply: "Grok no está configurado en este momento." });
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
    const reply = data.choices?.[0]?.message?.content || "No pude generar la respuesta.";
    return Response.json({ description: reply, reply });
  } catch (error) {
    console.error(error);
    return Response.json({ reply: "Lo siento, no pude generar la descripción." });
  }
}
