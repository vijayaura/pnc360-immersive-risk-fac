/** Light theme tokens for Risk Room v2 — uses app `primary` / theme CSS variables. */
export const rr = {
  page: 'bg-background text-foreground text-sm antialiased',
  header: 'bg-card/95 backdrop-blur-xl border-b border-border',
  footer: 'border-t border-border bg-card',
  divider: 'border-border',
  card: 'rounded-xl border border-border bg-card shadow-sm',
  cardLg: 'rounded-2xl border border-border bg-card shadow-sm',
  panel: 'rounded-xl border border-border bg-card',
  mutedPanel: 'rounded-lg border border-border bg-muted/50',
  input:
    'border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary outline-none',
  heading: 'font-bold text-foreground tracking-tight',
  pageTitle: 'text-base font-bold text-foreground',
  sectionTitle: 'text-xl font-bold tracking-tight text-foreground md:text-2xl',
  subtext: 'text-xs text-foreground',
  body: 'text-xs text-foreground leading-relaxed',
  labelCaps: 'text-xs font-semibold uppercase tracking-wider text-foreground',
  link: 'text-primary hover:text-primary/80',
  /** Solid primary fills — always pair with `text-primary-foreground` (set per theme). */
  solidPrimary: 'border-primary bg-primary text-primary-foreground',
  tabActive: 'border-primary bg-primary text-primary-foreground shadow-sm',
  tabIdle: 'border-border bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground',
  layerIdle:
    'border-border bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground',
  layerActive: 'ring-2 ring-primary/25 border-primary bg-primary text-primary-foreground',
  progressTrack: 'bg-muted',
  progressFill: 'bg-primary',
  mapFrame: 'rounded-2xl border border-border bg-muted shadow-sm',
  mapOverlay: 'bg-gradient-to-b from-background/95 via-background/75 to-transparent',
  timeline: 'border-t border-slate-800 bg-[#0f1419] text-slate-100',
  timelineLabel: 'text-xs font-semibold uppercase tracking-wider text-slate-300',
  timelineMuted: 'text-xs text-slate-400',
  decisionRail: 'border-t border-slate-800 bg-[#0f1419] text-slate-100',
  decisionSecondary:
    'border border-slate-700 bg-slate-800/80 text-slate-200 shadow-sm hover:border-slate-600 hover:bg-slate-800 hover:text-white',
} as const;
