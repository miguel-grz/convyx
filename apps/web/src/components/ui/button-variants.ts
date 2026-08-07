import { cva } from 'class-variance-authority';

/**
 * Buttons say what they do, in sentence case, at a size you can hit. The primary
 * action is the only filled control on any screen, so "which one starts the job"
 * is never a question.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:!bg-bg-raised disabled:!text-fg-subtle disabled:!border-line disabled:!shadow-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-fg shadow-soft hover:bg-brand-hover',
        secondary:
          'border-line-strong bg-bg-panel text-fg hover:bg-bg-raised hover:border-fg-subtle border',
        ghost: 'text-fg-muted hover:bg-bg-raised hover:text-fg',
        danger: 'bg-danger text-white hover:brightness-110',
      },
      size: {
        sm: 'h-8 px-3 text-[0.8125rem]',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-[0.9375rem]',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
