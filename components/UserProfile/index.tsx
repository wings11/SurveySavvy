"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { getRankInfo } from "../../lib/ranks";
import { RankBadge, RankProgress } from "../RankBadge";
import { DeleteActiveSurvey } from "../DeleteActiveSurvey";
import { 
  HiStar,
  HiChartBar,
  HiBadgeCheck,
  HiUser,
  HiCheckCircle
} from 'react-icons/hi';

interface UserProfile {
  id: string;
  nickname?: string;
  totalPoints: number;
  totalMarks: number;
  rank_level: number;
  active_survey_id?: string;
  hasNickname: boolean;
  nickname_set_at?: string;
}

export const UserProfile = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      if (token) {
        const userRes = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfile(userData);
        } else {
          setError('Failed to fetch profile');
        }
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfile();
  }, [session, fetchProfile]);

  if (!session) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <HiUser className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-500 font-medium">Connect to view profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
        <span className="text-2xl mb-2 block">⚠️</span>
        <p className="text-red-600 font-medium">{error || 'Profile unavailable'}</p>
      </div>
    );
  }

  const currentRank = getRankInfo(profile.rank_level);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
          <span className="text-2xl">{currentRank.emoji}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">
          {profile.nickname || 'Anonymous'}
        </h3>
        <div className={`inline-flex items-center space-x-1 ${currentRank.color}`}>
          <span className="text-sm font-medium">{currentRank.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Points and Marks Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-gray-900 mb-1">{profile.totalPoints}</div>
            <div className="text-xs text-gray-600 flex items-center justify-center space-x-1">
              <span>💎</span>
              <span>Points</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-gray-900 mb-1">{profile.totalMarks || 0}</div>
            <div className="text-xs text-gray-600 flex items-center justify-center space-x-1">
              <span>✨</span>
              <span>Marks</span>
            </div>
          </div>
        </div>

        {/* Rank Progress */}
        <div className="space-y-3">
          <RankProgress 
            points={profile.totalPoints} 
            level={profile.rank_level}
            showDetails={true}
            className="bg-gray-50 rounded-lg p-3"
          />
        </div>

        {/* Status & Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${profile.active_survey_id ? 'bg-green-400' : 'bg-gray-300'}`}></span>
            <span className="text-gray-600">
              {profile.active_survey_id ? 'Survey Active' : 'No Active Survey'}
            </span>
          </div>

          {/* Delete Active Survey Button */}
          {profile.active_survey_id && (
            <div className="pt-2">
              <DeleteActiveSurvey 
                onDeleted={fetchProfile}
                className="w-full justify-center"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
