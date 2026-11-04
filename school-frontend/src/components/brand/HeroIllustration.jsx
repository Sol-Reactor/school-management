// Original illustration: a stylised Haya dashboard card floating over a
// notebook grid — drawn with theme tokens so it adapts to light/dark.
const HeroIllustration = ({ className }) => (
  <svg viewBox="0 0 480 360" className={className} role="img" aria-labelledby="hero-ill-title">
    <title id="hero-ill-title">Illustration of Haya's attendance dashboard</title>
    <defs>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0v24" fill="none" stroke="rgb(var(--line))" strokeWidth="1" />
      </pattern>
      <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgb(var(--chart-1))" stopOpacity="0.28" />
        <stop offset="1" stopColor="rgb(var(--chart-1))" stopOpacity="0.02" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="480" height="360" rx="28" fill="url(#grid)" opacity="0.8" />

    {/* Main card */}
    <g transform="translate(48 56)">
      <rect width="300" height="200" rx="18" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
      <rect x="20" y="20" width="96" height="10" rx="5" fill="rgb(var(--ink) / 0.8)" />
      <rect x="20" y="38" width="150" height="8" rx="4" fill="rgb(var(--ink-subtle) / 0.5)" />
      <path d="M20 160 L60 140 L100 146 L140 118 L180 126 L220 96 L260 104 L280 92 L280 176 L20 176 Z" fill="url(#area)" />
      <path d="M20 160 L60 140 L100 146 L140 118 L180 126 L220 96 L260 104 L280 92" fill="none" stroke="rgb(var(--chart-1))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="280" cy="92" r="6" fill="rgb(var(--chart-1))" stroke="rgb(var(--surface))" strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1="20" x2="280" y1={80 + i * 32} y2={80 + i * 32} stroke="rgb(var(--line))" />
      ))}
    </g>

    {/* KPI chip */}
    <g transform="translate(286 30)">
      <rect width="150" height="72" rx="16" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
      <rect x="16" y="16" width="64" height="8" rx="4" fill="rgb(var(--ink-subtle) / 0.5)" />
      <text x="16" y="54" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="26" fill="rgb(var(--ink))">96%</text>
      <rect x="92" y="38" width="42" height="20" rx="10" fill="rgb(var(--success-soft))" />
      <path d="M104 52l6-6 6 6" fill="none" stroke="rgb(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Roster card */}
    <g transform="translate(250 214)">
      <rect width="190" height="112" rx="16" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(16 ${18 + i * 30})`}>
          <circle cx="10" cy="10" r="10" fill={['rgb(var(--primary-soft))', 'rgb(var(--info-soft))', 'rgb(var(--accent-soft))'][i]} />
          <rect x="28" y="6" width={[72, 88, 60][i]} height="8" rx="4" fill="rgb(var(--ink) / 0.55)" />
          <rect x="128" y="2" width="30" height="16" rx="8" fill={i === 2 ? 'rgb(var(--warning-soft))' : 'rgb(var(--success-soft))'} />
        </g>
      ))}
    </g>

    {/* Sparkle: AI insight */}
    <g transform="translate(28 250)">
      <rect width="190" height="76" rx="16" fill="rgb(var(--primary))" />
      <path d="M26 24l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="rgb(var(--on-primary))" />
      <rect x="48" y="22" width="110" height="8" rx="4" fill="rgb(var(--on-primary) / 0.9)" />
      <rect x="48" y="38" width="124" height="7" rx="3.5" fill="rgb(var(--on-primary) / 0.6)" />
      <rect x="48" y="52" width="84" height="7" rx="3.5" fill="rgb(var(--on-primary) / 0.6)" />
    </g>
  </svg>
);

export default HeroIllustration;
