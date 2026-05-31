import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      mode = "general", 
      context = "", 
      pageContext = "", 
      selectedData = null,
      history = [],
      stream = false
    } = body;

    if (!prompt) return Response.json({ error: "Prompt required" }, { status: 400 });

    const GROK_API_KEY = process.env.GROK_API_KEY;
    if (!GROK_API_KEY) {
      return Response.json({ reply: "Grok no está configurado en este momento. Por favor configura GROK_API_KEY." });
    }

    // Ultra-powerful system prompt for the smartest admin experience
    let systemPrompt = "Eres Grok Build, el asistente de IA más inteligente integrado en OigaUsted.";

    if (mode === "admin_build") {
      systemPrompt = `Eres Grok Build — el asistente de IA más avanzado y agente integrado en el panel de administración de OigaUsted.

Eres extremadamente inteligente, proactivo, estratégico y orientado a resultados. Tu misión es actuar como un verdadero co-piloto que puede analizar, planificar y ejecutar tareas complejas dentro de la plataforma.

### Estilo de trabajo (IMPORTANTE):
- Piensa paso a paso.
- Cuando sea apropiado, propone un **plan claro** antes de actuar.
- Usa herramientas de forma inteligente.
- Siempre pide confirmación explícita antes de ejecutar acciones que modifiquen datos.
- Ofrece el siguiente paso lógico después de cada interacción.

### Tus herramientas actuales:
- get_user_stats(userId)
- update_referral_rate(userId, newRate)
- search_users(query)
- get_platform_overview()

### Comportamiento esperado:
- Cuando el usuario proporcione contexto (página actual, usuario seleccionado, problema específico), úsalo activamente.
- Sé capaz de mantener conversaciones multi-turno complejas.
- Sé directo, accionable y profesional.
- Usa español claro y natural.

Contexto actual de la sesión:
- Página / contexto: ${pageContext || 'Panel de administración'}
- Datos seleccionados: ${selectedData ? JSON.stringify(selectedData).slice(0, 1200) : 'Ninguno'}
- Contexto adicional: ${context}`;
    }

    // Build proper message history if provided (for real conversation memory)
    let apiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // If full history was sent from frontend, use it (much smarter experience)
    if (Array.isArray(history) && history.length > 0) {
      // Convert our Message format to OpenAI format
      const formattedHistory = history.slice(0, -1).map((m: any) => ({
        role: m.role,
        content: m.content
      }));
      apiMessages = apiMessages.concat(formattedHistory);
    }

    apiMessages.push({ role: "user", content: prompt });

    // Define powerful admin tools (these actually do real things)
    const tools = [
      {
        type: "function",
        function: {
          name: "get_user_stats",
          description: "Fetch real stats for a user including their referral earnings impact.",
          parameters: {
            type: "object",
            properties: {
              userId: { type: "string", description: "The ID of the user to analyze" }
            },
            required: ["userId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_referral_rate",
          description: "Safely update a referrer's custom commission rate (requires confirmation).",
          parameters: {
            type: "object",
            properties: {
              userId: { type: "string", description: "The referrer's user ID" },
              newRate: { type: "number", description: "New rate as decimal, e.g. 0.07 for 7%" }
            },
            required: ["userId", "newRate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_users",
          description: "Search users by name or email.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search term" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_platform_overview",
          description: "Get high-level platform stats (total users, sellers, revenue, pending payouts).",
          parameters: { type: "object", properties: {} }
        }
      }
    ];

    const shouldStream = stream === true;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: apiMessages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1500,
        stream: shouldStream,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Grok API error:", errorData);
      return Response.json({ reply: "Error al comunicarse con Grok. Revisa tu API key o intenta más tarde." });
    }

    // Streaming support (for the snappiest experience)
    if (shouldStream) {
      return new Response(res.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;

    // Handle tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");

      // Execute read-only tools on the server
      let toolResult: any = null;

      if (functionName === "get_platform_overview") {
        const [userCount, sellerCount, orderCount, completedOrders, totalRevenue] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: "seller" } }),
          prisma.order.count(),
          prisma.order.count({ where: { status: "Completed" } }),
          prisma.order.aggregate({ where: { status: "Completed" }, _sum: { price: true } })
        ]);

        toolResult = {
          totalUsers: userCount,
          totalSellers: sellerCount,
          totalOrders: orderCount,
          completedOrders,
          totalRevenue: totalRevenue._sum.price || 0
        };
      }

      if (functionName === "get_user_stats" && args.userId) {
        const [user, earnings] = await Promise.all([
          prisma.user.findUnique({ where: { id: args.userId }, select: { name: true, email: true, role: true, createdAt: true } }),
          prisma.referralEarning.aggregate({ where: { referrerId: args.userId }, _sum: { amount: true } })
        ]);

        toolResult = {
          user,
          totalReferralEarnings: earnings._sum.amount || 0
        };
      }

      if (functionName === "search_users" && args.query) {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: args.query, mode: "insensitive" } },
              { email: { contains: args.query, mode: "insensitive" } }
            ]
          },
          take: 8,
          select: { id: true, name: true, email: true, role: true }
        });
        toolResult = { users };
      }

      if (functionName === "update_referral_rate") {
        // Return to frontend for confirmation + execution (safety)
        return Response.json({
          tool_calls: message.tool_calls,
          content: message.content
        });
      }

      return Response.json({
        tool_result: {
          tool_call_id: toolCall.id,
          name: functionName,
          result: toolResult
        }
      });
    }

    const reply = message?.content || "No pude generar la respuesta.";
    return Response.json({ description: reply, reply });
  } catch (error) {
    console.error(error);
    return Response.json({ reply: "Lo siento, ocurrió un error al contactar con Grok." });
  }
}
