import { SurveyFeed } from "../components/SurveyFeed";
import { AppLayout } from "../components/AppLayout";
import { Navigation } from "../components/Navigation";
import { InfoModal } from "../components/InfoModal";
import { Footer } from "../components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        
        <main className="container mx-auto px-4 py-2 pb-24 flex-1">
          {/* Mobile Header */}
          <div className="md:hidden mb-3">
            <div className="flex items-center justify-center space-x-2 relative">
              <Image src="/logo.png" alt="Survey Savvy" width={32} height={32} className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">Survey Savvy</span>
             
            </div>
          </div>

          {/* Page Header */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Available Surveys</h1>

                <p className="text-gray-600">Help others by completing surveys and earn marks</p>
              </div>
               <div className="absolute right-0">
                <InfoModal iconSize="md" buttonClassName="p-2 hover:bg-blue-50 rounded-full" />
              </div>
              <Link 
                href="/dashboard"
                className="hidden md:block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Survey Feed */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow">
              <SurveyFeed />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </AppLayout>
  );
}
