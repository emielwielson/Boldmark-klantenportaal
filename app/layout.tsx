import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boldmark Klantenportaal",
  description:
    "Portaal voor taken uit Notion — magic link login en toegang via KlantV2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-page text-ink">
        {children}
      </body>
    </html>
  );
}
