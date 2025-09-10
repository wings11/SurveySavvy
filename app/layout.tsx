import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "Survey Savvy - Verified Human Responses",
  description: "Get authentic survey responses from verified humans worldwide. Create surveys, earn points, and contribute to research.",
  keywords: "survey, research, verified humans, world id, blockchain, points, responses",
  authors: [{ name: "Wai Yan Kyaw" }],
  robots: "index, follow",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Survey Savvy - Verified Human Responses",
    description: "Get authentic survey responses from verified humans worldwide.",
    type: "website",
    locale: "en_US",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Survey Savvy - Verified Human Responses",
    description: "Get authentic survey responses from verified humans worldwide.",
    images: ["/logo.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
