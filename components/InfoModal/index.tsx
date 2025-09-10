"use client";
import { useState } from 'react';
import { HiInformationCircle, HiX } from 'react-icons/hi';
import Link from 'next/link';

interface InfoModalProps {
  buttonClassName?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

export function InfoModal({ buttonClassName = "", iconSize = "md" }: InfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* Info Button */}
      <button
        onClick={openModal}
        className={`inline-flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors ${buttonClassName}`}
        title="How it works"
      >
        <HiInformationCircle className={iconSizeClasses[iconSize]} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">How it works</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Complete Surveys</h4>
                    <p className="text-sm text-gray-600">Help others by completing their surveys and earn marks for each completion</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Earn Marks & Ranks</h4>
                    <p className="text-sm text-gray-600">Each survey completion rewards you with marks. Progress through ranks as you help more!</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Withdraw to World Chain</h4>
                    <p className="text-sm text-gray-600">Once you reach 500 marks, withdraw as WLD tokens directly to your World App wallet</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">World ID Verification</h4>
                    <p className="text-sm text-gray-600">All responses are verified through World ID to ensure authenticity and prevent spam</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Quick Facts</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Daily limit: 500 marks to ensure fair participation</li>
                  <li>• 8 ranks available from Curious Novice to Arch Chancellor</li>
                  <li>• Minimum withdrawal: 500 marks to World Chain</li>
                  <li>• Secure verification prevents duplicate responses</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <Link 
                  href="/ranks"
                  onClick={closeModal}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  View Ranks
                </Link>
                <Link 
                  href="/dashboard"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
