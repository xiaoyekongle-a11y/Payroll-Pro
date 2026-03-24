"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold text-sm rounded-[var(--radius)] transition-all duration-150 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white border border-primary-hover shadow-[0_1px_3px_rgba(26,86,219,0.25)] hover:bg-primary-hover hover:shadow-[0_3px_8px_rgba(26,86,219,0.35)] hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-surface text-ink-sub border border-border shadow-xs hover:bg-surface-2 hover:border-muted-2 hover:text-ink hover:-translate-y-0.5 active:translate-y-0",
        success:
          "bg-success text-white border border-[#096633] shadow-[0_1px_3px_rgba(13,122,62,0.25)] hover:bg-[#096633] hover:shadow-[0_3px_8px_rgba(13,122,62,0.35)] hover:-translate-y-0.5 active:translate-y-0",
        danger:
          "bg-danger text-white border border-[#a82818] shadow-[0_1px_3px_rgba(192,50,26,0.25)] hover:bg-[#a82818] hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "bg-transparent text-muted border-transparent hover:bg-surface-3 hover:text-ink",
      },
      size: {
        sm: "min-h-[30px] px-3 text-xs",
        default: "min-h-[36px] px-4",
        lg: "min-h-[44px] px-6 text-base",
        icon: "min-h-[36px] w-[36px] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
