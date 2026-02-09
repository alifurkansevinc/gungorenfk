import type { Metadata } from "next";
import { Oswald, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Güngören FK | Resmi İnternet Sitesi",
  description: "Güngören Belediye Spor Kulübü resmi internet sitesi. Haberler, maçlar, kadro ve taraftar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={`${oswald.variable} ${outfit.variable} font-body antialiased min-h-screen flex flex-col bg-beyaz text-siyah`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
