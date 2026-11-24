import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn text-sm font-semibold transition-[background-color,color,box-shadow,transform,border-color] duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand text-white shadow-sm hover:bg-brand-dark hover:shadow-glow",
        navy: "bg-navy text-white hover:bg-navy-700",
        outline: "border border-input bg-white text-ink hover:border-brand hover:text-brand",
        ghost: "text-ink hover:bg-slate-100",
        "outline-light": "border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/15",
        whatsapp: "bg-[#128C7E] text-white hover:bg-[#0e6f64]",
        destructive: "bg-destructive text-white hover:bg-red-700",
        link: "text-brand underline-offset-4 hover:underline px-0",
      },
      size: { default: "h-11 px-5", sm: "h-9 px-3.5 text-[13px]", lg: "h-12 px-7 text-base", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
export { Button, buttonVariants };
