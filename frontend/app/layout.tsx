import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DefinAm PWA",
  description: "College Mode learning platform scaffold",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-[#0A0F1E] antialiased">{children}</body>
    </html>
  );
}
