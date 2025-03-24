import * as React from "react"

const TOAST_PROVIDER_NAME = "ToastProvider"
const TOAST_VIEWPORT_NAME = "ToastViewport"
const TOAST_NAME = "Toast"
const TOAST_TITLE_NAME = "ToastTitle"
const TOAST_DESCRIPTION_NAME = "ToastDescription"
const TOAST_CLOSE_NAME = "ToastClose"

type ToastElement = React.ElementRef<"div">
type ToastProviderElement = React.ElementRef<"div">
type ToastProps = React.ComponentPropsWithoutRef<"div"> & {
  variant?: "default" | "destructive"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const ToastProvider = (props: React.ComponentPropsWithoutRef<"div">) => (
  <div className="toast-provider" {...props} />
)
ToastProvider.displayName = TOAST_PROVIDER_NAME

const ToastViewport = React.forwardRef<
  ToastElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className="toast-viewport fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    {...props}
  />
))
ToastViewport.displayName = TOAST_VIEWPORT_NAME

const Toast = React.forwardRef<ToastElement, ToastProps>(
  ({ className, variant = "default", open, onOpenChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`toast group relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all ${
          variant === "default" ? "border-gray-200 bg-white text-gray-950" : ""
        } ${
          variant === "destructive"
            ? "destructive group border-red-500 bg-red-500 text-white"
            : ""
        }`}
        data-open={open ? "true" : "false"}
        {...props}
      />
    )
  }
)
Toast.displayName = TOAST_NAME

const ToastTitle = React.forwardRef<
  ToastElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className="text-sm font-semibold"
    {...props}
  />
))
ToastTitle.displayName = TOAST_TITLE_NAME

const ToastDescription = React.forwardRef<
  ToastElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className="text-sm opacity-90"
    {...props}
  />
))
ToastDescription.displayName = TOAST_DESCRIPTION_NAME

const ToastClose = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className="absolute right-2 top-2 rounded-md p-1 text-gray-950/50 opacity-70 hover:text-gray-950 hover:opacity-100 focus:opacity-100 focus:outline-none group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50"
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
    <span className="sr-only">Close</span>
  </button>
))
ToastClose.displayName = TOAST_CLOSE_NAME

export {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
}