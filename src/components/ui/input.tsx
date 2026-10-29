import * as React from 'react';
import { cn } from '@/lib/utils';

/*
 * A field is the one place in the system with no offset — it is a hole cut in
 * the paper, not a sticker on it. The edge is 2.5px like everything else, and
 * focus swaps that edge to grape and adds a hard 3px offset. No blur.
 */
const field =
  'w-full rounded-[12px] border-[2.5px] border-edge bg-elevated text-foreground ' +
  'transition-[border-color,box-shadow] duration-150 ' +
  'placeholder:text-muted-foreground ' +
  'focus-visible:border-grape focus-visible:shadow-[3px_3px_0_0_var(--grape)] focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn('flex h-9 px-3 py-1 text-sm', field, className)} {...props} />
  ),
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] resize-y px-3 py-2 font-mono text-[0.8125rem] leading-relaxed',
      field,
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Input, Textarea };
