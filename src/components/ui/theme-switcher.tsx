"use client";

export default function ThemeSwitcher() {
  const setTheme = (theme: "dark" | "blue" | "dim" | "erotic") => {
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <div className="flex gap-2 mt-4">
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("blue")}>Blue</button>
      <button onClick={() => setTheme("dim")}>Dim</button>
      <button onClick={() => setTheme("erotic")}>😏</button>
    </div>
  );
}
