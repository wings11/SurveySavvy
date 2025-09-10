"use client";
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  HiUsers, 
  HiCreditCard, 
  HiCheckCircle, 
  HiXCircle,
  HiClock,
  HiRefresh,
  HiArrowLeft
} from 'react-icons/hi';

interface User {
  id: string;
  nickname: string;
  points: number;
  marks: number;
  rank_level: number;
  is_admin: boolean;
  created_at: string;
  last_weekly_purchase_at?: string;
  total_purchases: number;
  total_spent_wld: number;
  total_withdrawals: number;
  total_withdrawn_wld: number;
}

interface Withdrawal {
  id: string;
  user_id: string;
  nickname: string;
  marks_amount: number;
  wld_amount: number;
  user_wallet_address: string;
  tx_hash?: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals'>('withdrawals');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();

      // Fetch users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      } else if (usersRes.status === 403) {
        router.push('/');
        return;
      }

      // Fetch withdrawals
      const withdrawalsRes = await fetch('/api/admin/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        setWithdrawals(withdrawalsData.withdrawals);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    
    fetchData();
  }, [session, router, fetchData]);

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject', txHash?: string) => {
    setProcessing(withdrawalId);
    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();

      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawalId,
          action,
          txHash
        })
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error('Failed to process withdrawal action');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">Authentication Required</div>
          <div className="text-gray-600">Please sign in to access admin dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/profile')}
              className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage users and withdrawals</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <HiRefresh className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <HiCreditCard className="w-5 h-5" />
              <span>Pending Withdrawals ({withdrawals.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <HiUsers className="w-5 h-5" />
              <span>All Users ({users.length})</span>
            </div>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Pending Withdrawals</h2>
                  <p className="text-gray-600">Review and process withdrawal requests</p>
                </div>
                
                {withdrawals.length === 0 ? (
                  <div className="p-12 text-center">
                    <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Withdrawals</h3>
                    <p className="text-gray-600">All withdrawal requests have been processed</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">User</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Wallet</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Requested</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {withdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {withdrawal.nickname || 'Anonymous'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {withdrawal.user_id.slice(0, 8)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {Math.abs(withdrawal.marks_amount)} marks
                                </div>
                                <div className="text-sm text-green-600">
                                  → {withdrawal.wld_amount} WLD
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-mono text-sm text-gray-600">
                                {withdrawal.user_wallet_address.slice(0, 10)}...
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(withdrawal.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    const txHash = prompt('Enter transaction hash for approval:');
                                    if (txHash) {
                                      handleWithdrawalAction(withdrawal.id, 'approve', txHash);
                                    }
                                  }}
                                  disabled={processing === withdrawal.id}
                                  className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50"
                                >
                                  {processing === withdrawal.id ? (
                                    <HiClock className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Approve'
                                  )}
                                </button>
                                <button
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                                  disabled={processing === withdrawal.id}
                                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
                  <p className="text-gray-600">User statistics and activity overview</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">User</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Balance</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Purchases</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Withdrawals</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Joined</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.nickname || 'Anonymous'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.id.slice(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-blue-600">{user.points}</span> points
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-yellow-600">{user.marks}</span> marks
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.total_purchases} purchases
                              </div>
                              <div className="text-sm text-green-600">
                                {user.total_spent_wld} WLD spent
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.total_withdrawals} withdrawals
                              </div>
                              <div className="text-sm text-red-600">
                                {user.total_withdrawn_wld} WLD withdrawn
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.is_admin 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
