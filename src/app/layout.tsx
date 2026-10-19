import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PreferencesProvider } from "@/components/preferences";
import "./globals.css";
export const metadata: Metadata = {
  title: "BhuMi · ভূমি — Ownership Reconciliation",
  description:
    "Understand every ownership share. A bilingual, evidence-led land record reconciliation prototype.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const lang = jar.get("bhumi_lang")?.value === "en" ? "en" : "bn";
  const theme = ["dark", "light"].includes(jar.get("bhumi_theme")?.value ?? "")
    ? jar.get("bhumi_theme")!.value
    : "system";
  return (
    <html lang={lang} data-theme={theme}>
      <body>
        <PreferencesProvider initialLang={lang} initialTheme={theme}>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
