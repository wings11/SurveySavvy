"use client";
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { RANK_SYSTEM, getRankInfo, getProgressToNextRank } from '../../lib/ranks';
import { RankBadge } from '../RankBadge';
import { 
  HiUser,
  HiStar,
  HiClock,
  HiLockClosed
} from 'react-icons/hi';
import { HiTrophy } from 'react-icons/hi2';

interface User {
  id: string;
  totalPoints: number;
  rank_level: number;
  active_survey_id: string | null;
  nickname: string | null;
  hasNickname: boolean;
}

export function RanksView() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const loadCurrentUser = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      if (!authRes.ok) return;
      const { token } = await authRes.json();
      
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(userData);
      }
    } catch (e) {
      console.error('Failed to load current user', e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
        
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <HiUser className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to View Ranks</h3>
        <p className="text-gray-600">Sign in to see your rank progress and the complete rank system</p>
      </div>
    );
  }

  const currentRank = currentUser ? getRankInfo(currentUser.rank_level) : null;
  const progress = currentUser ? getProgressToNextRank(currentUser.totalPoints, currentUser.rank_level) : null;

  return (
    <div className="space-y-6">
      {/* User Progress Card */}
      {currentUser && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">{currentRank?.emoji}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {currentUser.nickname || 'Anonymous'}
              </h2>
              <div className="flex items-center space-x-2">
                <RankBadge level={currentUser.rank_level} size="lg" />
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <HiStar className="w-4 h-4 text-yellow-500" />
                  <span>{currentUser.totalPoints} points</span>
                </div>
                <div className="flex items-center space-x-1">
                  <HiTrophy className="w-4 h-4 text-orange-500" />
                  <span>Level {currentUser.rank_level}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress to Next Rank */}
          {progress && progress.nextRank && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Progress to {progress.nextRank.name}
                </span>
                <span className="text-gray-600">
                  {progress.pointsNeeded} points needed
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 text-center">
                {Math.round(progress.progress)}% complete
              </div>
            </div>
          )}

          {progress && !progress.nextRank && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center space-x-2 text-yellow-600">
                <HiTrophy className="w-5 h-5" />
                <span className="font-medium">Maximum rank achieved!</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">You&apos;ve reached the highest rank possible</p>
            </div>
          )}
        </div>
      )}

      {/* All Ranks List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Ranks</h3>
        
        {RANK_SYSTEM.map((rank, index) => {
          const isCurrentRank = currentUser && currentUser.rank_level === rank.level;
          const isUnlocked = currentUser && currentUser.rank_level >= rank.level;
          const isNextRank = currentUser && currentUser.rank_level + 1 === rank.level;
          
          return (
            <div 
              key={rank.level}
              className={`rounded-xl shadow-sm border p-4 transition-all duration-200 ${
                isCurrentRank 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 ring-2 ring-blue-200' 
                  : isUnlocked 
                    ? 'bg-white border-gray-100 hover:shadow-md' 
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Rank Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  isUnlocked 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isUnlocked ? rank.emoji : <HiLockClosed className="w-5 h-5" />}
                </div>

                {/* Rank Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {rank.name}
                    </h4>
                    {isCurrentRank && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                    {isNextRank && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                        Next
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-2 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                    {rank.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className={`flex items-center space-x-1 ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                      <HiStar className="w-3 h-3" />
                      <span>{rank.minPoints}+ points required</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                      <HiTrophy className="w-3 h-3" />
                      <span>Level {rank.level}</span>
                    </div>
                  </div>
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isCurrentRank ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <HiUser className="w-4 h-4 text-white" />
                    </div>
                  ) : isUnlocked ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <HiTrophy className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <HiLockClosed className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start space-x-3">
          <HiClock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">How to Earn Points</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Help complete surveys by verifying with World ID</li>
              <li>• Earn 5-18 points per survey (based on survey difficulty)</li>
              <li>• Daily limit of 500 points to ensure fair participation</li>
              <li>• Ranks unlock new privileges and recognition in the community</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
