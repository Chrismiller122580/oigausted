# AI Marketing Studio

A production-ready, one-stop **AI-powered marketing command center** built for the OigaUsted admin panel (`/admin/marketing`).

It lets admins:
- Describe a goal in plain language (or pick from quick goals)
- Generate high-converting, localized advertising copy for **email + multiple social channels** in seconds
- Get A/B variants, platform-optimized social posts, visual prompts, hashtags, timing advice, and strategy notes
- One-click send via the existing in-app/email broadcast system (or copy-paste for Meta Ads, organic social, WhatsApp, etc.)
- Refine iteratively with natural language ("make it shorter", "more trustworthy", "add urgency")

This has become the smartest reusable pattern for promoting a two-sided local services marketplace.

---

## Features

- **Smart Campaign Generator**
  - Quick goal buttons (acquire buyers, reactivate sellers, launch category, re-engage, referrals, updates, seasonal, etc.)
  - Free-text goal + additional instructions
  - Multi-channel selector: Email/In-app, Instagram, Facebook Ads, X/Twitter, WhatsApp
  - Tone control (cercano y confiable, profesional, urgente pero honesto, etc.)

- **High-Quality Structured Output (via Grok)**
  - Campaign name + clear objective
  - Recommended audience segment + reasoning (plugs directly into your user filters)
  - Email: subject (high open-rate), preview text, full body, CTA
  - Social: Instagram-ready, Facebook ad copy, X/Twitter, WhatsApp broadcast, general/LinkedIn version
  - 4 A/B ad variations with headline + body + CTA
  - Ready-to-use visual/image generation prompts (optimized for Flux / Midjourney / DALL·E)
  - Relevant hashtags + best posting/sending times (Colombia-focused)
  - Strategy notes + compliance tips

- **Excellent UX for Speed**
  - Load any generated email or ad variant straight into the live broadcast composer
  - One-click copy for everything
  - Quick refine buttons that re-generate with instructions
  - Seamless handoff to existing audience targeting + send tooling

- **Production Hardening**
  - Admin-only (NextAuth role check)
  - Strong fallback when Grok is unavailable
  - Respects existing user preferences (`emailEnabled` + new `marketingEmails`)
  - Full audit + `MarketingCampaign` history logging
  - Colombian Spanish natural language (vos, local tone, trust-focused)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  /admin/marketing (React page)                              │
│   • AI Studio form (goals, channels, tone, prompt)          │
│   • Results viewer (tabs: Email / Social / Ads / Visuals)   │
│   • One-click actions (load to composer, copy, refine)      │
│   • Existing: Manual composer + Live audience + History     │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  /api/admin/marketing/ai-generate                           │
│   • Validates admin session                                 │
│   • Builds extremely strong domain-specific system prompt   │
│   • Calls xAI Grok API (grok-3-mini or grok-3)              │
│   • Parses + normalizes JSON (with robust fallback)         │
│   • Returns clean structured campaign                       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼ (uses same infra as before)
              Existing broadcast + audience + MarketingCampaign models
```

Key files:
- `src/app/api/admin/marketing/ai-generate/route.ts` — The brain
- `src/app/admin/marketing/page.tsx` — The full studio UI
- `src/app/api/admin/marketing/broadcast/route.ts` — The actual sender (reused)
- `src/app/api/admin/marketing/audience/route.ts` — Live targeting
- `prisma/schema.prisma` — `MarketingCampaign` model + `marketingEmails` preference

---

## The Specialized Grok Prompt (Why It Works So Well)

The generator uses a very detailed system prompt that includes:

- Exact positioning of OigaUsted (Colombian local services / gigs marketplace, two-sided, trust via real reviews, focus on Bucaramanga initially)
- Copywriting principles for local services in Colombia (cercanía + confianza + rapidez + precio justo)
- Platform-specific constraints (Instagram length, email open rates, WhatsApp directness, etc.)
- Strict instruction to return **exact JSON structure** (no markdown, no extra text)
- Language rule: natural Colombian Spanish by default

This is the part you should copy/adapt the most when porting.

Example system prompt highlights (see the actual route for the full version):
- "Eres el director creativo de marketing más inteligente y efectivo de Colombia para [YourAppName]"
- Detailed rules for tone, anti-spam, local cultural fit
- Explicit required JSON schema with descriptions for every field

---

## API Contract (ai-generate)

**POST** `/api/admin/marketing/ai-generate`

**Request body:**
```ts
{
  goal: string,                    // Main objective (required)
  prompt?: string,                 // Extra instructions
  channels: string[],              // e.g. ["email", "instagram", "facebook", "x", "whatsapp"]
  segmentHint?: string,
  tone?: string,
  language?: 'es' | 'en',
  variations?: number
}
```

**Response:**
```ts
{
  success: true,
  campaign: {
    campaignName: string,
    objective: string,
    recommendedSegment: string,
    segmentReason: string,
    email: { subject, previewText?, body, cta? },
    social: { instagram, facebook, x, whatsapp, general },
    adCopies: Array<{ headline, body, cta }>,
    visualPrompts: string[],
    hashtags: string[],
    bestTimes: string,
    strategyNotes: string,
    complianceTips?: string
  }
}
```

The route has a solid fallback generator if the API call fails.

---

## How to Use It in Your Other App

### 1. Prerequisites
- Next.js 14+ (App Router)
- NextAuth with an `admin` role check (or your own admin guard)
- Grok / xAI API key (`GROK_API_KEY` or `XAI_API_KEY`)
- Prisma (or adapt the persistence layer)

### 2. Porting Steps

1. **Copy the generator route**
   - `src/app/api/admin/marketing/ai-generate/route.ts`
   - Update the system prompt:
     - Replace "OigaUsted" with your app name + description
     - Adjust the value proposition (what problem you solve, target geography, tone)
     - Keep the strict JSON output instruction

2. **Copy/adapt the UI page**
   - The React component is self-contained (you can extract pieces).
   - Key reusable parts:
     - Goal pills + prompt input + channel toggles + tone select
     - The big generate button + loading state
     - Tabbed results viewer (Email / Social / Ads / Visuals)
     - Copy + "Load into composer" actions
     - Refine buttons that append instructions and re-call the API

3. **Reuse or adapt your broadcast layer**
   - You don't need to copy the whole marketing system. The generator is useful even if you just output copy for manual use in Meta Ads Manager, email tools (Resend, Mailchimp), or social schedulers.

4. **Add the schema bits (optional but nice)**
   - `MarketingCampaign` model for history
   - `marketingEmails` boolean on user notification preferences

5. **Environment**
   ```env
   GROK_API_KEY=your_xai_key
   # or
   XAI_API_KEY=your_xai_key
   ```

### 3. Customization Tips

- **Different niche?** Rewrite the first 2 paragraphs of the system prompt with your app's positioning.
- **Different language?** Change the language instruction and examples.
- **More channels?** Add them to `CHANNEL_OPTIONS` and extend the JSON schema in the prompt.
- **Want images generated automatically?** After getting the `visualPrompts`, call your image generation endpoint (we have image_gen tools available in this environment).
- **Want scheduling?** Store the generated campaign + chosen send time in your `MarketingCampaign` table and run a cron.

---

## Example Flow (for reuse)

```ts
// 1. Admin fills simple form
const result = await fetch('/api/admin/marketing/ai-generate', {
  method: 'POST',
  body: JSON.stringify({
    goal: "Reactivar vendedores que no han publicado gigs en 30 días",
    channels: ["email", "instagram", "whatsapp"],
    tone: "cercano y confiable"
  })
}).then(r => r.json());

// 2. Show beautiful cards
// 3. Admin clicks "Copy for Instagram" or "Load into email blast"

// 4. (Optional) Send using your existing notification/email system
await fetch('/api/admin/marketing/broadcast', { ... });
```

---

## Files to Look At (in this repo)

- `src/app/api/admin/marketing/ai-generate/route.ts` ← Most important to copy
- `src/app/admin/marketing/page.tsx`
- `src/app/api/admin/marketing/broadcast/route.ts`
- `prisma/schema.prisma` (MarketingCampaign + marketingEmails)

---

## Notes & Gotchas

- Grok is excellent at this task when given strong domain context + strict output format.
- Always keep a good fallback (the route has one).
- For production volume, consider adding rate limiting on the generate endpoint.
- The system prompt is the real IP — treat it as such when porting.

This pattern has proven extremely effective for rapidly creating trustworthy, localized, high-conversion marketing content without needing a whole creative team for every campaign.

Feel free to adapt the prompt and UI patterns heavily for your other projects. If you want a more minimal "just the generator + copy cards" version, let me know and I can extract a lighter component.