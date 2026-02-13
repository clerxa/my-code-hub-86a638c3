import { useTheme as useNextTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useNextTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "bg-gradient-to-r from-primary via-secondary to-accent",
        isDark 
          ? "shadow-[0_0_15px_hsl(var(--secondary)/0.4)]" 
          : "shadow-[0_0_15px_hsl(var(--primary)/0.3)]",
        className
      )}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {/* Glow effect behind the toggle */}
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 transition-opacity duration-500"
      />
      
      {/* Track icons */}
      <Sun 
        className={cn(
          "absolute left-1.5 h-4 w-4 transition-all duration-500",
          isDark ? "opacity-40 scale-75 text-accent/70" : "opacity-100 scale-100 text-white"
        )} 
      />
      <Moon 
        className={cn(
          "absolute right-1.5 h-4 w-4 transition-all duration-500",
          isDark ? "opacity-100 scale-100 text-white" : "opacity-40 scale-75 text-secondary/70"
        )} 
      />
      
      {/* Sliding circle */}
      <span
        className={cn(
          "absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] flex items-center justify-center",
          isDark 
            ? "left-7 rotate-[360deg]" 
            : "left-1 rotate-0"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-secondary transition-all duration-300" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-accent transition-all duration-300" />
        )}
      </span>
    </button>
  );
}
