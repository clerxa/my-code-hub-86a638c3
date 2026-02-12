import * as React from "react";

import { cn } from "@/lib/utils";

// Format number with space as thousands separator
const formatNumberWithSpaces = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/\s/g, "")) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString("fr-FR", { maximumFractionDigits: 10 }).replace(/,/g, " ");
};

// Parse formatted number back to raw number
const parseFormattedNumber = (value: string): string => {
  return value.replace(/\s/g, "").replace(",", ".");
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, onChange, onWheel, ...props }, ref) => {
    const isNumberType = type === "number";
    
    // For number inputs, we use text type to allow formatting
    const actualType = isNumberType ? "text" : type;
    
    // Format the displayed value for number inputs
    const displayValue = isNumberType && value !== undefined && typeof value !== "object" 
      ? formatNumberWithSpaces(value as string | number) 
      : value;
    
    // Handle change to parse formatted numbers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumberType && onChange) {
        const rawValue = parseFormattedNumber(e.target.value);
        // Only allow valid number characters
        if (rawValue === "" || rawValue === "-" || !isNaN(Number(rawValue))) {
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: rawValue,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      } else if (onChange) {
        onChange(e);
      }
    };
    
    // Prevent wheel from changing value
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (isNumberType) {
        e.currentTarget.blur();
      }
      onWheel?.(e);
    };
    
    return (
      <input
        type={actualType}
        inputMode={isNumberType ? "decimal" : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onWheel={handleWheel}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
