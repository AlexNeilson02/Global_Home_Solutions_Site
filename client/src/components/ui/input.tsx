import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-apple border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-apple shadow-apple-sm hover:shadow-apple hover:border-primary/50 md:text-sm",
          className
        )}
        ref={ref}
        style={{
          pointerEvents: 'auto',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text',
          backgroundColor: '#ffffff',
          color: '#000000 !important',
          WebkitTextFillColor: '#000000 !important',
          fontSize: '16px',
          opacity: 1,
          visibility: 'visible',
          ...props.style
        }}
        onFocus={(e) => {
          console.log('Input focused:', e.target);
          props.onFocus?.(e);
        }}
        onClick={(e) => {
          console.log('Input clicked:', e.target);
          e.stopPropagation();
          props.onClick?.(e);
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
