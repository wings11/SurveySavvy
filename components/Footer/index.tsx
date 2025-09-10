"use client";
import Link from "next/link";

export const Footer = () => {
  return (
    <>
      {/* Pre-Footer Section with Links */}
      <div className="bg-gray-50 border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* About Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">About Survey Savvy</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Professional survey platform with World ID verification ensuring authentic human responses.
                </p>
                <Link 
                  href="/about" 
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  Learn More →
                </Link>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Platform</h3>
                <div className="space-y-2">
                  <Link href="/" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Browse Surveys
                  </Link>
                  <Link href="/dashboard" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Create Survey
                  </Link>
                  <Link href="/ranks" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    View Ranks
                  </Link>
                  <Link href="/profile" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Your Profile
                  </Link>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>✓ World ID Verification</div>
                  <div>✓ Cryptocurrency Rewards</div>
                  <div>✓ Global Participant Network</div>
                  <div>✓ Real-time Survey Analytics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="bg-white border-t border-gray-200 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Brand & Copyright */}
              <div className="text-sm text-gray-600">
                © {new Date().getFullYear()} <span className="font-semibold text-gray-900">Survey Savvy</span>. All rights reserved.
              </div>
              
              {/* Creator Attribution */}
              <div className="text-sm text-gray-600">
                Developed by <span className="font-semibold text-blue-600">Wai Yan Kyaw</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
