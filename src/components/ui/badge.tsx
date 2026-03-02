import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "secondary" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    success: "bg-success text-success-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input text-foreground bg-background",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium min-h-0",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
