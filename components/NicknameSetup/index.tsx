"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

interface NicknameSetupProps {
  onNicknameSet: (nickname: string) => void;
}

export const NicknameSetup = ({ onNicknameSet }: NicknameSetupProps) => {
  const { data: session } = useSession();
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError("Nickname must be between 2 and 20 characters");
      return;
    }

    // Check for valid characters (letters, numbers, spaces, basic punctuation)
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(nickname)) {
      setError("Nickname can only contain letters, numbers, spaces, hyphens, underscores, and dots");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get auth token
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();

      if (!token) {
        setError("Authentication failed");
        return;
      }

      // Set nickname
      const response = await fetch('/api/users/nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nickname: nickname.trim() })
      });

      const result = await response.json();

      if (result.success) {
        onNicknameSet(nickname.trim());
      } else {
        setError(result.error || "Failed to set nickname");
      }
    } catch (error) {
      setError("Failed to set nickname. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Welcome to Survey Savvy!</h2>
        <p className="text-gray-600 mb-4">
          Please choose a nickname that will be displayed when you create surveys. 
          This helps other users recognize your survey posts.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              Your Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              2-20 characters, letters, numbers, spaces, and basic punctuation allowed
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting || !nickname.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Setting up..." : "Set Nickname"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          <p>Your nickname can be changed later in your profile settings.</p>
        </div>
      </div>
    </div>
  );
};
