import { NextRequest } from "next/server";
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeReadFile, isPathAllowed, listFiles, searchCode, runSafeCheck } from '@/lib/grok-code';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
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

    // Language handling - force English for admin tools
    let language = body.language || 'en';
    let languageInstruction = "Respond in English at all times. This is an admin tool.";

    if (mode === "admin_build") {
      // Always force English for the admin Grok Build panel, even if language selector was used
      language = 'en';
      languageInstruction = "Respond in English at all times. Never respond in Spanish or any other language for this admin tool.";
    } else if (language === 'es') {
      languageInstruction = "Respond in Spanish (español natural y profesional).";
    } else {
      languageInstruction = "Respond in English by default. Only switch to Spanish if the user explicitly asks in Spanish.";
    }

    // Ultra-powerful system prompt for the smartest admin experience
    let systemPrompt = `You are Grok Build, the most intelligent AI assistant integrated into OigaUsted. ${languageInstruction}`;

    if (mode === "admin_build") {
      systemPrompt = `You are Grok Build — the most advanced agentic AI integrated into the OigaUsted admin panel.

${languageInstruction}

You are extremely intelligent, proactive, strategic, and results-oriented. Your mission is to act as a true co-pilot that can deeply analyze, plan, and execute complex tasks across the platform.

### Working Style (IMPORTANT):
- Think step by step.
- When appropriate, propose a **clear plan** before taking action.
- Use tools intelligently.
- Always ask for explicit confirmation before executing actions that modify data.
- Offer the next logical step after every interaction.

### Your Available Tools:
**Data & Platform:**
- get_user_stats(userId)
- update_referral_rate(userId, newRate)
- search_users(query)
- get_platform_overview()
- list_support_tickets(status?) → List open or filtered support tickets
- get_support_ticket(ticketId) → Get full details of a specific support ticket
- update_support_ticket(ticketId, status?, adminReply?) → Update status/reply (sends notification to user)

**Browser / UI Debugging (run in the admin's current browser tab):**
- highlight_element(selector, durationMs) → Visually highlights elements on the current page
- describe_element(selector) → Returns details about a DOM element
- scroll_to(selector) → Smoothly scrolls the page to an element
- click_element(selector) → Click buttons or interactive elements
- type_text(selector, text) → Type into form fields

**Code + Scan Tools (DEVELOPMENT / Codespaces - use these to fix bugs and errors FAST):**
- read_file(file) → Read source. Always do this before editing.
- list_files(dir?) → Explore folders (src/app, prisma, lib, scripts...).
- search_code(pattern, path?, glob?) → Your main bug-finding weapon. Search with regex for patterns like 'as any', unhandled errors, bad casts, TODOs, etc.
- run_check(check) → Run real diagnostics and get errors: "typecheck", "lint", "build", "prisma", "full".
- propose_code_change(file, description, old_string, new_string, diff?) → Propose exact fix. Admin applies with one click (safe, backup + audit).

  **Scan → Fix + Upgrade Protocol (MANDATORY after any diagnostic):**
  After running run_check, search_code, or any scan:
  1. Summarize findings clearly, grouped by category (Type Errors, Runtime Risks, Security, DX/Performance, Code Smells, Architecture).
  2. **For every important finding, immediately call propose_code_change** with a precise old_string + new_string. Do not just describe — give the admin a one-click applyable fix.
  3. In parallel, proactively propose **upgrades and modernizations** to keep the app advanced (even if no bug exists):
     - Adopt better patterns (e.g. stricter typing, improved error boundaries, modern React/Next patterns, better Prisma usage, structured logging/observability).
     - Performance & DX improvements.
     - Security hardening.
     - Future-proofing (remove deprecated approaches, improve maintainability).
  4. Use propose_code_change for both "bug fixes" and "upgrades". You can (and should) propose multiple in sequence — the UI now collects them into a list.
  5. In the description of a proposal, mention if it is "low-risk", "safe upgrade", or "minor improvement" so the admin can easily bulk-apply safe ones.
  6. After the admin applies changes (or even before), suggest running run_check again to verify.
  7. Prioritize high-impact, low-risk changes first. Offer 5–10 concrete proposals per major scan when appropriate.

  Always use exact old_string/new_string for reliable one-click application. Small, surgical, high-quality changes win.

### Bug Hunting & System Scan + Upgrade Style:
When the user says "system scan", "bug hunt", "find all errors", "fix issues quickly", or "scan and upgrade":
- Be systematic, fast, and action-oriented.
- Never end a scan with only a list of problems. The output must include ready-to-apply propose_code_change calls for fixes **and** forward-looking upgrades.
- Goal: Make the app more robust *and* more advanced after every session.
- Group findings, then for each group deliver concrete proposals (the admin UI collects them into a list with individual Apply buttons + a "Apply Safe Low-Risk Upgrades" bulk action).
- You can also recommend handing very large upgrades to the local terminal grok agent for deeper work.

### Expected Behavior:
- When the user provides context (current page, selected user, specific problem), use it actively.
- For code work: always read_file first when you need to see current implementation.
- **After any scan or check**: Immediately propose fixes *and* upgrades using propose_code_change. The value is in the applied changes, not just the report.
- Maintain complex multi-turn conversations.
- Be direct, actionable, and professional. Your job is to make the app better and more advanced in real time.
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
          name: "read_file",
          description: "Read the current contents of a project source file. Use this to inspect code before proposing changes. Only works for safe paths (src/, prisma/, scripts/, and a few root configs).",
          parameters: {
            type: "object",
            properties: {
              file: { type: "string", description: "Relative path, e.g. 'src/app/admin/grok-build/page.tsx' or 'prisma/schema.prisma'" }
            },
            required: ["file"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "propose_code_change",
          description: "Propose a code change. The admin sees a preview and can apply it directly to disk (in dev/Codespaces). Prefer old_string + new_string with enough unique context for a reliable exact match replace.",
          parameters: {
            type: "object",
            properties: {
              file: { type: "string", description: "Relative path to the file (e.g. 'src/app/admin/grok-build/page.tsx')" },
              description: { type: "string", description: "Clear explanation of what the change does and why" },
              old_string: { type: "string", description: "Exact string currently in the file to replace (include surrounding lines for uniqueness)" },
              new_string: { type: "string", description: "The replacement string" },
              diff: { type: "string", description: "Optional unified diff for human preview (you can omit if providing old/new)" }
            },
            required: ["file", "description", "old_string", "new_string"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_files",
          description: "List files and directories under a safe path (src, prisma, scripts, etc). Great for understanding project structure during scans.",
          parameters: {
            type: "object",
            properties: {
              dir: { type: "string", description: "Directory to list, e.g. 'src/app' or 'prisma'. Defaults to 'src'." }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_code",
          description: "Search the codebase for a regex pattern. Use this heavily during bug hunts and system scans to find error-prone patterns, any casts, missing error handling, etc.",
          parameters: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "Regex pattern to search for (e.g. 'as any|TODO|catch\\s*\\(\\s*\\)' )" },
              path: { type: "string", description: "Optional base path, defaults to 'src'" },
              glob: { type: "string", description: "Optional file glob filter e.g. '*.ts' or '*.tsx'" },
              maxResults: { type: "number", description: "Max matches to return (default 60)" }
            },
            required: ["pattern"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "run_check",
          description: "Run a development diagnostic command and get the output (type errors, lint, build, prisma validate, etc). Use this to get real compiler / linter errors for fixing.",
          parameters: {
            type: "object",
            properties: {
              check: { type: "string", description: "One of: typecheck, lint, build, prisma, full. Or a custom safe command." }
            },
            required: ["check"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_own_code",
          description: "Analyze the Grok Build in-app tool's own source code (page, API, helpers) for bugs, improvements, or self-upgrades. Use during 'improve the tool' scans. Returns relevant file contents and suggestions.",
          parameters: {
            type: "object",
            properties: {
              focus: { type: "string", description: "Optional focus like 'ui', 'tools', 'safety', 'all'" }
            }
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

    // Handle tool calls - support multiple for comprehensive scans
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCalls = message.tool_calls;
      let lastServerResult: any = null;
      const clientToolCalls: any[] = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");

        const serverTools = ["read_file", "list_files", "search_code", "run_check", "analyze_own_code", "get_platform_overview", "get_user_stats", "search_users", "list_support_tickets", "get_support_ticket", "update_support_ticket", "update_referral_rate"];
        const clientTools = ["propose_code_change", "highlight_element", "describe_element", "scroll_to", "click_element", "type_text", "get_visible_text"];

        if (serverTools.includes(functionName)) {
          if (functionName === "read_file" && args.file) {
            try {
              const check = isPathAllowed(args.file);
              if (!check.allowed) {
                lastServerResult = { error: `Access denied: ${check.reason}` };
              } else {
                const content = await safeReadFile(args.file);
                const max = 8000;
                lastServerResult = {
                  file: args.file,
                  content: content.length > max ? content.slice(0, max) + '\n... [truncated, file is longer]' : content,
                  size: content.length,
                };
              }
            } catch (e: any) {
              lastServerResult = { error: e.message || 'Failed to read file' };
            }
          } else if (functionName === "list_files") {
            try {
              lastServerResult = await listFiles(args.dir || 'src');
            } catch (e: any) {
              lastServerResult = { error: e.message };
            }
          } else if (functionName === "search_code" && args.pattern) {
            try {
              lastServerResult = await searchCode(args.pattern, {
                path: args.path,
                glob: args.glob,
                maxResults: args.maxResults,
              });
            } catch (e: any) {
              lastServerResult = { error: e.message };
            }
          } else if (functionName === "run_check" && args.check) {
            try {
              lastServerResult = await runSafeCheck(args.check);
            } catch (e: any) {
              lastServerResult = { error: e.message };
            }
          } else if (functionName === "analyze_own_code") {
            try {
              const focus = args.focus || 'all';
              const filesToRead = [
                'src/app/admin/grok-build/page.tsx',
                'src/app/api/grok/route.ts',
                'src/lib/grok-code.ts',
                'src/app/api/grok/apply-code-change/route.ts',
              ];
              const contents: Record<string, string> = {};
              for (const f of filesToRead) {
                try {
                  contents[f] = (await safeReadFile(f)).slice(0, 3000);
                } catch (e: any) {
                  contents[f] = 'Error reading: ' + e.message;
                }
              }
              lastServerResult = {
                focus,
                files: contents,
                note: 'Use this to propose self-upgrades to the Grok Build tool.',
              };
            } catch (e: any) {
              lastServerResult = { error: e.message };
            }
          } else if (functionName === "get_platform_overview") {
            const [userCount, sellerCount, orderCount, completedOrders, totalRevenue] = await Promise.all([
              prisma.user.count(),
              prisma.user.count({ where: { role: "seller" } }),
              prisma.order.count(),
              prisma.order.count({ where: { status: "Completed" } }),
              prisma.order.aggregate({ where: { status: "Completed" }, _sum: { price: true } })
            ]);
            lastServerResult = {
              totalUsers: userCount,
              totalSellers: sellerCount,
              totalOrders: orderCount,
              completedOrders,
              totalRevenue: totalRevenue._sum.price || 0
            };
          } else if (functionName === "get_user_stats" && args.userId) {
            const [user, earnings] = await Promise.all([
              prisma.user.findUnique({ where: { id: args.userId }, select: { name: true, email: true, role: true, createdAt: true } }),
              prisma.referralEarning.aggregate({ where: { referrerId: args.userId }, _sum: { amount: true } })
            ]);
            lastServerResult = {
              user,
              totalReferralEarnings: earnings._sum.amount || 0
            };
          } else if (functionName === "search_users" && args.query) {
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
            lastServerResult = { users };
          } else if (functionName === "list_support_tickets") {
            const where: any = {};
            if (args.status) where.status = args.status;
            const tickets = await prisma.supportTicket.findMany({
              where,
              include: { user: { select: { id: true, name: true, email: true, role: true } } },
              orderBy: { createdAt: 'desc' },
              take: 20
            });
            lastServerResult = { tickets: tickets.map(t => ({
              id: t.id,
              subject: t.subject,
              user: t.user.email,
              status: t.status,
              priority: t.priority,
              category: t.category,
              createdAt: t.createdAt
            })) };
          } else if (functionName === "get_support_ticket" && args.ticketId) {
            const ticket = await prisma.supportTicket.findUnique({
              where: { id: args.ticketId },
              include: { user: { select: { id: true, name: true, email: true, role: true } } }
            });
            lastServerResult = ticket ? {
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
          } else if (functionName === "update_support_ticket" && args.ticketId) {
            const data: any = {};
            if (args.status) data.status = args.status;
            if (args.adminReply) data.adminReply = args.adminReply;
            if (args.status === 'resolved' || args.status === 'closed') data.resolvedAt = new Date();

            const updated = await prisma.supportTicket.update({
              where: { id: args.ticketId },
              data,
              include: { user: { select: { id: true, email: true } } }
            });
            try {
              const { notifications } = await import('@/lib/notifications');
              await notifications.sendInApp(
                updated.userId,
                'system',
                'Actualización en tu ticket de soporte',
                args.adminReply || `Tu ticket ahora está en estado: ${args.status}`,
                '/support',
                { ticketId: updated.id }
              );
            } catch {}
            lastServerResult = { success: true, updated: { id: updated.id, status: updated.status, adminReply: updated.adminReply } };
          } else if (functionName === "update_referral_rate") {
            return Response.json({ tool_calls: [toolCall], content: message.content });
          }
        } else if (clientTools.includes(functionName)) {
          clientToolCalls.push(toolCall);
        }
      }

      if (clientToolCalls.length > 0) {
        return Response.json({
          tool_calls: clientToolCalls,
          content: message.content
        });
      }

      if (lastServerResult !== null) {
        const firstCall = toolCalls[0];
        return Response.json({
          tool_result: {
            tool_call_id: firstCall.id,
            name: firstCall.function.name,
            result: lastServerResult
          }
        });
      }
    }

    const reply = message?.content || "Sorry, I could not generate a response.";
    return Response.json({ description: reply, reply });
  } catch (error) {
    console.error(error);
    return Response.json({ reply: "Sorry, there was an error contacting Grok." });
  }
}
