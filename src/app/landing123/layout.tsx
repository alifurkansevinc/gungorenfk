import type { Metadata } from "next";

/** Bu rota sitede linklenmez; doğrudan URL ile paylaşım / kampanya içindir. */
export const metadata: Metadata = {
  title: "Güngören FK",
  description: "Kulüp ve taraftar ailesi.",
  robots: { index: false, follow: false },
};

export default function Landing123Layout({ children }: { children: React.ReactNode }) {
  return children;
}
