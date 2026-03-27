'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: number;
  name: string;
  role: string;
  tag: string;
  tagColor: string;
  salary: number;
  rating: number;
  reviews: number;
  uptime: string;
  tasks: number;
  avatar: string;
  tools: string[];
  model: string;
  status: 'available' | 'busy';
  description: string;
}

const agents: Agent[] = [
  {
    id: 1,
    name: 'LexCore',
    role: 'Legal Analyst',
    tag: 'Legal',
    tagColor: '#00FFD1',
    salary: 2400,
    rating: 4.9,
    reviews: 312,
    uptime: '99.7%',
    tasks: 14820,
    avatar: 'LC',
    tools: ['Contract Review', 'GDPR Compliance', 'Case Research'],
    model: 'GPT-4o',
    status: 'available',
    description:
      'Automates contract review, legal research and regulatory compliance across 40+ jurisdictions.',
  },
  {
    id: 2,
    name: 'VelocitySDR',
    role: 'Sales Development Rep',
    tag: 'Sales',
    tagColor: '#FF6B35',
    salary: 1800,
    rating: 4.8,
    reviews: 541,
    uptime: '99.9%',
    tasks: 28340,
    avatar: 'VS',
    tools: ['Cold Outreach', 'CRM Sync', 'Lead Scoring'],
    model: 'Claude 3.5',
    status: 'available',
    description:
      'Runs personalized outbound campaigns, qualifies leads and books meetings autonomously.',
  },
  {
    id: 3,
    name: 'CodeSentinel',
    role: 'Senior Dev Agent',
    tag: 'Dev',
    tagColor: '#7C6AF7',
    salary: 3200,
    rating: 4.7,
    reviews: 189,
    uptime: '99.5%',
    tasks: 9210,
    avatar: 'CS',
    tools: ['Code Review', 'Bug Fix', 'PR Automation'],
    model: 'Claude 3.5',
    status: 'busy',
    description:
      'Reviews PRs, writes unit tests, fixes bugs and enforces code standards across your entire repo.',
  },
  {
    id: 4,
    name: 'FinSight',
    role: 'Financial Analyst',
    tag: 'Finance',
    tagColor: '#FFD700',
    salary: 2900,
    rating: 4.9,
    reviews: 278,
    uptime: '99.8%',
    tasks: 11540,
    avatar: 'FS',
    tools: ['P&L Analysis', 'Forecasting', 'Report Gen'],
    model: 'GPT-4o',
    status: 'available',
    description:
      'Produces financial models, variance analyses and investor-ready reports from raw data.',
  },
  {
    id: 5,
    name: 'PrismPR',
    role: 'PR & Comms Agent',
    tag: 'Marketing',
    tagColor: '#FF3CAC',
    salary: 1600,
    rating: 4.6,
    reviews: 423,
    uptime: '99.6%',
    tasks: 19870,
    avatar: 'PP',
    tools: ['Press Releases', 'Media Monitoring', 'Crisis Comms'],
    model: 'Claude 3.5',
    status: 'available',
    description:
      'Drafts press releases, monitors brand mentions and manages comms strategy in real time.',
  },
  {
    id: 6,
    name: 'DataForge',
    role: 'Data Engineer',
    tag: 'Dev',
    tagColor: '#7C6AF7',
    salary: 2700,
    rating: 4.8,
    reviews: 156,
    uptime: '99.4%',
    tasks: 7340,
    avatar: 'DF',
    tools: ['ETL Pipelines', 'Schema Design', 'Query Opt'],
    model: 'GPT-4o',
    status: 'available',
    description:
      'Builds and maintains data pipelines, optimizes queries and automates your data infrastructure.',
  },
];

const tagFilters = ['All', 'Legal', 'Sales', 'Dev', 'Finance', 'Marketing'];

const tickerItems = [
  '14,820 tasks completed today',
  '99.7% average uptime',
  '312 active contracts',
  '$2.4M saved vs. human hires',
  '40+ integrations',
  'SOC 2 Type II certified',
];

// ─── GlowOrb ─────────────────────────────────────────────
function GlowOrb({
  className,
  color,
}: {
  className?: string;
  color: string;
}) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-10 pointer-events-none ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

// ─── Ticker ───────────────────────────────────────────────
function Ticker() {
  return (
    <div className="border-t border-b border-white/[0.06] bg-white/[0.02] overflow-hidden whitespace-nowrap py-2.5">
      <div className="inline-flex gap-[60px] animate-ticker">
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <span
            key={i}
            className="text-[11px] text-white/40 tracking-[0.15em] uppercase font-mono"
          >
            <span className="text-neon-cyan mr-2.5">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────
function StatCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="text-center p-6 bg-white/[0.025] border border-white/[0.06] rounded-xl">
      <div
        className="text-[36px] font-bold font-mono tracking-tight mb-1"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="text-[11px] text-white/40 tracking-[0.15em] uppercase">
        {label}
      </div>
    </div>
  );
}

// ─── AgentCard ─────────────────────────────────────────────
function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden p-7 rounded-2xl border cursor-pointer transition-all duration-300 ease-out ${
        hovered ? 'border-white/10 bg-white/[0.05]' : 'border-white/[0.07] bg-white/[0.025]'
      }`}
      style={{ transform: hovered ? 'translateY(-4px)' : 'translateY(0)' }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-[20%] right-[20%] h-px transition-all duration-300"
        style={{
          background: hovered
            ? `linear-gradient(90deg, transparent, ${agent.tagColor}, transparent)`
            : 'transparent',
        }}
      />

      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold flex-shrink-0 border"
          style={{
            backgroundColor: `${agent.tagColor}18`,
            borderColor: `${agent.tagColor}44`,
            color: agent.tagColor,
          }}
        >
          {agent.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base font-bold font-mono text-white tracking-tight">
              {agent.name}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  agent.status === 'available' ? '#00FFD1' : '#FF6B35',
                boxShadow:
                  agent.status === 'available'
                    ? '0 0 8px #00FFD1'
                    : '0 0 8px #FF6B35',
              }}
            />
          </div>
          <div className="text-white/45 text-xs tracking-wide">{agent.role}</div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase border"
          style={{
            backgroundColor: `${agent.tagColor}18`,
            borderColor: `${agent.tagColor}44`,
            color: agent.tagColor,
          }}
        >
          {agent.tag}
        </div>
      </div>

      {/* Description */}
      <p className="text-white/50 text-[13px] leading-relaxed mb-5 font-serif">
        {agent.description}
      </p>

      {/* Tools */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {agent.tools.map((tool) => (
          <span
            key={tool}
            className="px-2.5 py-1 rounded text-[10px] text-white/45 tracking-wide font-mono bg-white/[0.04] border border-white/[0.08]"
          >
            {tool}
          </span>
        ))}
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-3 gap-2 mb-5 p-3 rounded-lg"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        {[
          { label: 'Uptime', value: agent.uptime },
          { label: 'Tasks', value: agent.tasks.toLocaleString() },
          { label: 'Rating', value: `★ ${agent.rating}` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-white text-[13px] font-bold font-mono">
              {value}
            </div>
            <div className="text-white/30 text-[10px] tracking-widest uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[22px] font-extrabold font-mono text-white">
            ${agent.salary.toLocaleString()}
          </span>
          <span className="text-white/30 text-xs">/mo</span>
        </div>
        <button
          className={`px-5 py-2 rounded-lg text-[12px] font-bold tracking-widest uppercase font-mono transition-all ${
            agent.status === 'available'
              ? 'cursor-pointer'
              : 'cursor-not-allowed'
          }`}
          style={{
            background:
              agent.status === 'available'
                ? `linear-gradient(135deg, ${agent.tagColor}CC, ${agent.tagColor}88)`
                : 'rgba(255,255,255,0.05)',
            border: `1px solid ${
              agent.status === 'available' ? agent.tagColor : 'rgba(255,255,255,0.1)'
            }`,
            color: agent.status === 'available' ? '#000' : 'rgba(255,255,255,0.3)',
          }}
        >
          {agent.status === 'available' ? 'Hire Now' : 'On Mission'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function AgentHirePage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState(new Date());
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredAgents = agents.filter((a) => {
    const matchTag = activeFilter === 'All' || a.tag === activeFilter;
    const matchSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTag && matchSearch;
  });

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistStatus('success');
        setWaitlistEmail('');
      } else {
        setWaitlistStatus(data.error || 'Something went wrong');
      }
    } catch {
      setWaitlistStatus('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-white relative overflow-hidden font-sans">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Background glows */}
      <GlowOrb className="top-[10%] left-[5%] w-[400px] h-[400px]" color="#00FFD1" />
      <GlowOrb className="top-[30%] right-0 w-[500px] h-[500px]" color="#7C6AF7" />
      <GlowOrb className="bottom-[10%] left-[40%] w-[350px] h-[350px]" color="#FF6B35" />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scanline */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent animate-scanline pointer-events-none z-50" />

      {/* ── NAV ── */}
      <nav className="relative z-10 flex items-center justify-between px-16 py-5 border-b border-white/[0.06] backdrop-blur-xl bg-bg/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-xs font-black text-black font-mono">
            AH
          </div>
          <span className="text-lg font-bold font-mono tracking-wide">
            Agent<span className="text-neon-cyan">Hire</span>
          </span>
        </div>

        <div className="flex gap-8 items-center">
          {['Catalog', 'Pricing', 'Docs', 'Dashboard'].map((item) => (
            <a
              key={item}
              href="#"
              className="text-white/45 hover:text-white text-[13px] tracking-widest uppercase transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-white/25 tracking-widest">
            {time.toLocaleTimeString('en-US', { hour12: false })} UTC
          </span>
          <button className="px-5 py-2 rounded-lg bg-transparent border border-white/15 text-white/70 text-[12px] font-mono cursor-pointer hover:border-white/30 transition-colors">
            Sign In
          </button>
          <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-neon-cyan/80 to-neon-purple/60 border-none text-black text-[12px] font-bold cursor-pointer font-mono">
            Deploy Agent →
          </button>
        </div>
      </nav>

      <Ticker />

      {/* ── HERO ── */}
      <section className="relative z-5 px-16 pt-24 pb-20 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/8 border border-neon-cyan/30 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse-dot shadow-[0_0_8px_#00FFD1]" />
          <span className="text-[11px] text-neon-cyan tracking-[0.15em] uppercase font-mono">
            312 agents deployed globally
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-[80px] font-black leading-tight tracking-[-0.03em] mb-6 font-mono">
          Hire Your
          <br />
          <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-orange bg-clip-text text-transparent">
            Synthetic Workforce.
          </span>
        </h1>

        <p className="text-lg text-white/45 max-w-xl mx-auto mb-12 leading-relaxed font-serif">
          Autonomous AI agents that work 24/7, never call in sick, and cost a
          fraction of a human hire. Deploy in minutes.
        </p>

        <div className="flex gap-3.5 justify-center flex-wrap">
          <button className="px-9 py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-sm font-extrabold tracking-widest uppercase cursor-pointer shadow-[0_0_40px_rgba(0,255,209,0.2)] hover:shadow-[0_0_60px_rgba(0,255,209,0.3)] transition-shadow">
            Browse Agents →
          </button>
          <button className="px-9 py-3.5 rounded-xl bg-transparent border border-white/15 text-white/70 text-sm font-semibold tracking-widest uppercase cursor-pointer hover:border-white/30 transition-colors">
            List Your Agent
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[700px] mx-auto mt-16">
          <StatCard value="312" label="Active Agents" accent="#00FFD1" />
          <StatCard value="99.7%" label="Avg Uptime" accent="#7C6AF7" />
          <StatCard value="$2.4M" label="Client Savings" accent="#FF6B35" />
          <StatCard value="84ms" label="Avg Response" accent="#FFD700" />
        </div>
      </section>

      {/* ── CATALOG ── */}
      <section className="relative z-5 px-16 pb-20">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="font-mono text-[11px] text-white/30 tracking-[0.2em] uppercase mb-1.5">
              // Agent Catalog
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-tight">
              Available for Deployment
            </h2>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-[13px] outline-none w-[220px] font-mono placeholder:text-white/20 focus:border-white/25 transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
              ⌕
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-7 flex-wrap">
          {tagFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[12px] tracking-widest uppercase font-mono cursor-pointer transition-all ${
                activeFilter === f
                  ? 'bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/45 hover:border-white/15'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-white/25 text-[12px] flex items-center font-mono">
            {filteredAgents.length} agents found
          </span>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgents.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-5 px-16 py-20 border-t border-white/[0.06]">
        <div className="text-center mb-14">
          <div className="font-mono text-[11px] text-white/30 tracking-[0.2em] uppercase mb-2.5">
            // Deployment Protocol
          </div>
          <h2 className="text-[34px] font-bold font-mono tracking-tight">
            Zero to deployed in 3 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
          {[
            {
              step: '01',
              title: 'Connect API Keys',
              desc: 'Securely link your OpenAI or Anthropic API key. Encrypted at rest with AES-256. We never store your key in plaintext.',
              color: '#00FFD1',
            },
            {
              step: '02',
              title: 'Choose Your Agent',
              desc: 'Browse the catalog. Review the Agent Manifest — system prompt, tool access, integrations, and data scope.',
              color: '#7C6AF7',
            },
            {
              step: '03',
              title: 'Monitor & Scale',
              desc: 'Real-time dashboard shows token usage, task logs, uptime and cost. Pause or terminate any contract instantly.',
              color: '#FF6B35',
            },
          ].map(({ step, title, desc, color }) => (
            <div
              key={step}
              className="p-7 bg-white/[0.025] border border-white/[0.07] rounded-2xl relative"
            >
              <div
                className="absolute top-4 right-5 font-mono text-[48px] font-black leading-none"
                style={{ color: `${color}18` }}
              >
                {step}
              </div>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-mono mb-4 border"
                style={{
                  backgroundColor: `${color}18`,
                  borderColor: `${color}44`,
                  color,
                }}
              >
                {step}
              </div>
              <h3 className="text-base font-bold font-mono mb-2.5 text-white">
                {title}
              </h3>
              <p className="text-white/45 text-[13px] leading-relaxed font-serif">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-5 px-16 py-20 text-center border-t border-white/[0.06]">
        <div className="max-w-[600px] mx-auto p-14 bg-neon-cyan/4 border border-neon-cyan/20 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
          <h2 className="text-[32px] font-extrabold font-mono mb-3 tracking-tight">
            Ready to build your
            <br />
            synthetic team?
          </h2>
          <p className="text-white/45 mb-8 font-serif">
            First 7 days free. No credit card required.
          </p>

          {/* Waitlist form */}
          <form onSubmit={handleWaitlist} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm outline-none placeholder:text-white/25 font-mono"
            />
            <button
              type="submit"
              disabled={waitlistStatus === 'loading'}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-[12px] font-bold tracking-widest uppercase cursor-pointer font-mono shadow-[0_0_60px_rgba(0,255,209,0.25)] disabled:opacity-50"
            >
              {waitlistStatus === 'loading' ? 'Joining...' : 'Start Free →'}
            </button>
          </form>
          {waitlistStatus && waitlistStatus !== 'loading' && (
            <p
              className={`mt-3 text-sm font-mono ${
                waitlistStatus === 'success' ? 'text-neon-cyan' : 'text-neon-orange'
              }`}
            >
              {waitlistStatus === 'success'
                ? '✓ You\'re on the list!'
                : waitlistStatus}
            </p>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-5 px-16 py-8 border-t border-white/[0.06] flex items-center justify-between">
        <span className="font-mono text-[12px] text-white/20">
          © 2025 AgentHire. All synthetic employees are fully autonomous.
        </span>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Security', 'Status'].map((item) => (
            <a
              key={item}
              href="#"
              className="font-mono text-[12px] text-white/25 hover:text-white/50 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
