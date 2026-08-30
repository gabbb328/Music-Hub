import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Sparkles, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-6 right-6 z-[100] flex max-h-screen w-full flex-col p-0 sm:bottom-6 sm:right-6 sm:top-auto sm:flex-col md:max-w-[380px] pointer-events-none gap-3",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// Signature Goey-Toast Dark Rounded Pill Design with Black/Dark Borders
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-full border border-black/80 bg-neutral-950/95 px-5 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full sm:data-[state=open]:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default:
          "border-black/90 bg-neutral-950/95 text-white ring-1 ring-white/10 shadow-[0_10px_38px_rgba(0,0,0,0.8)]",
        destructive:
          "border-rose-950/80 bg-neutral-950/95 text-rose-100 ring-1 ring-rose-500/30 shadow-[0_10px_38px_rgba(225,29,72,0.35)]",
        success:
          "border-emerald-950/80 bg-neutral-950/95 text-emerald-100 ring-1 ring-emerald-500/30 shadow-[0_10px_38px_rgba(16,185,129,0.35)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {/* Morphing Gooey Liquid Blob Elements */}
      <span className="absolute -top-3 -right-3 w-12 h-12 bg-primary/25 rounded-full blur-lg animate-pulse pointer-events-none" />
      <span
        className="absolute -bottom-3 -left-3 w-12 h-12 bg-pink-500/20 rounded-full blur-lg animate-pulse pointer-events-none"
        style={{ animationDelay: "0.8s" }}
      />
      {children}
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "rounded-full p-1 text-white/50 opacity-80 transition-opacity hover:opacity-100 hover:text-white hover:bg-white/10 focus:opacity-100 focus:outline-none shrink-0 ml-1",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-xs font-bold tracking-tight text-white leading-snug", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-[11px] text-white/70 mt-0.5 leading-tight truncate max-w-[220px]", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
