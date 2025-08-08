import { SkillSelector } from '@/components/skill-selector';
import { Navigation } from '@/components/navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Playground
          </h1>
          <p className="text-lg text-gray-600">
            Try AI skills like conversation analysis, image analysis, and document summarization
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <SkillSelector />
        </div>
      </div>
    </div>
  );
}
