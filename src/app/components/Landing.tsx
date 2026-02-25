import { Calendar, Users, Stethoscope, Sparkles } from 'lucide-react';

interface LandingProps {
  onLoginClick: () => void;
}

export default function Landing({ onLoginClick }: LandingProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-pink-600" />
            <span className="text-xl font-semibold text-gray-900">BeautyClinic</span>
          </div>
          <button
            onClick={onLoginClick}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 to-purple-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl mb-6 text-gray-900">
            Modern Beauty Clinic Management
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Streamline your beauty clinic operations with intelligent scheduling,
            patient management, and comprehensive treatment tracking.
          </p>
          <button
            onClick={onLoginClick}
            className="px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-lg"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl text-center mb-12 text-gray-900">
            Everything You Need to Manage Your Clinic
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="w-12 h-12 text-pink-600" />}
              title="Smart Scheduling"
              description="Drag-and-drop calendar with daily and monthly views. Easily manage and reschedule appointments."
            />
            <FeatureCard
              icon={<Users className="w-12 h-12 text-purple-600" />}
              title="Patient Management"
              description="Keep track of patient information, treatment history, and preferences in one place."
            />
            <FeatureCard
              icon={<Stethoscope className="w-12 h-12 text-pink-600" />}
              title="Doctor Portal"
              description="Individual portals for doctors to view their schedules and manage their appointments."
            />
            <FeatureCard
              icon={<Sparkles className="w-12 h-12 text-purple-600" />}
              title="Treatment Catalog"
              description="Comprehensive service and treatment management with pricing and duration tracking."
            />
            <FeatureCard
              icon={<Calendar className="w-12 h-12 text-pink-600" />}
              title="Multi-View Calendar"
              description="Switch between daily and monthly calendar views to suit your workflow."
            />
            <FeatureCard
              icon={<Users className="w-12 h-12 text-purple-600" />}
              title="Team Management"
              description="Manage doctor schedules, availability, and specializations efficiently."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-pink-400" />
            <span className="text-lg">BeautyClinic</span>
          </div>
          <p className="text-gray-400">
            © 2025 BeautyClinic Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
