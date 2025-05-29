import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-apple text-sm font-semibold transition-all duration-200 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-apple hover:scale-105 active:scale-95 border",
  {
    variants: {
      variant: {
        default: "bg-primary text-white border-primary hover:bg-primary/90 hover:border-primary/90 shadow-apple-md font-semibold",
        destructive:
          "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 shadow-apple font-semibold",
        outline:
          "border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white shadow-apple-sm font-semibold",
        secondary:
          "bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300 hover:border-gray-400 shadow-apple font-semibold",
        ghost: "border-transparent bg-transparent text-gray-900 hover:bg-gray-100 hover:border-gray-200 shadow-none hover:shadow-apple-sm font-semibold",
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:scale-100 active:scale-100 border-transparent font-medium",
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
