import type { Metadata } from "next";
import { Oswald, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { RecoveryRedirect } from "@/components/RecoveryRedirect";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { getSiteUrl } from "@/lib/site-url";

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

const siteUrl = getSiteUrl();
const defaultTitle = "Güngören FK | Resmi İnternet Sitesi";
const defaultDescription =
  "Güngören Belediye Spor Kulübü resmi internet sitesi. Haberler, maçlar, kadro ve taraftar.";
const defaultOgImage =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: defaultTitle,
  description: defaultDescription,
  applicationName: "Güngören FK",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Güngören FK",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Güngören FK",
    title: "Güngören FK | Resmi İnternet Sitesi",
    description: defaultDescription,
    url: siteUrl,
    images: [{ url: defaultOgImage, alt: "Güngören FK" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Güngören FK | Resmi İnternet Sitesi",
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    // v= query: tarayıcı / CDN eski Next varsayılan favicon cache'ini kırsın
    icon: [
      { url: "/icon-32.png?v=20260806", type: "image/png", sizes: "32x32" },
      { url: "/icon-48.png?v=20260806", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png?v=20260806", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico?v=20260806", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=20260806",
    apple: [{ url: "/apple-icon.png?v=20260806", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

/** Mobil öncelikli: viewport ve tema rengi (status bar vb.) */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
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
          <PwaInstallBanner />
        </CartProvider>
      </body>
    </html>
  );
}
