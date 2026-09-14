import { NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status';
import { requireAdminFromDb } from '@/lib/admin-auth';

interface GrokChatMessage {
  role: string
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminFromDb();
    if (!session) {
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

    const language = body.language || 'en';
    const languageInstruction = language === 'es' 
      ? "Responde en español colombiano de Santander (Bucaramanga): use usted/le/su, tono cercano y claro. Nunca vos, parce ni tuteo." 
      : "Respond in English by default. Only switch to Spanish if the user explicitly asks in Spanish.";

    let systemPrompt = `You are Grok Build, the most intelligent AI assistant integrated into OigaGIG. ${languageInstruction}`;

    if (mode === "admin_build") {
      systemPrompt = `You are Grok Build — the most advanced agentic AI integrated into the OigaGIG admin panel.

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
- list_support_tickets(status?)
- get_support_ticket(ticketId)
- highlight_element(selector, durationMs)
- describe_element(selector)
- scroll_to(selector)
- click_element(selector)
- type_text(selector, text)
- propose_code_change(file, description, diff)

### Expected Behavior:
- When the user provides context (current page, selected user, specific problem), use it actively.
- Maintain complex multi-turn conversations.
- Be direct, actionable, and professional.
- ALWAYS get explicit admin confirmation before any data mutation.
- Rate limit sensitive actions; do not spam tools.
- ${languageInstruction}

Current session context:
- Page / context: ${pageContext || 'Admin Panel'}
- Selected data: ${selectedData ? JSON.stringify(selectedData).slice(0, 1200) : 'None'}
- Additional context: ${context}`;
    }

    let apiMessages: GrokChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    if (Array.isArray(history) && history.length > 0) {
      const formattedHistory = history.slice(0, -1).map((m: GrokChatMessage) => ({
        role: m.role,
        content: m.content
      }));
      apiMessages = apiMessages.concat(formattedHistory);
    }

    apiMessages.push({ role: "user", content: prompt });

    const tools = [
      { type: "function", function: { name: "get_user_stats", description: "Fetch real stats for a user including their referral earnings impact.", parameters: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] } } },
      { type: "function", function: { name: "update_referral_rate", description: "Safely update a referrer's custom commission rate (requires confirmation).", parameters: { type: "object", properties: { userId: { type: "string" }, newRate: { type: "number" } }, required: ["userId", "newRate"] } } },
      { type: "function", function: { name: "search_users", description: "Search users by name or email.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
      { type: "function", function: { name: "get_platform_overview", description: "Get high-level platform stats (total users, sellers, revenue, pending payouts).", parameters: { type: "object", properties: {} } } },
      { type: "function", function: { name: "list_support_tickets", description: "List support tickets. Filter by status or leave empty for all recent.", parameters: { type: "object", properties: { status: { type: "string" } } } } },
      { type: "function", function: { name: "get_support_ticket", description: "Get full details including user info and admin reply for a specific support ticket.", parameters: { type: "object", properties: { ticketId: { type: "string" } }, required: ["ticketId"] } } },
      { type: "function", function: { name: "update_support_ticket", description: "Update a support ticket status and/or add admin reply.", parameters: { type: "object", properties: { ticketId: { type: "string" }, status: { type: "string" }, adminReply: { type: "string" } }, required: ["ticketId"] } } },
      { type: "function", function: { name: "highlight_element", description: "Visually highlight a DOM element on the current admin page.", parameters: { type: "object", properties: { selector: { type: "string" }, durationMs: { type: "number" } }, required: ["selector"] } } },
      { type: "function", function: { name: "describe_element", description: "Get details about a specific DOM element.", parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] } } },
      { type: "function", function: { name: "scroll_to", description: "Smoothly scroll the page to a specific element.", parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] } } },
      { type: "function", function: { name: "click_element", description: "Click a button, link, or any interactive element on the current admin page.", parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] } } },
      { type: "function", function: { name: "type_text", description: "Type text into an input or textarea on the current page.", parameters: { type: "object", properties: { selector: { type: "string" }, text: { type: "string" } }, required: ["selector", "text"] } } },
      { type: "function", function: { name: "propose_code_change", description: "Propose a code change to fix a bug or improve something.", parameters: { type: "object", properties: { file: { type: "string" }, description: { type: "string" }, diff: { type: "string" } }, required: ["file", "description", "diff"] } } }
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

    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");
      let toolResult: unknown = null;

      if (functionName === "get_platform_overview") {
        const [userCount, sellerCount, orderCount, completedOrders, totalRevenue] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: "seller" } }),
          prisma.order.count(),
          prisma.order.count({ where: { status: labelToPrismaStatus(OrderStatusLabel.Completed) } }),
          prisma.order.aggregate({
            where: { status: labelToPrismaStatus(OrderStatusLabel.Completed) },
            _sum: { price: true },
          })
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
        toolResult = { user, totalReferralEarnings: earnings._sum.amount || 0 };
      }

      if (functionName === "search_users" && args.query) {
        const users = await prisma.user.findMany({
          where: { OR: [{ name: { contains: args.query } }, { email: { contains: args.query } }] },
          take: 8,
          select: { id: true, name: true, email: true, role: true }
        });
        toolResult = { users };
      }

      if (functionName === "list_support_tickets") {
        const where: Prisma.SupportTicketWhereInput = {};
        if (args.status) where.status = args.status;
        const tickets = await prisma.supportTicket.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        });
        toolResult = { tickets: tickets.map((t: (typeof tickets)[number]) => ({
          id: t.id, subject: t.subject, user: t.user.email, status: t.status, priority: t.priority, category: t.category, createdAt: t.createdAt
        })) };
      }

      if (functionName === "get_support_ticket" && args.ticketId) {
        const ticket = await prisma.supportTicket.findUnique({
          where: { id: args.ticketId },
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        });
        toolResult = ticket ? {
          id: ticket.id, subject: ticket.subject, message: ticket.message, user: ticket.user,
          category: ticket.category, priority: ticket.priority, status: ticket.status,
          adminReply: ticket.adminReply, createdAt: ticket.createdAt, resolvedAt: ticket.resolvedAt
        } : { error: 'Ticket not found' };
      }

      if (functionName === "update_support_ticket" && args.ticketId) {
        return Response.json({ tool_calls: message.tool_calls, content: message.content });
      }

      if (functionName === "update_referral_rate") {
        return Response.json({ tool_calls: message.tool_calls, content: message.content });
      }

      return Response.json({
        tool_result: { tool_call_id: toolCall.id, name: functionName, result: toolResult }
      });
    }

    const reply = message?.content || "No pude generar la respuesta.";
    return Response.json({ description: reply, reply });
  } catch (error) {
    console.error(error);
    return Response.json({ reply: "Lo siento, ocurrió un error al contactar con Grok." });
  }
}
