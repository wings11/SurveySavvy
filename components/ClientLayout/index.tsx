"use client";
import dynamic from "next/dynamic";
import NextAuthProvider from "@/components/next-auth-provider";
import MiniKitProvider from "@/components/minikit-provider";

const ErudaProvider = dynamic(
  () => import("@/components/Eruda").then((c) => c.ErudaProvider),
  {
    ssr: false,
  }
);

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <NextAuthProvider>
      <ErudaProvider>
        <MiniKitProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {children}
          </div>
        </MiniKitProvider>
      </ErudaProvider>
    </NextAuthProvider>
  );
}
