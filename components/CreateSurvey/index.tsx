"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  HiClipboard,
  HiChat,
  HiLink,
  HiTag,
  HiCheckCircle,
  HiXCircle,
  HiPlay
} from 'react-icons/hi';

interface CreateSurveyProps {
  onCreated?: () => void;
}

export function CreateSurvey({ onCreated }: CreateSurveyProps) {
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [goalCount, setGoalCount] = useState(10);
  const [boostMarks, setBoostMarks] = useState(0);
  const [creating, setCreating] = useState(false);
  const { data: session } = useSession();

  // Calculate system-controlled reward pool for preview
  const calculateRewardPool = (goalCount: number): number => {
    if (goalCount <= 10) return 50;        // Small: up to 5 points per person
    if (goalCount <= 50) return 100;       // Medium: up to 2 points per person  
    if (goalCount <= 200) return 200;      // Large: up to 1 point per person
    return Math.max(300, goalCount);       // Mega: minimum 1 point per person guaranteed
  };
  
  // Calculate marks per helper after commission
  const calculateMarksPerHelper = (boostMarks: number, goalCount: number): number => {
    if (boostMarks === 0) return 0;
    const commission = Math.floor(boostMarks * 0.04); // 4% commission
    const marksAfterCommission = boostMarks - commission;
    return Math.floor(marksAfterCommission / goalCount);
  };
  
  const totalPool = calculateRewardPool(goalCount);
  const pointsPerHelper = Math.floor(totalPool / goalCount);
  const marksPerHelper = calculateMarksPerHelper(boostMarks, goalCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert('Please sign in first');
      return;
    }

    setCreating(true);
    try {
      // Get API token from session bridge
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      if (!authRes.ok) {
        throw new Error('Failed to get auth token');
      }
      const { token } = await authRes.json();

      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description,
          target_url: targetUrl,
          goal_count: goalCount,
          boost_marks: boostMarks
        })
      });
      
      if (res.ok) {
        setDescription('');
        setTargetUrl('');
        setGoalCount(10);
        setBoostMarks(0);
        alert('Survey created successfully!');
        onCreated?.();
      } else {
        const error = await res.json();
        alert(`Failed to create survey: ${error.error}`);
      }
    } catch (e) {
      alert('Failed to create survey');
    } finally {
      setCreating(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <HiClipboard className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Create Survey</h3>
        <p className="text-gray-600 mb-4">Connect wallet to start</p>
        <div className="text-sm text-gray-500">Share your questions with verified humans</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <HiClipboard className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Create Survey</h2>
        </div>
        <p className="text-sm text-gray-600">Get responses from verified humans</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <HiChat className="w-4 h-4" />
              <span>Survey Description</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what help you need or what you want to survey..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              rows={3}
              required
              minLength={5}
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
              <span>Be clear and specific for better responses</span>
              <span>{description.length}/2000</span>
            </div>
          </div>
          
          {/* Target URL */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <HiLink className="w-4 h-4" />
              <span>Survey Link</span>
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com/your-survey"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
            <div className="text-xs text-gray-500 mt-2">
              Link to your external survey or form
            </div>
          </div>
          
          {/* Goal Count */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <HiTag className="w-4 h-4" />
              <span>Target Responses</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={goalCount}
                onChange={(e) => setGoalCount(parseInt(e.target.value, 10))}
                min={1}
                max={3000}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                responses
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              How many responses you need (1-3000)
            </div>
          </div>

          {/* Boost Marks */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <span className="text-yellow-500">✨</span>
              <span>Boost with Marks (Optional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={boostMarks}
                onChange={(e) => setBoostMarks(parseInt(e.target.value, 10) || 0)}
                min={0}
                max={3000}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                marks
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Spend marks to boost your survey priority {boostMarks > 0 && `(+${marksPerHelper} marks per helper)`}
            </div>
            {boostMarks > 3000 && (
              <div className="text-xs text-red-500 mt-1">
                Maximum 3000 marks per survey
              </div>
            )}
          </div>

          {/* Reward Preview */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <HiTag className="w-4 h-4" />
              <span>Reward Preview</span>
            </label>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div className="text-center">
                  <div className="text-green-600 font-bold text-lg">{totalPool}</div>
                  <div className="text-gray-600">Points Pool</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 font-bold text-lg">{pointsPerHelper}</div>
                  <div className="text-gray-600">Points/Helper</div>
                </div>
              </div>
              
              {boostMarks > 0 && (
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-green-200 pt-3">
                  <div className="text-center">
                    <div className="text-yellow-600 font-bold text-lg">{boostMarks}</div>
                    <div className="text-gray-600">Marks Boost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-600 font-bold text-lg">{marksPerHelper}</div>
                    <div className="text-gray-600">Marks/Helper</div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-3 text-center">
                System-controlled rewards • {goalCount <= 10 ? 'Small Survey' : goalCount <= 50 ? 'Medium Survey' : goalCount <= 200 ? 'Large Survey' : 'Mega Survey'}
                {boostMarks > 0 && ' • Boosted Priority'}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-blue-600 font-medium flex items-center justify-center space-x-1">
                  <HiCheckCircle className="w-4 h-4" />
                  <span>Verified</span>
                </div>
                <div className="text-gray-700">Human responses only</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-medium flex items-center justify-center space-x-1">
                  <HiXCircle className="w-4 h-4" />
                  <span>No Spam</span>
                </div>
                <div className="text-gray-700">One response per user</div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              !creating
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {creating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Survey...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <HiPlay className="w-5 h-5" />
                <span>Launch Survey</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
