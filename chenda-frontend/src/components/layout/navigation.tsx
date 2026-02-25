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
import { useCartStore } from "@/lib/stores/cartStore"; 

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
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.getTotalItems());
  const isBuyer = user?.type !== "seller";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--fresh-border)] bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[var(--fresh-surface)]/95">
      <Link href="/" className="flex items-center gap-2" aria-label="Chenda home">
        <Image
          src="/chenda.png"
          alt=""
          width={28}
          height={28}
          className="rounded-md"
        />
        <span className="text-lg font-semibold text-[var(--fresh-text-primary)]">
          Chenda
        </span>
      </Link>

      {/* Cart icon — buyers only */}
      {isBuyer && (
        <Link
          href="/cart"
          className="relative ml-auto rounded-md p-2 text-[var(--fresh-text-muted)] hover:text-[var(--fresh-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)]"
          aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount !== 1 ? 's' : ''}` : ''}`}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--fresh-primary)] text-[10px] font-bold text-white"
            >
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      )}
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
          // Use exact match for root-level tabs (e.g. /buyer) so sub-routes
          // like /buyer/orders don't also highlight it.
          const isRoot = items.some(
            (other) => other.href !== item.href && other.href.startsWith(item.href)
          );
          const active = isRoot ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)] rounded-md",
                active
                  ? "text-[var(--fresh-primary)] font-medium"
                  : "text-[var(--fresh-text-muted)] hover:text-[var(--fresh-text-primary)]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
