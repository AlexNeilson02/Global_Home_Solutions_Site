// client/src/components/ui/toaster.tsx
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            // 👉 toast item is interactive and has its own background
            className="pointer-events-auto bg-white text-gray-900 border border-gray-200 shadow-md"
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}

      {/* 👉 viewport/container is transparent and not clickable when empty */}
      <ToastViewport className="
        fixed top-4 right-4 z-[100]
        flex max-h-screen w-full max-w-sm flex-col gap-2
        bg-transparent shadow-none pointer-events-none
      " />
    </ToastProvider>
  )
}

export default Toaster
