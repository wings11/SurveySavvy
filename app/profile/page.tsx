"use client";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserProfile } from "../../components/UserProfile";
import { AppLayout } from "../../components/AppLayout";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { HiCog, HiShieldCheck, HiLogout } from 'react-icons/hi';
import Image from "next/image";

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
        const { token } = await authRes.json();
        
        const userRes = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setIsAdmin(userData.isAdmin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session]);
  
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        
        <main className="container mx-auto px-4 py-2 pb-24 flex-1">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
            <p className="text-gray-600">Manage your account and settings</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* User Profile Card */}
            <UserProfile />
            
            {/* Activity Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">-</div>
                  <div className="text-sm text-gray-600">Surveys Helped</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">-</div>
                  <div className="text-sm text-gray-600">Surveys Created</div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-3">
                {/* Admin Dashboard Button - Only visible to admins */}
                {!loading && isAdmin && (
                  <button 
                    onClick={() => router.push('/admin')}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    <div className="flex items-center space-x-3">
                      <HiShieldCheck className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-medium text-red-700">Admin Dashboard</div>
                        <div className="text-sm text-red-500">Manage users and withdrawals</div>
                      </div>
                    </div>
                  </button>
                )}
                
                <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <HiCog className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Update Nickname</div>
                      <div className="text-sm text-gray-500">Change your display name</div>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <HiCog className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Privacy Settings</div>
                      <div className="text-sm text-gray-500">Manage your privacy preferences</div>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <HiCog className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Transaction History</div>
                      <div className="text-sm text-gray-500">View all your transactions</div>
                    </div>
                  </div>
                </button>
                
                {/* Logout Button */}
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg transition-colors border-t border-gray-200 mt-4 pt-4"
                >
                  <div className="flex items-center space-x-3">
                    <HiLogout className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium text-red-600">Sign Out</div>
                      <div className="text-sm text-red-400">Logout from your account</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </AppLayout>
  );
}
