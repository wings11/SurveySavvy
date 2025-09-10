"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SignIn } from "../SignIn";
import Image from "next/image";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Don't require auth for the landing page (but still show it)
  const publicPages = ['/', '/landing'];
  const isPublicPage = publicPages.includes(pathname);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading...</div>
          <div className="text-sm text-gray-500">Connecting to World ID</div>
        </div>
      </div>
    );
  }

  if (!session && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Logo */}
            
              <Image src="/logo.png" alt="Survey Savvy" width={32} height={32} className="w-8 h-8" />
            
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Survey Savvy</h1>
            <p className="text-gray-600 mb-8">Connect your World ID to get started with verified human surveys</p>
            
            {/* Features */}
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">✓</span>
                </div>
                <span className="text-sm text-gray-700">Earn points and marks for helping surveys</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-sm text-gray-700">Create your own surveys with boosting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">✓</span>
                </div>
                <span className="text-sm text-gray-700">Verified human responses only</span>
              </div>
            </div>
            
            {/* Sign In Button */}
            <div className="scale-110">
              <SignIn />
            </div>
            
            <div className="mt-6 text-xs text-gray-500">
              Powered by World ID for verified human identity
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
