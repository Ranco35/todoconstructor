import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastState {
  toasts: Toast[]
}

const initialState: ToastState = {
  toasts: []
}

export function useToast() {
  const [state, setState] = useState<ToastState>(initialState)

  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newToast: Toast = {
        id,
        title,
        description,
        variant
      }

      setState((prevState) => ({
        ...prevState,
        toasts: [...prevState.toasts, newToast]
      }))

      // Auto remove after 3 seconds
      setTimeout(() => {
        setState((prevState) => ({
          ...prevState,
          toasts: prevState.toasts.filter((toast) => toast.id !== id)
        }))
      }, 3000)

      return {
        id,
        dismiss: () => {
          setState((prevState) => ({
            ...prevState,
            toasts: prevState.toasts.filter((toast) => toast.id !== id)
          }))
        }
      }
    },
    []
  )

  const dismiss = useCallback((toastId?: string) => {
    setState((prevState) => ({
      ...prevState,
      toasts: toastId
        ? prevState.toasts.filter((toast) => toast.id !== toastId)
        : []
    }))
  }, [])

  return {
    toast,
    dismiss,
    toasts: state.toasts
  }
}

// Export toast function for compatibility
export const toast = ({ title, description, variant = 'default' }: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => {
  console.log(`Toast: ${title} - ${description} (${variant})`)
} 