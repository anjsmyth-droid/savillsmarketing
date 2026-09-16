"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  color,
  className,
  size = "md",
}: {
  name: string;
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const sizeClasses = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" }[size];
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-medium text-white", sizeClasses, className)}
      style={{ backgroundColor: color ?? "var(--primary)" }}
    >
      <AvatarPrimitive.Fallback>{initials}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
