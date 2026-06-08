# In-App Grok Build (Admin Tool)

This document describes a powerful **in-app Grok Build agent** built directly into a Next.js admin panel. 

It was designed so that Grok (or similar coding agents) can:
- Perform real system scans and diagnostics
- Find bugs and anti-patterns
- Propose **fixes** and **proactive upgrades**
- Apply changes safely with one click (in development)

The goal of this pattern is **rapid iteration and continuous modernization** inside the actual running application, while staying safe.

This README is written to be highly consumable by Grok Build / other AI coding agents so they can replicate the same (or better) experience in other apps.

---

## Overview

**Location**: `/admin/grok-build`

**Core Idea**: Instead of only using the standalone `grok` CLI (which has full filesystem + shell access), give admins a web-based Grok that lives *inside* the app.

It combines:
- The intelligence of the Grok model (via `https://api.x.ai`)
- Curated, high-value tools the model can call
- A rich client UI for human-in-the-loop approval (especially for code changes)
- Strong safety boundaries

**Key Differentiator from Standalone Grok**:
- Standalone `grok` CLI → best for large refactors, git work, running commands.
- This in-app version → best for **quick bug hunts, live diagnostics, and applying targeted fixes/upgrades** while looking at real admin data and the live UI.

---

## Architecture

### 1. Frontend (`src/app/admin/grok-build/page.tsx`)
- React client component.
- Maintains conversation history (including tool results).
- Sends requests to `/api/grok` with `mode: "admin_build"`.
- Handles two kinds of tools:
  - **Server-executed tools** (data, code search, diagnostics) → results come back in the response and are fed to the model.
  - **Client-side / interactive tools** (DOM helpers + `propose_code_change`) → the server returns the raw `tool_calls` so the UI can render rich experiences (highlighting elements, showing proposal cards, etc.).

**Important UI Pattern (Multi-Proposal)**:
After a scan, Grok can propose many changes. The UI accumulates them in a list instead of overwriting a single proposal. 

Recent upgrade (A): The proposal rendering was extracted into a reusable `<ProposalCard />` component (`src/components/admin/ProposalCard.tsx`) for better maintainability. The main page now imports and uses it, keeping the core page focused on state, tool execution, and chat logic.

Each proposal card has:
- File + description + creation timestamp
- Side-by-side OLD/NEW preview (or raw diff)
- Apply / Copy / Dismiss / Undo buttons
- Low-risk checkbox
- Bulk action: "Apply Safe Low-Risk Upgrades" (double confirmation) in the header

---

## Recent Upgrades to the Tool Itself (Self-Improvement Focus)

These upgrades were identified and implemented during a "self-scan" of the Grok Build admin tool. They make the tool more robust, usable, and capable of improving *itself*. They are documented here so other Grok Build instances can understand the rationale and replicate or extend the patterns.

### A. Extract Components (Maintainability)
- **Problem**: The main page (`src/app/admin/grok-build/page.tsx`) had grown to >1100 lines with all the proposal logic, making it hard to maintain as features were added.
- **Solution**: Extracted proposal rendering into `src/components/admin/ProposalCard.tsx` (with exported `Proposal` interface). The page now maps over proposals and renders `<ProposalCard proposal={...} onApply=... />`.
- **Benefits**: Cleaner separation, easier testing/extension, follows React best practices.
- **How Grok should build it**: When adding complex UI (like proposal lists), always extract cards/lists early. Pass handlers as props.

### B. Streaming for Long Scans
- **Problem**: Long diagnostic runs (`run_check` + multiple `search_code`) or final summary replies felt unresponsive.
- **Solution**: 
  - `sendMessageWithHistory` (post-tool continuation) now passes `stream: true`.
  - Added a basic `ReadableStream` + `TextDecoder` handler that accumulates chunks into a temporary streaming assistant message (with naive JSON delta extraction).
  - Final reply replaces the stream placeholder.
- **Benefits**: Live "thinking" feedback during heavy scans. Better perceived performance.
- **How Grok should build it**: Enable streaming on continuation calls after tool-heavy turns. Accumulate in a dedicated message with an ID so you can replace it cleanly when done. Handle both raw chunks and SSE-style `data:` lines.

### C. Self-Meta Tool + "Improve the Tool" Button
- **Problem**: The tool could scan the *app* but had no easy way to reflect on and upgrade *its own code*.
- **Solution**:
  - New server tool `analyze_own_code` (defined in `src/app/api/grok/route.ts` tools array + execution handler).
    - Reads the core self-files (`grok-build/page.tsx`, API route, `grok-code.ts`, apply route) with size limits.
    - Returns focused content + guidance note for the model.
  - Prominent button in the Scan mode sidebar: "🧠 Improve the Tool Itself (self-meta scan)".
  - Sends a pre-crafted prompt that calls the tool then uses `propose_code_change`.
- **Benefits**: True self-improvement loop. The agent can now propose upgrades to its own UI, tools, prompts, etc.
- **How Grok should build it**: Add a scoped "analyze_own_code" tool that only reads the agent's own source. Pair it with a dedicated UI affordance and a strong prompt that says "use this to propose self-upgrades".

### D. Undo Polish + Audit Visibility
- **Problem**: Backups (`.grok-bak-*`) were created but not easily usable. No visibility into when proposals were made.
- **Solution**:
  - Full-stack undo: `undoLastApply()` in `src/lib/grok-code.ts` (finds latest backup, restores, logs `GROK_CODE_UNDO`).
  - Route support in `apply-code-change` for `action: 'undo'`.
  - Per-proposal "Undo" button on every card + header "Undo Last Apply".
  - `createdAt` timestamp added to proposals (shown in cards).
  - Better chat messages after undo/apply.
- **Benefits**: Safety net for applies. Time-based visibility helps during long sessions. Consistent with the app's existing `AuditLog`.
- **How Grok should build it**: When adding destructive actions, always expose the backup/restore path. Store metadata like timestamps on UI state. Log to the host app's audit system.

### E. Better Diff + Verification
- **Problem**: Preview was a single raw `<pre>` (hard to read). No automatic follow-up after applies.
- **Solution**:
  - Side-by-side OLD/NEW blocks when `old_string`/`new_string` are present (much clearer than unified diff).
  - After any successful apply (single or bulk), the assistant automatically suggests: `run_check("typecheck") or "full" to verify... and propose follow-ups`.
  - Labels like "Preview (better diff on apply success)".
- **Benefits**: Easier human review of proposals. Closes the "apply → verify" loop automatically.
- **How Grok should build it**: For code proposals, always prefer structured `old_string`/`new_string` and render them side-by-side in the UI. After apply success, have the agent (or UI) trigger a verification step.

### F. Handoff to Local CLI (Power User)
- **Problem**: The in-app tool is great for quick scans + targeted applies, but the standalone `grok` CLI has full shell/git/multi-file power for big refactors.
- **Solution**:
  - "📤 Handoff to Local grok CLI" button (in Scan mode sidebar).
  - Copies a ready-to-paste prompt that references the current in-app context/proposals and instructs the CLI agent to continue with deeper work.
  - Complements the existing sidebar tip.
- **Benefits**: Seamless escalation path. Keeps the in-app tool focused while giving users the full agent when needed.
- **How Grok should build it**: Always provide an "escalate to full CLI" escape hatch with a well-crafted prompt that includes session context.

These upgrades were applied directly to the live code (see git history for the exact diffs). They demonstrate the "Scan → Diagnose → Propose Fixes + Upgrades → One-click Apply" loop working on the tool's own implementation.

---

## How to Replicate in Another Next.js App (continued)

### 2. Backend API (`src/app/api/grok/route.ts`)
- Protected by admin role check.
- When `mode === "admin_build"`, it injects a very strong system prompt + a rich set of tools (function calling).
- Calls `https://api.x.ai/v1/chat/completions` with the `grok-3` (or appropriate) model.
- Handles tool execution for server-side tools.
- For interactive tools, forwards the `tool_calls` to the client.

**Critical**: The system prompt contains a **"Scan → Fix + Upgrade Protocol"** section that forces the model to:
1. Use diagnostic tools first.
2. Never just report problems.
3. Immediately call `propose_code_change` for fixes **and** upgrades.
4. Tag low-risk/safe changes in descriptions.
5. Propose multiple changes when appropriate.

### 3. Code Intelligence Layer (`src/lib/grok-code.ts`)
This is the most important file to replicate for code capabilities.

Key exports:
- `isPathAllowed()` + `resolveSafePath()` — strict allowlist + deny patterns.
- `safeReadFile()`
- `listFiles()`
- `searchCode()` — recursive regex search (skips node_modules, .next, secrets, etc.).
- `runSafeCheck()` — whitelisted dev commands (`typecheck`, `lint`, `build`, `prisma`, `full`).
- `applyCodeChange()` — the safe apply function:
  - Requires `old_string` + `new_string` (exact match).
  - Creates timestamped `.grok-bak` backup.
  - Logs to your existing `AuditLog` table.
  - Dev-only guard.

**Apply endpoint**: `src/app/api/grok/apply-code-change/route.ts` (also admin-protected).

### 4. Safety Model (Very Important)
- **Environment guard**: Code writes and `run_check` are disabled unless `NODE_ENV !== 'production'` **or** `ALLOW_GROK_CODE_EDITS=1`.
- **Path restrictions**: Only `src/`, `prisma/`, `scripts/`, a few root configs.
- **Deny list**: `.env*`, auth files, secrets, `node_modules`, `.git`, `.next`, lockfiles, DB files, etc.
- **Human approval required** for every code change (model can only *propose*).
- **Audit logging** of every applied change.
- **Backups** created automatically.

This pattern lets you be aggressive with agent capabilities in dev while staying safe in production.

---

## How to Replicate in Another Next.js App

### Step 1: Create the Page
Create `app/admin/grok-build/page.tsx` (or your equivalent admin route).

Key pieces to copy/adapt:
- The `BUILD_MODES` array (include a `scan` mode).
- Rich `SUGGESTED_PROMPTS` especially for the scan mode (focus on "propose fixes AND upgrades").
- State for `pendingProposals` (array, not single object).
- `executeTool` function that handles `propose_code_change` by pushing to the array.
- The big proposal list UI (with low-risk checkboxes and bulk apply).
- The master "Full Scan + Propose Fixes & Upgrades" button.
- Category picker chips that send focused prompts.

### Step 2: Add the API Route
Create `app/api/grok/route.ts`.

- Require admin session.
- Load `GROK_API_KEY` (or `XAI_API_KEY`).
- When `mode === "admin_build"`, use the long system prompt (copy the one from this repo, especially the "Scan → Fix + Upgrade Protocol" section).
- Define the full `tools` array (Data + Browser + Code/Scan tools).
- Execute server tools (`read_file`, `search_code`, `run_check`, platform data, etc.).
- For `propose_code_change` + browser tools, return `{ tool_calls: ... }` so the client can handle the UI.

### Step 3: Implement the Safety + Tool Layer
Create `lib/grok-code.ts` (or equivalent).

You must implement at minimum:
- Path allow/deny logic.
- `read_file`, `list_files`, `search_code`.
- `runSafeCheck` (or similar) using child_process with timeouts and whitelisting.
- `applyCodeChange` using exact `old_string` replacement + backup + audit.

Create `app/api/grok/apply-code-change/route.ts` that calls the apply function after re-checking admin.

### Step 4: Wire Up the System Prompt
The magic is in the prompt. Key sections to include:
- List of available tools with good descriptions.
- **"Scan → Fix + Upgrade Protocol"** (MANDATORY).
- Instruction to propose multiple changes and use the `low-risk` language.
- Instruction to always use `old_string` + `new_string`.

### Step 5: Add Supporting UI/UX
- Accumulate proposals instead of replacing a single one.
- Low-risk flagging + bulk apply with double confirmation.
- Category quick prompts.
- A big "scan + propose" action.

---

## Recommended Tool Definitions (Function Calling)

Include at least these for a strong "scan + modernize" experience:

**Code/Scan Tools** (the highest leverage ones):
- `read_file`
- `list_files`
- `search_code`
- `run_check`
- `propose_code_change` (with `old_string`, `new_string`, `description`)

**Data Tools** (very useful in admin context):
- Platform overview, user stats, support tickets, etc.

**Browser Tools** (great for UI debugging without leaving the page):
- `highlight_element`, `click_element`, `type_text`, etc.

---

## Best Practices for Grok When Building This Pattern

1. **Make "after scan" behavior explicit in the system prompt.** Grok will not naturally propose code changes unless you tell it "you must call propose_code_change".

2. **Use `old_string` + `new_string` instead of (or in addition to) unified diffs.** Exact string replacement is far more reliable than trying to apply patches on the server.

3. **Accumulate proposals on the client.** This lets the model propose 5–10 changes from one big scan without the UI getting in the way.

4. **Separate "diagnosis" from "action".** Server tools for reading/diagnostics. Client + approval flow for writes.

5. **Document low-risk changes.** Tell the model to use phrases like "low-risk", "safe upgrade", "minor improvement" in descriptions. This enables nice bulk actions.

6. **Provide both "full scan" and "focused category" prompts.** This gives the user (and future Grok sessions) good guardrails.

7. **Always re-verify.** After applying changes, the prompt should encourage running `run_check` again.

---

## Example Powerful Prompts

```text
"Perform a comprehensive system scan right now using run_check and search_code. Then propose 6-10 high-impact fixes and upgrades across categories. Use propose_code_change for each."
```

```text
"Focus on the Security & Hardening category. Identify risks and propose concrete hardening upgrades."
```

```text
"Run typecheck + lint. For every real error, immediately propose a precise fix. Also suggest 3 modern pattern upgrades."
```

---

## Limitations (Be Honest When Replicating)

- Currently only processes the first tool call per turn (simple implementation).
- Code changes are limited to text replacement (no complex refactors or multi-file coordinated changes easily).
- Relies on `GROK_API_KEY` being set on the server.
- Browser tools only affect the admin's current browser tab.
- Not a full replacement for the standalone `grok` CLI on large architectural work.

---

## Files to Study When Replicating

- `src/app/admin/grok-build/page.tsx` — the entire client experience
- `src/app/api/grok/route.ts` — tool definitions + prompt + execution
- `src/lib/grok-code.ts` — the safety and code intelligence core (most important to port)
- `src/app/api/grok/apply-code-change/route.ts` — the write path

Copy the structure, adapt the data tools to your domain, keep the code/scan tools and safety model similar, and tune the system prompt for your "keep the app advanced" goals.

This pattern has proven extremely effective for fast bug fixing and continuous improvement while the app is running in development.