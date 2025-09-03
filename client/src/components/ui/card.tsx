import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-apple bg-white text-card-foreground shadow-apple-md border border-border transition-all duration-300 ease-apple hover:shadow-apple-lg hover:-translate-y-1",
      className
    )}
    style={{
      backgroundColor: '#ffffff !important',
      background: '#ffffff',
      backgroundImage: 'none',
      ...props.style
    }}
    {...props}
  />
))
Card.displayName = "Card"

// JavaScript-level style forcing to guarantee white background
if (typeof window !== 'undefined') {
  // Force all card elements to be white on mount and DOM changes
  const forceCardWhite = () => {
    const cards = document.querySelectorAll('.card, [data-radix-card], [data-card], [class*="card"]:not(.card-content):not(.card-header):not(.card-title):not(.card-description)');
    cards.forEach((card: Element) => {
      const htmlCard = card as HTMLElement;
      htmlCard.style.setProperty('background-color', '#ffffff', 'important');
      htmlCard.style.setProperty('background', '#ffffff', 'important'); 
      htmlCard.style.setProperty('background-image', 'none', 'important');
    });
  };
  
  // Run immediately and on DOM changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceCardWhite);
  } else {
    setTimeout(forceCardWhite, 0);
  }
  
  // Monitor for new cards
  const observer = new MutationObserver(forceCardWhite);
  observer.observe(document.body, { childList: true, subtree: true });
}

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-8", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-gray-700 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-8 pb-8", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-8 pb-8", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
