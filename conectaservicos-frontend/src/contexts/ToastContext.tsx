import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message: string) => toast(message, "success"),
      error: (message: string) => toast(message, "error"),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:right-4 sm:top-4 sm:items-end">
        {toasts.map((item) => {
          const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? AlertTriangle : Info;
          const tone =
            item.tone === "success"
              ? "border-success/30 bg-success-light text-success"
              : item.tone === "error"
              ? "border-danger/30 bg-danger-light text-danger"
              : "border-slate-200 bg-white text-ink";
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-xl border px-4 py-3 shadow-pop ${tone}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded p-0.5 opacity-60 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast precisa estar dentro de ToastProvider.");
  return context;
}
