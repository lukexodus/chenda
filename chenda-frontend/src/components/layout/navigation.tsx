"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  Package,
  User,
  ShoppingCart,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const buyerNav: NavItem[] = [
  { href: "/buyer", label: "Search", icon: Search },
  { href: "/buyer/orders", label: "Orders", icon: ShoppingCart },
  { href: "/buyer/profile", label: "Profile", icon: User },
];

const sellerNav: NavItem[] = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
  { href: "/seller/profile", label: "Profile", icon: User },
];

/**
 * Top header bar – logo + app name.
 */
export function TopHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--fresh-border)] bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[var(--fresh-surface)]/95">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/chenda.png"
          alt="Chenda"
          width={28}
          height={28}
          className="rounded-md"
        />
        <span className="text-lg font-semibold text-[var(--fresh-text-primary)]">
          Chenda
        </span>
      </Link>
    </header>
  );
}

/**
 * Bottom tab navigation – adapts based on user role.
 */
export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const items: NavItem[] =
    user?.type === "seller" ? sellerNav : buyerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--fresh-border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[var(--fresh-surface)]/95">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                active
                  ? "text-[var(--fresh-primary)] font-medium"
                  : "text-[var(--fresh-text-muted)] hover:text-[var(--fresh-text-primary)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
