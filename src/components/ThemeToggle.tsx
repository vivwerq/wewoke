import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "theme";

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved === "dark";
      return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");

    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch (e) {
      // ignore
    }
  }, [isDark]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Activate light mode" : "Activate dark mode"}
      onClick={() => setIsDark((s) => !s)}
      className={`relative inline-flex items-center h-8 w-14 rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isDark ? "bg-gradient-to-r from-yellow-400 via-orange-300 to-amber-400" : "bg-slate-200/80 dark:bg-slate-700/60"}`}
    >
      {/* knob */}
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ${isDark ? "translate-x-6" : "translate-x-0"}`}
      >
        <span className="sr-only">theme</span>
      </span>

      {/* icons overlay to the left/right for visual cue */}
      <span className="absolute left-1 text-yellow-500">
        <Sun className={`w-4 h-4 ${isDark ? "opacity-0" : "opacity-100"} transition-opacity duration-200`} />
      </span>
      <span className="absolute right-1 text-white">
        <Moon className={`w-4 h-4 ${isDark ? "opacity-100" : "opacity-0"} transition-opacity duration-200`} />
      </span>
    </button>
  );
};

export default ThemeToggle;
