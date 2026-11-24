import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInsights,
  generateInsights
} from '../../api/insights.api.js';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  CardSkeleton,
  EmptyState,
  ErrorState
} from '../../components/ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Sparkles,
  RotateCw,
  TrendingUp,
  Lightbulb,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

const TYPE_CONFIG = {
  THEME: {
    label: 'Core Theme',
    badgeVariant: 'purple',
    icon: Layers,
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  TREND: {
    label: 'Emerging Trend',
    badgeVariant: 'info',
    icon: TrendingUp,
    color: 'text-sky-600 bg-sky-50 border-sky-200'
  },
  RECOMMENDATION: {
    label: 'Recommendation',
    badgeVariant: 'success',
    icon: Lightbulb,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }
};

export const InsightsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInsights();
      setInsights(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateInsights();
      setInsights(res.data);
      addToast({
        type: 'success',
        title: 'Insights Generated',
        message: `Successfully synthesized ${res.data.length} strategic insights from your feedback.`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.response?.data?.error?.message || err.message || 'Error generating insights'
      });
    } finally {
      setGenerating(false);
    }
  };

  const filteredInsights = filterType === 'ALL'
    ? insights
    : insights.filter((ins) => ins.type === filterType);

  return (
    <div className="space-y-6">
      {/* Page Title & Regenerate Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Insights & Synthesis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Autonomous themes, emerging trends, and actionable recommendations synthesized from your customer touchpoints.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={RotateCw}
          isLoading={generating}
          onClick={handleGenerate}
        >
          Regenerate Insights
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Insights ({insights.length})
        </button>
        <button
          onClick={() => setFilterType('THEME')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'THEME'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Themes ({insights.filter(i => i.type === 'THEME').length})
        </button>
        <button
          onClick={() => setFilterType('TREND')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'TREND'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Trends ({insights.filter(i => i.type === 'TREND').length})
        </button>
        <button
          onClick={() => setFilterType('RECOMMENDATION')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'RECOMMENDATION'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Recommendations ({insights.filter(i => i.type === 'RECOMMENDATION').length})
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadInsights} />
      ) : insights.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No AI insights generated yet"
          description="Synthesize your customer feedback to identify high-impact recurring themes, sentiment shifts, and key recommendations."
          actionLabel="Generate Insights Now"
          onAction={handleGenerate}
        />
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={`No ${filterType.toLowerCase()} insights`}
          description="Try switching filters or click 'Regenerate Insights' to synthesize new findings."
          actionLabel="View All Insights"
          onAction={() => setFilterType('ALL')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInsights.map((insight) => {
            const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.THEME;
            const Icon = config.icon;

            return (
              <Card
                key={insight._id}
                className="p-6 hover:border-slate-300 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        {config.label}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{insight.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Window: {insight.windowDays || 30}d
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mt-2 mb-4">
                  {insight.body}
                </p>

                {/* Evidence & Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Grounded in <strong className="text-slate-800">{insight.evidence?.count || 0}</strong> verified customer touchpoints
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => navigate('/inbox')}
                  >
                    Explore in Inbox
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
