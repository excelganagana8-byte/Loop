import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs } from '../../components/ui/index.js';
import { FeedbackForm } from './components/FeedbackForm.jsx';
import { CsvUploadTab } from './components/CsvUploadTab.jsx';
import { PenLine, Upload } from 'lucide-react';

export const SubmitFeedbackPage = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const navigate = useNavigate();

  const tabs = [
    { id: 'manual', label: 'Manual Entry', icon: PenLine },
    { id: 'csv', label: 'CSV Upload', icon: Upload }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ingest Feedback</h1>
          <p className="text-sm text-slate-500 mt-1">
            Collect customer feedback into your workspace for intelligent categorization and sentiment analysis.
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'manual' ? (
        <FeedbackForm onSuccess={() => navigate('/inbox')} />
      ) : (
        <CsvUploadTab />
      )}
    </div>
  );
};
