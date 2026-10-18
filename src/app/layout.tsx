import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BhuMi · Ownership Reconciliation",
  description:
    "An evidence-led, synthetic land ownership reconciliation prototype.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
