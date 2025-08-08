'use client';

import { useState } from 'react';
import { ConversationAnalysis } from '@/components/skills/conversation-analysis';
import { ImageAnalysis } from '@/components/skills/image-analysis';
import { DocumentSummarization } from '@/components/skills/document-summarization';

type Skill = 'conversation' | 'image' | 'document' | null;

export function SkillSelector() {
  const [selectedSkill, setSelectedSkill] = useState<Skill>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <label htmlFor="skill-select" className="block text-sm font-medium text-gray-900 mb-2">
          Select Skill
        </label>
        <select
          id="skill-select"
          value={selectedSkill || ''}
          onChange={(e) => setSelectedSkill(e.target.value as Skill)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
        >
          <option value="">Choose a skill...</option>
          <option value="conversation">Conversation Analysis</option>
          <option value="image">Image Analysis</option>
          <option value="document">Document/URL Summarization</option>
        </select>
      </div>

      {selectedSkill && (
        <div className="mt-6">
          {selectedSkill === 'conversation' && <ConversationAnalysis />}
          {selectedSkill === 'image' && <ImageAnalysis />}
          {selectedSkill === 'document' && <DocumentSummarization />}
        </div>
      )}
    </div>
  );
} 