import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PreferencesProvider } from "@/components/preferences";
import "./globals.css";
export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: "/favicon.ico?v=2",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
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
