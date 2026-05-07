import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-gold text-ink shadow-glow hover:bg-amber',
  secondary: 'border border-gold/35 bg-cream/10 text-cream hover:bg-cream/15',
  ghost: 'text-current hover:bg-black/5',
  danger: 'bg-wine text-white hover:bg-wine/90',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = LinkProps & {
  variant?: Variant;
  children: ReactNode;
};

export function ButtonLink({ className, variant = 'primary', ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

type ExternalButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
};

export function ExternalButton({ className, variant = 'primary', ...props }: ExternalButtonProps) {
  return (
    <a
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
