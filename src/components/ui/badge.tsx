import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badges are chips: a hairline ink edge and a flat tint. The tinted variants
 * use the *ink* form of each candy for the text, because the bright candy on
 * cream paper is 1.2–3.6:1 and this is text, not a fill.
 */
const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
    'font-mono text-2xs uppercase tracking-[0.09em]',
    'transition-colors',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'border-[1.5px] border-edge bg-primary text-primary-foreground',
        secondary: 'border-[1.5px] border-edge bg-elevated text-foreground',
        outline: 'border-[1.5px] border-border text-muted-foreground',
        lime: 'border-[1.5px] border-primary-ink/35 bg-lime/20 text-primary-ink',
        amber: 'border-[1.5px] border-reward-ink/35 bg-mango/20 text-mango-ink',
        violet: 'border-[1.5px] border-violet-ink/35 bg-grape/12 text-grape-ink',
        /*
         * `text-destructive` is the FILL colour. On its own 10% tint it lands
         * at 4.1:1 — close enough to look fine and still fail. The ink form is
         * the same hue with the lightness pushed until it reads.
         */
        destructive: 'border-[1.5px] border-destructive/40 bg-destructive/10 text-danger-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
