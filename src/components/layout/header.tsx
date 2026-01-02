"use client";

import Link from "next/link";
import UserMenu from "@/components/ui/user-menu";

export default function Header() {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
      <Link href="/" className="font-bold text-lg">
        MyApp
      </Link>
      
      <UserMenu
       />
    </header>
  );
}
