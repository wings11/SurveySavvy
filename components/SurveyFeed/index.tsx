"use client";
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { RankBadge } from '../RankBadge';
import { 
  HiCheckCircle,
  HiLockClosed,
  HiHand,
  HiClock,
  HiUsers,
  HiStar,
  HiCurrencyDollar,
  HiExternalLink,
  HiX
} from 'react-icons/hi';
import {
  MiniKit,
  VerificationLevel,
  ISuccessResult,
  MiniAppVerifyActionErrorPayload,
} from "@worldcoin/minikit-js";

interface Survey {
  id: string;
  description: string;
  goal_count: number;
  verified_count: number;
  rank_level: number;
  nickname?: string;
  created_at: string;
  owner_user_id: string;
  boost_marks?: number;
}

interface User {
  id: string;
  totalPoints: number;
  rank_level: number;
  active_survey_id: string | null;
  nickname: string | null;
  hasNickname: boolean;
}

interface SuccessModalData {
  surveyId: string;
  surveyDescription: string;
  pointsEarned: number;
  redirectToken: string;
  isCompleted: boolean;
}

// Helper function to calculate potential points per helper
function calculatePotentialPoints(goalCount: number): number {
  // Fixed tiers based on survey size with minimum 1 point guarantee
  let totalPool;
  if (goalCount <= 10) totalPool = 50;        // Small: up to 5 points per person
  else if (goalCount <= 50) totalPool = 100;  // Medium: up to 2 points per person  
  else if (goalCount <= 200) totalPool = 200; // Large: up to 1 point per person
  else totalPool = Math.max(300, goalCount);   // Mega: minimum 1 point per person guaranteed
  
  return Math.floor(totalPool / goalCount);
}

// Helper function to calculate marks per helper after commission
function calculateMarksPerHelper(boostMarks: number, goalCount: number): number {
  if (boostMarks === 0) return 0;
  const commission = Math.floor(boostMarks * 0.04); // 4% commission
  const marksAfterCommission = boostMarks - commission;
  return Math.floor(marksAfterCommission / goalCount);
}

export function SurveyFeed() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalData | null>(null);
  const { data: session } = useSession();

  const loadCurrentUser = useCallback(async () => {
    if (!session) return;
    
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
    }
  }, [session]);

  const loadSurveys = async () => {
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      setSurveys(data.items || []);
    } catch (e) {
      console.error('Failed to load surveys', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  useEffect(() => {
    if (session) {
      loadCurrentUser();
    }
  }, [session, loadCurrentUser]);

  const handleVerifyWithWorldID = useCallback(async (surveyId: string) => {
    if (!MiniKit.isInstalled()) {
      alert("World App is required for verification. Please install the World App and try again.");
      return;
    }

    setVerifying(surveyId);

    try {
      const verifyPayload = {
        action: "surveyformverification",
        signal: surveyId,
        verification_level: VerificationLevel.Orb,
      };

      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      // Check if command errored
      if (finalPayload.status === "error") {
        console.error("World ID verification failed:", finalPayload);
        alert("World ID verification failed. Please try again.");
        return;
      }

      // Send verification to backend
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      if (!authRes.ok) {
        throw new Error('Failed to get auth token');
      }
      const { token } = await authRes.json();

      const verifyResponse = await fetch(`/api/surveys/${surveyId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
        }),
      });

      const result = await verifyResponse.json();

      if (verifyResponse.ok) {
        if (result.status === 'duplicate') {
          alert('You have already helped this survey!');
        } else {
          // Find the survey to get its description
          const survey = surveys.find(s => s.id === surveyId);
          
          // Show success modal with survey link
          setSuccessModal({
            surveyId,
            surveyDescription: survey?.description || 'Survey',
            pointsEarned: result.awarded_points || 0,
            redirectToken: result.redirect_token,
            isCompleted: result.completed || false
          });
          
          loadSurveys(); // Refresh the list
          loadCurrentUser(); // Refresh user data for updated rank
        }
      } else {
        if (result.error === 'owner cannot help own survey') {
          alert('You cannot help your own survey!');
        } else if (result.error === 'verification_failed') {
          alert('World ID verification failed. Please try again.');
        } else {
          alert(`Failed to verify survey help: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Survey help verification failed:', error);
      alert('Failed to verify survey help. Please try again.');
    } finally {
      setVerifying(null);
    }
  }, [loadCurrentUser, surveys]);

  const handleHelpSurvey = async (surveyId: string) => {
    if (!session) {
      alert('Please sign in first');
      return;
    }

    // Check if user is trying to help their own survey
    if (currentUser && surveys.find(s => s.id === surveyId)?.owner_user_id === currentUser.id) {
      alert('You cannot help your own survey!');
      return;
    }

    // Start World ID verification process
    await handleVerifyWithWorldID(surveyId);
  };

  // Success Modal Component
  const SuccessModal = ({ data }: { data: SuccessModalData }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeIn">
        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Successful!</h3>
              <p className="text-sm text-gray-600">You can now access the survey</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Survey:</strong> {data.surveyDescription.substring(0, 100)}
              {data.surveyDescription.length > 100 ? '...' : ''}
            </p>
          </div>

          {data.pointsEarned > 0 ? (
            <div className="bg-green-50 rounded-lg p-4 flex items-center space-x-3">
              <HiCurrencyDollar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Points Earned</p>
                <p className="text-lg font-bold text-green-900">+{data.pointsEarned} points</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-lg p-4 flex items-center space-x-3">
              <HiCurrencyDollar className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Daily Limit Reached</p>
                <p className="text-sm text-yellow-700">You&apos;ve reached your daily points limit</p>
              </div>
            </div>
          )}

          {data.isCompleted && (
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-purple-800">🎉 Survey Completed!</p>
              <p className="text-xs text-purple-600">This survey has reached its goal</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              window.open(`/api/surveys/redirect?token=${data.redirectToken}`, '_blank');
              setSuccessModal(null);
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <HiExternalLink className="w-5 h-5" />
            <span>Open Survey in New Tab</span>
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>After you fill the survey, the progress will be counted automatically.</p>
          <p>You can only help each survey once.</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="mt-6 flex justify-between">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <HiStar className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Surveys Yet</h3>
        <p className="text-gray-600 mb-4">Be the first to create a survey!</p>
        <div className="text-sm text-gray-500">
          Surveys help gather verified human responses
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Modal */}
      {successModal && <SuccessModal data={successModal} />}
      
      {surveys.map((survey) => {
        const progress = Math.min((survey.verified_count / survey.goal_count) * 100, 100);
        const isCompleted = survey.verified_count >= survey.goal_count;
        const isOwnSurvey = currentUser && survey.owner_user_id === currentUser.id;
        const isVerifyingThis = verifying === survey.id;
        const createdDate = new Date(survey.created_at);
        const timeAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const potentialPoints = calculatePotentialPoints(survey.goal_count);
        const potentialMarks = calculateMarksPerHelper(survey.boost_marks || 0, survey.goal_count);
        const isBoosted = (survey.boost_marks || 0) > 0;

        return (
          <div 
            key={survey.id} 
            className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 animate-fadeIn ${
              isBoosted ? 'border-yellow-200 bg-gradient-to-br from-white to-yellow-50' : 'border-gray-100'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {survey.nickname ? survey.nickname[0].toUpperCase() : 'U'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {survey.nickname || 'Anonymous'}
                      {isOwnSurvey && <span className="text-xs text-blue-600 ml-2">(Your Survey)</span>}
                    </span>
                    <RankBadge level={survey.rank_level} />
                    {isBoosted && (
                      <div className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                        <span>✨</span>
                        <span>Boosted</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <HiClock className="w-4 h-4" />
                    <span>{timeAgo}d ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-800 leading-relaxed">{survey.description}</p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <HiUsers className="w-4 h-4" />
                  <span>Progress</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {survey.verified_count}/{survey.goal_count}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {Math.round(progress)}% complete
              </div>
            </div>

            {/* Potential Rewards */}
            {!isOwnSurvey && !isCompleted && session && (
              <div className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <HiCurrencyDollar className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-700">Earn up to</span>
                    <span className="font-bold text-green-600">{potentialPoints} points</span>
                  </div>
                  {potentialMarks > 0 && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-yellow-600">✨</span>
                      <span className="font-bold text-yellow-600">+{potentialMarks} marks</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {potentialMarks > 0 ? 'Boosted survey with bonus marks!' : 'For helping this survey'}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="flex justify-end">
              <button
                onClick={() => handleHelpSurvey(survey.id)}
                disabled={!session || isCompleted || isOwnSurvey || isVerifyingThis}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  !session
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isOwnSurvey
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isCompleted
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : isVerifyingThis
                    ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {!session ? (
                  <>
                    <HiLockClosed className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </>
                ) : isOwnSurvey ? (
                  <>
                    <HiLockClosed className="w-4 h-4" />
                    <span>Your Survey</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <HiCheckCircle className="w-4 h-4" />
                    <span>Completed</span>
                  </>
                ) : isVerifyingThis ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <HiHand className="w-4 h-4" />
                    <span>Help Survey</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
