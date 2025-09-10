"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { NicknameSetup } from "@/components/NicknameSetup";
import { AuthGuard } from "@/components/AuthGuard";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { data: session, status } = useSession();
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserNickname = async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();

      if (token) {
        const userRes = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();

        if (userData.hasNickname) {
          setUserNickname(userData.nickname);
          setNeedsNickname(false);
        } else {
          setNeedsNickname(true);
        }
      }
    } catch (error) {
      console.error('Failed to check user nickname:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    checkUserNickname();
  }, [session, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNicknameSet = (nickname: string) => {
    setUserNickname(nickname);
    setNeedsNickname(false);
  };

  if (status === 'loading' || (session && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      {children}
      {session && needsNickname && (
        <NicknameSetup onNicknameSet={handleNicknameSet} />
      )}
    </AuthGuard>
  );
};
