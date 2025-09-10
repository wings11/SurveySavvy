import { AppLayout } from "../../components/AppLayout";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        
        <main className="container mx-auto px-4 py-2 pb-24 flex-1">
        

          {/* Hero Section */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                
                 
                
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to<br></br> Survey Savvy</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The world&apos;s first verified human survey platform powered by World ID and blockchain technology
              </p>
            </div>

            {/* What is Survey Savvy */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Survey Savvy?</h2>
              <p className="text-gray-600 mb-4">
                Survey Savvy is a revolutionary survey platform that ensures authentic responses from verified humans. 
                By leveraging World ID&apos;s proof-of-personhood technology, we eliminate bots, duplicate responses, 
                and fake participants from your research data.
              </p>
              <p className="text-gray-600">
                Whether you&apos;re conducting academic research, market studies, or gathering user feedback, 
                Survey Savvy provides the most reliable and authentic survey responses available.
              </p>
            </div>

            {/* How it Works */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Verify Your Identity</h3>
                      <p className="text-gray-600">Connect your World ID to prove you&apos;re a unique human. No personal data is shared.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-semibold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Complete Surveys</h3>
                      <p className="text-gray-600">Help researchers by completing surveys and earning marks for your participation.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-semibold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Earn Rewards</h3>
                      <p className="text-gray-600">Accumulate marks (up to 500) and withdraw them as cryptocurrency rewards.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-semibold">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Create Surveys</h3>
                      <p className="text-gray-600">Launch your own surveys and get verified responses from real humans worldwide.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Verified Humans Only</h3>
                  <p className="text-gray-600 text-sm">World ID ensures every response comes from a unique, verified person</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Earn Cryptocurrency</h3>
                  <p className="text-gray-600 text-sm">Get rewarded with crypto for your time and valuable insights</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
                  <p className="text-gray-600 text-sm">Connect with verified participants from around the world</p>
                </div>
              </div>
            </div>

            {/* Marks System */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Understanding the Marks System</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What are Marks?</h3>
                  <p className="text-gray-600 mb-4">
                    Marks are our reward points that you earn by completing surveys and helping researchers. 
                    Think of them as your contribution score to the global research community.
                  </p>
                  <h3 className="font-semibold text-gray-900 mb-2">How to Earn Marks</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Complete surveys from verified researchers</li>
                    <li>• Help surveys reach their completion goals</li>
                    <li>• Purchase additional marks if needed</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Withdrawal System</h3>
                  <p className="text-gray-600 mb-4">
                    Once you accumulate 500 marks, you can withdraw them as cryptocurrency. 
                    This ensures fair distribution and encourages regular participation.
                  </p>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">500</div>
                      <div className="text-sm text-gray-600">Maximum marks you can hold</div>
                      <div className="text-sm text-gray-600">Minimum withdrawal amount</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Started */}
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
              <p className="text-gray-600 mb-6">
                Join thousands of verified users contributing to meaningful research worldwide
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Start Completing Surveys
                </Link>
                <Link 
                  href="/dashboard"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Your First Survey
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AppLayout>
  );
}