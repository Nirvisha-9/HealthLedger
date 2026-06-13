"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/search",  label: "Find Care" },
  { href: "/profile", label: "Profile"   },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header style={{
      height: 64,
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        height: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: 9,
            background: "#16a34a",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
            flexShrink: 0,
          }}>
            HL
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
            HealthLedger
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 4 }}>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  background: active ? "#dcfce7" : "transparent",
                  color: active ? "#15803d" : "#6b7280",
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
