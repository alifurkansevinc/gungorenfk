"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Store,
  Settings,
  Users,
  Calendar,
  Shirt,
  Newspaper,
  UsersRound,
  GraduationCap,
  Award,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Heart,
  Ticket,
  ArrowLeftRight,
  LayoutGrid,
} from "lucide-react";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/one-cikan", label: "Öne Çıkan", icon: LayoutGrid },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingCart },
  { href: "/admin/magaza", label: "Mağaza", icon: Store },
  { href: "/admin/teslim-al", label: "Teslim al", icon: Package },
  { href: "/admin/bagislar", label: "Bağışlar", icon: Heart },
  { href: "/admin/biletler", label: "Biletler", icon: Ticket },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
  { href: "/admin/taraftarlar", label: "Taraftarlar", icon: Users },
  { href: "/admin/maclar", label: "Maçlar", icon: Calendar },
  { href: "/admin/kadro", label: "Kadro", icon: Shirt },
  { href: "/admin/transferler", label: "Transferler", icon: ArrowLeftRight },
  { href: "/admin/haberler", label: "Etkinlikler", icon: Newspaper },
  { href: "/admin/yonetim-kurulu", label: "Yönetim Kurulu", icon: UsersRound },
  { href: "/admin/teknik-heyet", label: "Teknik Heyet", icon: GraduationCap },
  { href: "/admin/rozet", label: "Rozet Kuralları", icon: Award },
  { href: "/admin/galeriler", label: "Galeriler", icon: ImageIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-siyah text-beyaz transition-all duration-300 hidden lg:flex ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-beyaz/10 px-4">
          {sidebarOpen && (
            <Link href="/admin" className="font-display text-lg font-bold tracking-tight text-beyaz">
              Güngören FK
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-beyaz/10"
            aria-label={sidebarOpen ? "Sidebar daralt" : "Sidebar genişlet"}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                  isActive
                    ? "bg-bordo text-beyaz"
                    : "text-beyaz/70 hover:bg-beyaz/10 hover:text-beyaz"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="truncate text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-beyaz/10 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-beyaz/70 transition-all hover:bg-beyaz/10 hover:text-beyaz"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">Siteye Dön</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile overlay + sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <aside className="fixed top-0 left-0 bottom-0 z-50 flex w-64 flex-col bg-siyah text-beyaz lg:hidden">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-beyaz/10 px-4">
              <span className="font-display text-lg font-bold text-beyaz">Güngören FK</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-beyaz/10"
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${
                    pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                      ? "bg-bordo text-beyaz"
                      : "text-beyaz/70 hover:bg-beyaz/10 hover:text-beyaz"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="shrink-0 border-t border-beyaz/10 p-4">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-beyaz/70 hover:bg-beyaz/10 hover:text-beyaz"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Siteye Dön</span>
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-20"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-beyaz px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            aria-label="Menü"
          >
            <Menu className="h-6 w-6 text-siyah" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-beyaz px-4 py-2 text-sm font-medium text-siyah transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Siteyi Görüntüle</span>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bordo text-sm font-bold text-beyaz">
              A
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
