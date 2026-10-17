import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full rounded-lg border bg-input px-3 py-2 pl-10 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

interface FormFieldProps {
  id: string;
  name?: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: ReactNode;
  icon: ReactNode;
  endContent?: ReactNode;
}

export function FormField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  hint,
  icon,
  endContent,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-muted-foreground mb-1 block text-sm">
        {label}
      </label>
      <div className="relative">
        <span
          className={cn(
            "absolute top-1/2 left-3 size-4 -translate-y-1/2",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {icon}
        </span>
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className={cn(
            inputBase,
            error
              ? "border-destructive text-destructive ring-destructive focus-visible:border-destructive focus-visible:ring-destructive"
              : "border-input",
          )}
        />
        {endContent}
      </div>
      {error ? (
        <p className="text-destructive mt-1 flex items-center gap-1 text-xs">
          <CircleAlert className="size-3" />
          {error}
        </p>
      ) : (
        hint
      )}
    </div>
  );
}
