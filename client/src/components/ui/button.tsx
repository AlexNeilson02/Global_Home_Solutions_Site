import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-apple text-sm font-medium transition-all duration-200 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-apple hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-apple-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-apple",
        outline:
          "border border-border bg-background hover:bg-muted hover:text-foreground shadow-apple-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-apple",
        ghost: "hover:bg-muted hover:text-foreground shadow-none hover:shadow-apple-sm",
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:scale-100 active:scale-100",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-12 px-8 py-4 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
