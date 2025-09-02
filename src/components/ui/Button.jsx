import React from 'react';
import { cn } from '../../lib/utils.js';

export default function Button({ as = 'button', className, variant = 'default', ...props }) {
  const Comp = as;
  const base =
    'inline-flex items-center rounded-md text-xs sm:text-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30';
  const variants = {
    default: 'bg-accent text-white hover:opacity-90 px-3 py-1',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-2.5 py-1',
    ghost: 'text-slate-700 hover:bg-slate-100 px-2 py-1',
  };
  return <Comp className={cn(base, variants[variant], className)} {...props} />;
}
