import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentHire — Hire Your Synthetic Workforce',
  description:
    'Autonomous AI agents that work 24/7, never call in sick, and cost a fraction of a human hire. Deploy in minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
