"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, required, options, placeholder, ...props }, ref) => {
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
        <div className="relative">
          <select
            className={cn(
              "w-full px-3 py-2 pr-8 text-sm bg-surface border-[1.5px] border-border rounded-[var(--radius)] transition-all duration-150 appearance-none cursor-pointer",
              "hover:border-muted-2",
              "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-ring",
              error && "border-danger focus:border-danger focus:ring-danger-light",
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
