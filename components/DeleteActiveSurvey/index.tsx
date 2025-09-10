"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { HiTrash, HiExclamationCircle } from 'react-icons/hi';

interface DeleteActiveSurveyProps {
  onDeleted?: () => void;
  className?: string;
}

export function DeleteActiveSurvey({ onDeleted, className = "" }: DeleteActiveSurveyProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data: session } = useSession();

  const handleDelete = async () => {
    if (!session) return;

    setIsDeleting(true);
    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      if (!authRes.ok) throw new Error('Failed to get auth token');
      const { token } = await authRes.json();

      const response = await fetch('/api/surveys/active', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setShowConfirm(false);
        if (onDeleted) onDeleted();
      } else {
        if (result.error === 'no active survey') {
          alert('You don\'t have an active survey to delete.');
        } else {
          alert(`Failed to delete survey: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Delete survey error:', error);
      alert('Failed to delete survey. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!session) return null;

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors ${className}`}
      >
        <HiTrash className="w-4 h-4" />
        <span>{isDeleting ? 'Deleting...' : 'Delete Active Survey'}</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center space-x-3 p-6 border-b border-gray-100">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <HiExclamationCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Active Survey</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-3 text-sm text-gray-600">
                <p><strong>What will happen:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>If your survey has no responses: it will be <strong>completely deleted</strong></li>
                  <li>If your survey has responses: it will be <strong>marked as cancelled</strong></li>
                  <li>You&apos;ll be able to create a new survey immediately</li>
                  <li>Points spent on the survey will <strong>not</strong> be refunded</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Survey'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
