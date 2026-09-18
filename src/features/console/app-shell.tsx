"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  ShieldAlert,
  ThermometerSun,
  TriangleAlert,
  X,
} from "lucide-react";

import { formatDateTimeUTC } from "@/lib/format";
import { cn } from "@/lib/utils";

import { RegionSelector } from "./region-selector";
import { ThemeToggle } from "./theme-toggle";

interface RegionListItem {
  id: string;
  name: string;
  state: string;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Map", href: "/map", icon: MapIcon },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Alerts", href: "/alerts", icon: TriangleAlert },
  { label: "Vulnerability", href: "/vulnerability", icon: ShieldAlert },
  { label: "Recovery", href: "/recovery", icon: HeartPulse },
  { label: "Survey", href: "/survey", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: FileText },
] as const;

/** Operator-console layout: sidebar navigation, top bar, and main content. */
export function AppShell({
  regions,
  lastUpdated,
  children,
}: {
  regions: RegionListItem[];
  lastUpdated: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  const brand = (
    <Link
      href="/"
      className="flex items-center gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ThermometerSun className="size-5" aria-hidden />
      </span>
      <span className="text-base font-bold tracking-tight">HeatGuard</span>
    </Link>
  );

  const navList = (
    <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          {brand}
        </div>
        {navList}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside
            role="dialog"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg"
          >
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
              {brand}
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="rounded p-1 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {navList}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="rounded p-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          {/* Compact brand for the top bar on mobile (sidebar carries it on desktop). */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ThermometerSun className="size-5" aria-hidden />
            </span>
            <span className="hidden text-base font-bold tracking-tight sm:inline">
              HeatGuard
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            {lastUpdated ? (
              <span
                className="hidden text-xs text-muted-foreground sm:inline"
                title={`Latest reading: ${formatDateTimeUTC(lastUpdated)}`}
              >
                Updated {formatDateTimeUTC(lastUpdated)}
              </span>
            ) : null}
            <RegionSelector regions={regions} />
            <ThemeToggle />
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
