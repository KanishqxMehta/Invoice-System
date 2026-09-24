// lib/toast.ts
// Universal, event-driven toast notification utility for the cafe POS system.

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastPayload {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export const toast = {
  show: (message: string, type: ToastType = "info", duration = 3500) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<ToastPayload>("app-toast", {
          detail: {
            id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            message,
            type,
            duration,
          },
        })
      );
    }
  },
  success: (message: string, duration = 3500) => toast.show(message, "success", duration),
  error: (message: string, duration = 4000) => toast.show(message, "error", duration),
  warning: (message: string, duration = 3500) => toast.show(message, "warning", duration),
  info: (message: string, duration = 3500) => toast.show(message, "info", duration),
};
