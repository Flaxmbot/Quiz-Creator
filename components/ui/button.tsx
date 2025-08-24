import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-subtle hover:bg-primary/90", // Added shadow-subtle
        destructive:
          "bg-destructive text-destructive-foreground shadow-subtle hover:bg-destructive/90", // Added shadow-subtle
        outline:
          "border border-input bg-background shadow-subtle hover:bg-accent hover:text-accent-foreground", // Added shadow-subtle
        secondary:
          "bg-secondary text-secondary-foreground shadow-subtle hover:bg-secondary/80", // Added shadow-subtle
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm sm:h-10 sm:px-4 sm:py-2 md:h-11 md:px-6 md:py-3 md:text-base", // Responsive default
        sm: "h-9 rounded-md px-3 text-sm", // Keep sm as is, it's already small
        lg: "h-11 px-8 py-2 text-base sm:h-12 sm:px-10 sm:py-3 md:h-14 md:px-12 md:py-4 md:text-lg", // Responsive lg
        icon: "h-10 w-10", // Keep icon as is
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
