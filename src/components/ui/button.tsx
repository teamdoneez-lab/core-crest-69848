import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98] active:shadow-sm focus:ring-primary/40",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/95 hover:scale-[1.02] active:scale-[0.98] active:shadow-sm focus:ring-destructive/40",
        outline: "border-2 border-border/60 bg-background/50 backdrop-blur-sm text-foreground hover:bg-accent/5 hover:border-primary/30 hover:scale-[1.02] active:scale-[0.98] focus:ring-primary/30 focus:border-primary/40",
        secondary: "bg-secondary/80 text-secondary-foreground shadow-sm hover:bg-secondary hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:ring-secondary/50",
        ghost: "hover:bg-accent/8 hover:text-accent-foreground active:bg-accent/12 focus:ring-accent/30",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 focus:ring-primary/30",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
