'use client';

import { useState } from 'react';

export interface Agent {
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

export default function AgentCard({
  agent,
  index = 0,
}: {
  agent: Agent;
  index?: number;
}) {
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
            agent.status === 'available' ? 'cursor-pointer' : 'cursor-not-allowed'
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
