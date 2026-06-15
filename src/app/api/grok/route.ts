import { NextRequest } from "next/server";
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin access required for Grok Build tools' }, { status: 403 });
    }

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
      return Response.json({ reply: "Grok is not configured right now. Please set up your GROK_API_KEY." });
    }

    // Language handling
    const language = body.language || 'en';
    const languageInstruction = language === 'es' 
      ? "Respond in Spanish (español natural y profesional)." 
      : "Respond in English by default. Only switch to Spanish if the user explicitly asks in Spanish.";

    // Ultra-powerful system prompt for the smartest admin experience
    let systemPrompt = `You are Grok Build, the most intelligent AI assistant integrated into Oigagig. ${languageInstruction}`;

    if (mode === "admin_build") {
      systemPrompt = `You are Grok Build — the most advanced agentic AI integrated into the Oigagig admin panel.

${languageInstruction}

You are extremely intelligent, proactive, strategic, and results-oriented. Your mission is to act as a true co-pilot that can deeply analyze, plan, and execute complex tasks across the platform.

### Working Style (IMPORTANT):
- Think step by step.
- When appropriate, propose a **clear plan** before taking action.
- Use tools intelligently.
- Always ask for explicit confirmation before executing actions that modify data.
- Offer the next logical step after every interaction.

### Your Available Tools:
- get_user_stats(userId)
- update_referral_rate(userId, newRate)
- search_users(query)
- get_platform_overview()
- list_support_tickets(status?) → List open or filtered support tickets
- get_support_ticket(ticketId) → Get full details of a specific support ticket
- highlight_element(selector, durationMs) → Visually highlights elements on the current page (great for debugging UI bugs)
- describe_element(selector) → Returns details about a DOM element
- scroll_to(selector) → Smoothly scrolls the page to an element
- click_element(selector) → Click buttons or interactive elements
- type_text(selector, text) → Type into form fields
- propose_code_change(file, description, diff) → Suggest real code fixes

### Expected Behavior:
- When the user provides context (current page, selected user, specific problem), use it actively.
- Maintain complex multi-turn conversations.
- Be direct, actionable, and professional.
- ALWAYS get explicit admin confirmation before any data mutation (e.g. support ticket updates, rate changes). Use tools to gather info first.
- Rate limit sensitive actions; do not spam tools.
- ${languageInstruction}

Current session context:
- Page / context: ${pageContext || 'Admin Panel'}
- Selected data: ${selectedData ? JSON.stringify(selectedData).slice(0, 1200) : 'None'}
- Additional context: ${context}`;
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
      },
      {
        type: "function",
        function: {
          name: "list_support_tickets",
          description: "List support tickets. Filter by status (open, in_progress, resolved, closed) or leave empty for all recent.",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Optional filter: open, in_progress, resolved, closed" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_support_ticket",
          description: "Get full details including user info and admin reply for a specific support ticket.",
          parameters: {
            type: "object",
            properties: {
              ticketId: { type: "string", description: "The ID of the support ticket" }
            },
            required: ["ticketId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_support_ticket",
          description: "Update a support ticket status and/or add admin reply (use after getting details and confirming with admin).",
          parameters: {
            type: "object",
            properties: {
              ticketId: { type: "string" },
              status: { type: "string", description: "open, in_progress, resolved, closed" },
              adminReply: { type: "string", description: "The response or internal note to the user" }
            },
            required: ["ticketId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "highlight_element",
          description: "Visually highlight a DOM element on the current admin page to help debug UI issues. Use CSS selectors.",
          parameters: {
            type: "object",
            properties: {
              selector: { type: "string", description: "CSS selector, e.g. '.user-table-row' or '#payout-button'" },
              durationMs: { type: "number", description: "How long to highlight in milliseconds (default 4000)" }
            },
            required: ["selector"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "describe_element",
          description: "Get details about a specific DOM element (text, classes, visibility). Useful for understanding the current UI state.",
          parameters: {
            type: "object",
            properties: {
              selector: { type: "string", description: "CSS selector" }
            },
            required: ["selector"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "scroll_to",
          description: "Smoothly scroll the page to a specific element.",
          parameters: {
            type: "object",
            properties: {
              selector: { type: "string", description: "CSS selector to scroll to" }
            },
            required: ["selector"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "click_element",
          description: "Click a button, link, or any interactive element on the current admin page. Use this to test UI flows or trigger actions.",
          parameters: {
            type: "object",
            properties: {
              selector: { type: "string", description: "CSS selector of the element to click (e.g. 'button[data-testid=\"submit\"]', '#payout-button')" }
            },
            required: ["selector"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "type_text",
          description: "Type text into an input or textarea on the current page. Great for testing forms.",
          parameters: {
            type: "object",
            properties: {
              selector: { type: "string", description: "CSS selector of the input/textarea" },
              text: { type: "string", description: "The text to type" }
            },
            required: ["selector", "text"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "propose_code_change",
          description: "Propose a code change to fix a bug or improve something. The admin will see a diff preview and can apply it.",
          parameters: {
            type: "object",
            properties: {
              file: { type: "string", description: "Relative path to the file (e.g. 'src/components/Button.tsx')" },
              description: { type: "string", description: "Clear explanation of what the change does" },
              diff: { type: "string", description: "Unified diff format of the proposed change" }
            },
            required: ["file", "description", "diff"]
          }
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
      return Response.json({ reply: "Error communicating with Grok. Check your API key or try again later." });
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
              { name: { contains: args.query } },
              { email: { contains: args.query } }
            ]
          },
          take: 8,
          select: { id: true, name: true, email: true, role: true }
        });
        toolResult = { users };
      }

      if (functionName === "list_support_tickets") {
        const where: any = {};
        if (args.status) where.status = args.status;
        const tickets = await prisma.supportTicket.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        });
        toolResult = { tickets: tickets.map((t: any) => ({
          id: t.id,
          subject: t.subject,
          user: t.user.email,
          status: t.status,
          priority: t.priority,
          category: t.category,
          createdAt: t.createdAt
        })) };
      }

      if (functionName === "get_support_ticket" && args.ticketId) {
        const ticket = await prisma.supportTicket.findUnique({
          where: { id: args.ticketId },
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        });
        toolResult = ticket ? {
          id: ticket.id,
          subject: ticket.subject,
          message: ticket.message,
          user: ticket.user,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          adminReply: ticket.adminReply,
          createdAt: ticket.createdAt,
          resolvedAt: ticket.resolvedAt
        } : { error: 'Ticket not found' };
      }

      if (functionName === "update_support_ticket" && args.ticketId) {
        // Defer to frontend for explicit admin confirmation (like update_referral_rate)
        // This prevents auto-execution of ticket mutations by Grok.
        return Response.json({
          tool_calls: message.tool_calls,
          content: message.content
        });
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
