import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSummary,
  getDistribution,
  getTrends,
  getTopIssues,
  getRecentFeedback
} from '../../api/analytics.api.js';
import {
  Button,
  Select,
  CardSkeleton,
  EmptyState,
  ErrorState
} from '../../components/ui/index.js';
import { MetricCard } from './components/MetricCard.jsx';
import { VolumeTrendChart } from './components/VolumeTrendChart.jsx';
import { SentimentChart } from './components/SentimentChart.jsx';
import { CategoryChart } from './components/CategoryChart.jsx';
import { SourceDonutChart } from './components/SourceDonutChart.jsx';
import { TopIssuesList } from './components/TopIssuesList.jsx';
import { RecentFeedbackFeed } from './components/RecentFeedbackFeed.jsx';
import {
  MessageSquare,
  Smile,
  Frown,
  Meh,
  RefreshCw,
  PlusCircle,
  Inbox,
  TrendingUp
} from 'lucide-react';

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' }
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [sentimentDist, setSentimentDist] = useState([]);
  const [categoryDist, setCategoryDist] = useState([]);
  const [sourceDist, setSourceDist] = useState([]);
  const [trends, setTrends] = useState([]);
  const [topIssues, setTopIssues] = useState({ categories: [], keyPhrases: [] });
  const [recent, setRecent] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes,
        sentimentRes,
        categoryRes,
        sourceRes,
        trendsRes,
        topIssuesRes,
        recentRes
      ] = await Promise.all([
        getSummary(),
        getDistribution({ by: 'sentiment', range }),
        getDistribution({ by: 'category', range }),
        getDistribution({ by: 'source', range }),
        getTrends({ range }),
        getTopIssues(),
        getRecentFeedback()
      ]);

      setSummary(summaryRes.data);
      setSentimentDist(sentimentRes.data.data);
      setCategoryDist(categoryRes.data.data);
      setSourceDist(sourceRes.data.data);
      setTrends(trendsRes.data);
      setTopIssues(topIssuesRes.data);
      setRecent(recentRes.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  if (summary && summary.total === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time metrics and AI-driven feedback analytics.</p>
          </div>
        </div>
        <EmptyState
          icon={Inbox}
          title="No feedback in this workspace yet"
          description="Submit feedback manually or import a CSV to populate real-time analytics and sentiment metrics."
          actionLabel="Submit Feedback"
          onAction={() => navigate('/submit')}
        />
      </div>
    );
  }

  const total = summary?.total || 0;
  const posCount = summary?.sentimentCounts?.POSITIVE || 0;
  const negCount = summary?.sentimentCounts?.NEGATIVE || 0;
  const neuCount = (summary?.sentimentCounts?.NEUTRAL || 0) + (summary?.sentimentCounts?.UNKNOWN || 0);

  const posPct = total > 0 ? Math.round((posCount / total) * 100) : 0;
  const negPct = total > 0 ? Math.round((negCount / total) * 100) : 0;
  const neuPct = total > 0 ? Math.round((neuCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated intelligence over your customer feedback data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-40">
            <Select
              options={RANGE_OPTIONS}
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder=""
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={loading}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/submit')}
          >
            Add Feedback
          </Button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Feedback"
          value={total}
          subtitle={`Resolution rate: ${summary?.resolutionRate || 0}% • Avg ${summary?.avgPerDay || 0}/day`}
          icon={MessageSquare}
          iconBg="bg-brand-50 text-brand-600"
        />

        <MetricCard
          title="Positive Sentiment"
          value={posCount}
          badge={`${posPct}%`}
          trendColor="bg-emerald-50 text-emerald-700"
          subtitle="Customer satisfaction & praise"
          icon={Smile}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <MetricCard
          title="Negative Sentiment"
          value={negCount}
          badge={`${negPct}%`}
          trendColor="bg-rose-50 text-rose-700"
          subtitle="Friction, bugs & complaints"
          icon={Frown}
          iconBg="bg-rose-50 text-rose-600"
        />

        <MetricCard
          title="Neutral / Unknown"
          value={neuCount}
          badge={`${neuPct}%`}
          trendColor="bg-slate-100 text-slate-600"
          subtitle="Inquiries & objective notes"
          icon={Meh}
          iconBg="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Charts Row 1: Volume Trend & Sentiment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VolumeTrendChart data={trends} />
        </div>
        <div className="lg:col-span-1">
          <SentimentChart data={sentimentDist} />
        </div>
      </div>

      {/* Charts Row 2: Category Bar & Source Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={categoryDist} />
        <SourceDonutChart data={sourceDist} />
      </div>

      {/* Row 3: Top Recurring Issues & Recent Feedback Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopIssuesList
          categories={topIssues.categories}
          keyPhrases={topIssues.keyPhrases}
        />
        <RecentFeedbackFeed items={recent} />
      </div>
    </div>
  );
};
