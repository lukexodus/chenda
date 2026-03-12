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
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/stores/cartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

const bothNav: NavItem[] = [
  { href: "/buyer", label: "Search", icon: Search },
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
  { href: "/buyer/profile", label: "Profile", icon: User },
];

/**
 * Top header bar – logo + app name.
 */
export function TopHeader() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.getTotalItems());
  const isBuyer = user?.type !== "seller";
  const router = useRouter();

  const homeHref = user?.type === "buyer"
    ? "/buyer"
    : user?.type === "seller" || user?.type === "both"
      ? "/seller/dashboard"
      : "/";

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full max-w-[100vw] overflow-x-hidden items-center justify-between border-b border-[var(--fresh-border)] bg-white/95 px-3 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[var(--fresh-surface)]/95">
      <Link href={homeHref} className="flex items-center gap-2 shrink-0" aria-label="Chenda home">
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

      <div className="ml-auto flex items-center gap-1">
        {/* Cart icon — buyers only */}
        {isBuyer && (
          <Link
            href="/cart"
            className="relative rounded-md p-2 text-[var(--fresh-text-muted)] hover:text-[var(--fresh-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)]"
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

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="rounded-md p-1.5 sm:p-2 text-[var(--fresh-text-muted)] hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)] shrink-0"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

/**
 * Bottom tab navigation – adapts based on user role.
 */
export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  let items: NavItem[] = buyerNav;
  if (user?.type === "both") {
    items = bothNav;
  } else if (user?.type === "seller") {
    items = sellerNav;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--fresh-border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[var(--fresh-surface)]/95 w-full max-w-[100vw] overflow-x-hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
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
                "flex flex-col items-center gap-1 px-1 sm:px-3 py-1 text-[10px] sm:text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)] rounded-md min-w-0 shrink-1 w-full text-center overflow-hidden",
                active
                  ? "text-[var(--fresh-primary)] font-medium"
                  : "text-[var(--fresh-text-muted)] hover:text-[var(--fresh-text-primary)]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden="true" />
              <span className="truncate w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
