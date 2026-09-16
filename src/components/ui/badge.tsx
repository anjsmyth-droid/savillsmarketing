import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-sunken border-border text-foreground",
        primary: "bg-primary/10 border-primary/20 text-primary",
        accent: "bg-accent-soft border-accent/30 text-accent-foreground",
        success: "bg-success-soft border-success/20 text-success",
        warning: "bg-warning-soft border-warning/20 text-warning",
        danger: "bg-danger-soft border-danger/20 text-danger",
        info: "bg-info-soft border-info/20 text-info",
        outline: "bg-transparent border-border-strong text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
