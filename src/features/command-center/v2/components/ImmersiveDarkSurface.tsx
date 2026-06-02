import React from 'react';

/** Remaps stray light utilities inside immersive assess panels. */
export function ImmersiveDarkSurface({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        'text-slate-100',
        '[&_.border-slate-200]:border-slate-700/80',
        '[&_.border-slate-100]:border-slate-800',
        '[&_.bg-white]:bg-slate-900/90',
        '[&_.bg-slate-50]:bg-slate-800/50',
        '[&_.bg-slate-100]:bg-slate-800/70',
        '[&_.text-slate-900]:text-slate-100',
        '[&_.text-slate-800]:text-slate-200',
        '[&_.text-slate-700]:text-slate-300',
        '[&_.text-slate-600]:text-slate-400',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
