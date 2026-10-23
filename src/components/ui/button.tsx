import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--lime)_40%,transparent),0_6px_18px_-10px_var(--lime)] hover:brightness-105',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
        outline:
          'border border-border bg-transparent text-foreground hover:border-muted-foreground/60 hover:bg-elevated',
        ghost: 'text-muted-foreground hover:bg-elevated hover:text-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        xs: 'h-7 px-2.5 text-xs rounded-sm',
        sm: 'h-8 px-3 text-[0.8125rem]',
        lg: 'h-11 px-6 text-[0.9375rem]',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7 rounded-sm',
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
