import { CreateSurvey } from "../../components/CreateSurvey";
import { AppLayout } from "../../components/AppLayout";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import Image from "next/image";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        
        <main className="container mx-auto px-4 py-2 pb-24 flex-1">
          {/* Page Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-600">Create surveys and manage your survey activity</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Create Survey */}
            <div className="bg-white rounded-lg shadow">
              <CreateSurvey />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </AppLayout>
  );
}
