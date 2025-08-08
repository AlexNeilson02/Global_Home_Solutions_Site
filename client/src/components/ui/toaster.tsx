import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            className="anti-yellow-nuclear"
            style={{
              outline: 'none',
              outlineColor: 'transparent',
              outlineWidth: '0',
              outlineStyle: 'none',
              backgroundColor: 'white',
              color: 'black',
              border: '1px solid #e5e7eb'
            }}
          >
            <div 
              className="grid gap-1 anti-yellow-nuclear"
              style={{
                outline: 'none',
                outlineColor: 'transparent',
                color: 'black'
              }}
            >
              {title && (
                <ToastTitle 
                  className="anti-yellow-nuclear"
                  style={{
                    outline: 'none',
                    outlineColor: 'transparent',
                    color: 'black'
                  }}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription 
                  className="anti-yellow-nuclear"
                  style={{
                    outline: 'none',
                    outlineColor: 'transparent',
                    color: 'black'
                  }}
                >
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose 
              className="anti-yellow-nuclear"
              style={{
                outline: 'none',
                outlineColor: 'transparent',
                color: 'black'
              }}
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
