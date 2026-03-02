import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function ProgressBar({
  value,
  max,
  className,
  variant = "default",
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const variantColors = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-amber-500",
    danger: "bg-destructive",
  };

  return (
    <div className={cn("w-full bg-muted rounded-full h-2.5", className)}>
      <div
        className={cn(
          "h-2.5 rounded-full transition-all duration-500",
          variantColors[variant]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
