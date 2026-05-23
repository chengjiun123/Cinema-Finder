import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Sticky search input with a small debounce so the live filter doesn't churn
 * on every keystroke. Controlled by the parent via `value` / `onChange`.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search movies...",
  debounceMs = 200,
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync if the parent resets value externally.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce upstream notifications.
  useEffect(() => {
    if (local === value) return;
    const handle = window.setTimeout(() => onChange(local), debounceMs);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  const clear = () => {
    setLocal("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="sticky top-0 z-20 -mx-5 px-5 pt-2 pb-3 backdrop-blur-md bg-background/85">
      <label className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={placeholder}
          aria-label="Search movies"
          className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
        />
        {local.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-3 grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
    </div>
  );
}
