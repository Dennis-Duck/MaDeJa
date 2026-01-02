
"use client";

import { useState, useRef, useEffect } from "react";
import ThemeSwitcher from "./theme-switcher";

export default function UserMenu() {
  const user = { name: "Guest" };

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      {/* User button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1 rounded bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
      >
        <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs text-black">
          {user.name.charAt(0)}
        </div>
        <span className="text-sm">{user.name}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded bg-[var(--background-secondary)] border border-[var(--border)] shadow-lg overflow-hidden">
          <ul className="py-1 text-sm text-[var(--foreground)]">
            <li className="px-4 py-2 cursor-pointer hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors duration-150">
              Login
            </li>
            <li className="px-4 py-2 cursor-pointer hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors duration-150">
              Register
            </li>

            <li className="my-1 border-t border-[var(--border)]" />

            <li className="px-4 py-2 text-xs text-[var(--foreground-muted)]">
              Signed in as Guest
            </li>
            <li className="px-4 py-2 border-t border-[var(--border)]">
              <ThemeSwitcher />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
