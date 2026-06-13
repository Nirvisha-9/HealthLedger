import type { Metadata } from "next";
import "./globals.css";
import { LedgerProvider } from "@/lib/LedgerContext";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "HealthLedger",
  description: "Know what healthcare actually costs you.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LedgerProvider>
          <NavBar />
          <main>{children}</main>
        </LedgerProvider>
      </body>
    </html>
  );
}
