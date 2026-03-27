# AgentHire

> Hire Your Synthetic Workforce — Autonomous AI agents that work 24/7, never call in sick, and cost a fraction of a human hire.

## Tech Stack

- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS
- **AI SDKs**: Anthropic Claude, OpenAI GPT-4o

## Features

- AI Agent catalog with filtering, search, and status indicators
- Waitlist signup via API route
- Supabase-backed agent/contract/task management
- Supabase Edge Function for secure job dispatching
- AES-256-GCM encrypted API key storage
- Sandboxed tool execution with allowlist gating
- Real-time token budget enforcement
- SOC 2-aligned audit logging

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase CLI (`npm install -g supabase`)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/agenthire.git
cd agenthire
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project credentials.

### 3. Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Supabase Local Dev

```bash
supabase init
supabase start
# Paste the local URL + anon key into .env.local
# Run the schema:
#   supabase db execute --file supabase/schema.sql
```

### 5. Deploy Edge Function

```bash
supabase functions deploy job-dispatcher
```

---

## Deploy to Vercel

### Option A: Via CLI

```bash
npm i -g vercel
vercel
```

### Option B: Via GitHub

1. Push code to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → "Import Project"
3. Select your repo
4. Add environment variables from `.env.local.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AES_ENCRYPTION_KEY`
5. Deploy!

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. In **Authentication** → configure your provider (email, GitHub, etc.)
4. Enable **Edge Functions** in Project Settings if not already enabled
5. Deploy the `job-dispatcher` edge function:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy job-dispatcher
```

---

## Project Structure

```
agenthire-deploy/
├── app/
│   ├── api/waitlist/route.ts   # Waitlist API endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage (converted from React component)
│   └── globals.css              # Tailwind base styles
├── components/
│   └── AgentCard.tsx            # Agent card component (standalone)
├── lib/
│   └── supabase.ts              # Supabase client setup
├── supabase/
│   ├── config.toml              # Supabase CLI config
│   ├── functions/
│   │   └── job-dispatcher/     # Edge function source
│   └── schema.sql               # Database schema
├── docs/
│   └── SECURITY.md              # Security architecture doc
├── deploy.sh                    # Deploy guide script
├── vercel.json                  # Vercel config
├── tailwind.config.js           # Tailwind config
├── next.config.js               # Next.js config
├── package.json
└── README.md
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `AES_ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM encryption |

---

## License

MIT
