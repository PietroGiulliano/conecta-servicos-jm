import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertTriangle, Inbox, Loader2, Star } from "lucide-react";
import type { Tone } from "@/utils/status";

// ── Button ──────────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
  secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-sm",
  outline: "border border-slate-300 bg-white text-ink hover:border-primary hover:text-primary",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, className = "", children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-card ${className}`}>{children}</div>;
}

export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  info: "bg-primary-light text-primary ring-primary/20",
  success: "bg-success-light text-success ring-success/20",
  warning: "bg-warning-light text-amber-700 ring-warning/30",
  danger: "bg-danger-light text-danger ring-danger/20",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ── Campos de formulário ────────────────────────────────────────────────────
export function Field({
  label,
  error,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

const fieldBase =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-slate-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className = "", invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`${fieldBase} h-11 ${invalid ? "border-danger focus:border-danger" : "border-slate-300 focus:border-primary"} ${className}`}
        {...props}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className = "", invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`${fieldBase} h-11 ${invalid ? "border-danger" : "border-slate-300 focus:border-primary"} ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className = "", invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${fieldBase} min-h-[112px] py-2.5 ${invalid ? "border-danger" : "border-slate-300 focus:border-primary"} ${className}`}
        {...props}
      />
    );
  }
);

// ── Estados de carregamento, vazio e erro ───────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-6 w-3/4" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </Card>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-danger/20 bg-danger-light/50 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-danger" aria-hidden />
      <p className="max-w-md text-sm font-medium text-ink">{message}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

// ── Estrelas ────────────────────────────────────────────────────────────────
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Avaliação ${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={size}
          height={size}
          className={star <= Math.round(value) ? "fill-warning text-warning" : "text-slate-300"}
          aria-hidden
        />
      ))}
    </span>
  );
}
