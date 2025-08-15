import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Button } from "./button"
import { cn } from "@/lib/utils"

const loadingButtonVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "",
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof loadingButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        className={cn(loadingButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          </div>
        )}
        <span className={loading ? "opacity-0" : "opacity-100"}>
          {loading && loadingText ? loadingText : children}
        </span>
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton, loadingButtonVariants }