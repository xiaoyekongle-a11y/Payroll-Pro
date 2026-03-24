"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, required, type, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-ink-sub">
            {label}
            {required && <span className="text-danger">*</span>}
            {hint && (
              <span className="text-[0.6rem] font-normal normal-case tracking-normal text-muted-2">
                {hint}
              </span>
            )}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "w-full px-3 py-2 text-sm bg-surface border-[1.5px] border-border rounded-[var(--radius)] transition-all duration-150",
            "placeholder:text-muted-2",
            "hover:border-muted-2",
            "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-ring",
            type === "number" && "text-right font-mono",
            error && "border-danger focus:border-danger focus:ring-danger-light",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
