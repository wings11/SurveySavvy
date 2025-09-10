import { RanksView } from "../../components/RanksView";
import { AppLayout } from "../../components/AppLayout";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import Image from "next/image";

export default function RanksPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        
        <main className="container mx-auto px-4 py-0 pb-24 flex-1">
         

          {/* Page Header */}
          <div className="mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Rank System</h1>
              <p className="text-gray-600">Progress through the ranks by earning marks from helping surveys</p>
            </div>
          </div>

          {/* Ranks Content */}
          <div className="max-w-4xl mx-auto">
            <RanksView />
          </div>
        </main>
        
        <Footer />
      </div>
    </AppLayout>
  );
}
