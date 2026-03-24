"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/reservas", label: "Reservas", auth: true },
  { href: "/financeiro", label: "Financeiro", auth: true },
  { href: "/info", label: "Info", auth: false },
  { href: "/regras", label: "Regras", auth: false },
  { href: "/localizacao", label: "Localização", auth: false },
];

export default function NavTabs({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  const visibleTabs = TABS.filter((tab) => !tab.auth || isLoggedIn);

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {visibleTabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-white/20 text-white"
                : "text-green-200 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
