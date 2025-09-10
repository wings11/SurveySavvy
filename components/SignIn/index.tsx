"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export const SignIn = () => {
  const { data: session } = useSession();
  
  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {session?.user?.name?.slice(0, 6)}...
          </span>
        </div>
        <button 
          onClick={() => signOut()}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          ←
        </button>
      </div>
    );
  }
  
  return (
    <button 
      onClick={() => signIn('worldcoin')}
      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
    >
      <span className="hidden md:inline">Sign in with World ID</span>
      <span className="md:hidden">Sign In</span>
    </button>
  );
};
