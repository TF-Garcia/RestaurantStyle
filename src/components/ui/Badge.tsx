import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold', className)}
      {...props}
    />
  );
}
