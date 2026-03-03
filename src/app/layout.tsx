import type { Metadata } from "next";
import { Oswald, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { RecoveryRedirect } from "@/components/RecoveryRedirect";

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
  icons: {
    icon: "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png",
    apple: "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png",
  },
};

/** Mobil öncelikli: viewport ve tema rengi (status bar vb.) */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={`${oswald.variable} ${outfit.variable} font-body antialiased min-h-screen flex flex-col bg-beyaz text-siyah overflow-x-hidden`}>
        <CartProvider>
          <RecoveryRedirect />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
