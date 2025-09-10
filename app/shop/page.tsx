"use client";
import { AppLayout } from "../../components/AppLayout";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { PointPurchase } from "../../components/PointPurchase";
import { MarksManager } from "../../components/MarksManager";
import Image from "next/image";

export default function Shop() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        
        <main className="container mx-auto px-4 py-2 pb-24 flex-1">
         

          {/* Page Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Shop</h1>
            <p className="text-gray-600">Purchase marks and points to boost your survey activities</p>
          </div>

          {/* Shop Introduction */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Welcome to the Survey Savvy Shop</h2>
                <p className="text-gray-600 text-sm">
                  Purchase additional marks and points to enhance your survey experience and maximize your earning potential.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Points Purchase */}
              <div className="bg-white rounded-xl shadow-sm">
                <PointPurchase />
              </div>

              {/* Marks Management */}
              <div className="bg-white rounded-xl shadow-sm">
                <MarksManager />
              </div>
            </div>

            {/* Shop Information */}
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How the Shop Works</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📊 Points System</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Points help you rank up faster and show your commitment to the survey community. 
                    Purchase weekly point packages to boost your ranking.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Weekly purchase limit applies</li>
                    <li>• Contributes to your rank progression</li>
                    <li>• Shows community commitment</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">💰 Marks System</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Marks are your pathway to cryptocurrency rewards. Purchase additional marks if needed 
                    or manage your existing marks for withdrawal.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Maximum 500 marks capacity</li>
                    <li>• Withdraw at 500 marks to World Chain</li>
                    <li>• Earn through survey completion</li>
                  </ul>
                </div>
              </div>
              
              {/* Safety Notice */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs">ℹ️</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">Safe & Secure Transactions</h5>
                    <p className="text-sm text-blue-700">
                      All purchases are processed securely through World ID verification. 
                      Your cryptocurrency transactions are protected by blockchain technology.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </AppLayout>
  );
}
