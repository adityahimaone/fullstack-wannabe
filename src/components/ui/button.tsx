import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Buttons are stickers you can push. Two rules from DESIGN.md §1:
 *   1. one flat fill, a 2.5px ink edge, a hard offset — never a blur
 *   2. press physics: the button travels *into* its own shadow
 *
 * `.press` owns the transform; the shadow distance is re-stated there so
 * hover can grow the offset to 6px and pressed can collapse it to 0.
 */
const buttonVariants = cva(
  [
    'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[12px] text-sm font-semibold tracking-[-0.01em]',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        /* Primary is the lime sticker. Text on it is fixed ink — never `ink`,
           which flips to cream in dark and lands at 1.12:1. */
        default: 'border-[2.5px] border-edge bg-primary text-primary-foreground press',
        secondary: 'border-[2.5px] border-edge bg-secondary text-secondary-foreground press-sm',
        outline: 'border-[2.5px] border-edge bg-card text-foreground press-sm',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        destructive:
          'border-[2.5px] border-edge bg-destructive text-destructive-foreground press',
        /*
         * For the night stage. These must be *utilities*, not the `.on-stage`
         * helper class: `@tailwind utilities` is emitted after components, so
         * a component-layer colour would lose to `text-primary-foreground`
         * from the base variant and render ink-on-night (invisible).
         */
        stage:
          'border-[2.5px] border-white/40 bg-transparent text-white press-sm hover:bg-white/10 hover:text-white',
        link: 'h-auto px-0 text-primary-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        xs: 'h-7 rounded-[10px] px-2.5 text-xs',
        sm: 'h-8 rounded-[10px] px-3 text-[0.8125rem]',
        lg: 'h-11 px-6 text-[0.9375rem]',
        icon: 'h-9 w-9 px-0',
        'icon-sm': 'h-7 w-7 rounded-[10px] px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
