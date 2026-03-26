"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; visibility: "public" | "auth" | "member" }[] = [
  { href: "/reservas", label: "Reservas", visibility: "member" },
  { href: "/financeiro", label: "Financeiro", visibility: "member" },
  { href: "/benfeitorias", label: "Benfeitorias", visibility: "member" },
  { href: "/split", label: "Split", visibility: "auth" },
  { href: "/info", label: "Info", visibility: "public" },
  { href: "/regras", label: "Regras", visibility: "public" },
  { href: "/localizacao", label: "Localização", visibility: "public" },
];

export default function NavTabs({
  isLoggedIn,
  isMember,
}: {
  isLoggedIn: boolean;
  isMember: boolean;
}) {
  const pathname = usePathname();

  const visibleTabs = TABS.filter((tab) => {
    if (tab.visibility === "public") return true;
    if (tab.visibility === "auth") return isLoggedIn;
    return isMember;
  });

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
