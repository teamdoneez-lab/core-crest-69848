import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md",
        secondary: "border-transparent bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:shadow-md",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md",
        outline: "text-foreground border-border/60 bg-background/50 backdrop-blur-sm hover:bg-accent/5 hover:border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
