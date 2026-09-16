"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-full bg-accent transition-transform duration-300", indicatorClassName)}
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
