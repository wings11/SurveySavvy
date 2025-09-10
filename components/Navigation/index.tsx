"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SignIn } from "../SignIn";
import { 
  HiHome, 
  HiUser,
  HiCog,
  HiStar,
  HiShoppingCart
} from "react-icons/hi";
import { HiTrophy } from "react-icons/hi2";

export const Navigation = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      href: "/",
      label: "Surveys",
      icon: HiHome,
      activeIcon: HiHome
    },
    {
      href: "/ranks", 
      label: "Ranks",
      icon: HiTrophy,
      activeIcon: HiTrophy
    },
    {
      href: "/shop", 
      label: "Shop",
      icon: HiShoppingCart,
      activeIcon: HiShoppingCart
    },
    {
      href: "/dashboard", 
      label: "Dashboard",
      icon: HiCog,
      activeIcon: HiCog
    },
    {
      href: "/profile", 
      label: "Profile",
      icon: HiUser,
      activeIcon: HiUser
    }
  ];

  return (
    <>
      {/* Responsive Desktop/Tablet Header */}
      <header className="hidden sm:block bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform p-1">
                <Image src="/logo.png" alt="Survey Savvy" width={24} height={24} className="w-full h-full object-contain" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900 hidden xs:block">
                Survey Savvy
              </span>
              <span className="text-lg sm:text-xl font-semibold text-gray-900 block xs:hidden">
                SS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = isActive ? item.activeIcon : item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center">
              <SignIn />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 sm:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.activeIcon : item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  isActive
                    ? "text-blue-600 scale-105"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Spacer */}
      <div className="h-16 sm:hidden"></div>
    </>
  );
};
