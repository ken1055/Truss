"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, Image, MessageSquare, Bell } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", icon: Home, label: "ホーム" },
    { href: "/events", icon: Calendar, label: "イベント" },
    { href: "/gallery", icon: Image, label: "ギャラリー" },
    { href: "/board", icon: MessageSquare, label: "掲示板" },
    { href: "/announcements", icon: Bell, label: "お知らせ" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
