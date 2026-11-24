import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Pagination,
  TableSkeleton,
  EmptyState,
  ErrorState
} from '../../components/ui/index.js';
import { getFeedback, analyzeBatch } from '../../api/feedback.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { FeedbackFilters } from './components/FeedbackFilters.jsx';
import { FeedbackTable } from './components/FeedbackTable.jsx';
import { FeedbackDetailDrawer } from './components/FeedbackDetailDrawer.jsx';
import { PlusCircle, RefreshCw, Inbox, Sparkles } from 'lucide-react';

const INITIAL_FILTERS = {
  q: '',
  source: '',
  sentiment: '',
  category: '',
  status: '',
  sort: '-receivedAt'
};

export const FeedbackInboxPage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();

  const loadFeedback = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        sort: filters.sort,
        ...(filters.q && { q: filters.q }),
        ...(filters.source && { source: filters.source }),
        ...(filters.sentiment && { sentiment: filters.sentiment }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
      };

      const res = await getFeedback(params);
      setFeedbackData(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFeedback(1);
  }, [loadFeedback]);

  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleItemUpdate = (updatedItem) => {
    setSelectedItem(updatedItem);
    setFeedbackData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it._id === updatedItem._id ? updatedItem : it))
    }));
  };

  const handleBatchAnalyze = async () => {
    setBatchAnalyzing(true);
    try {
      const res = await analyzeBatch();
      addToast({
        type: 'info',
        title: 'Batch Analysis Finished',
        message: `Processed ${res.data.total} items (${res.data.successful} classified, ${res.data.failed} unavailable).`
      });
      loadFeedback(feedbackData.page);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Batch Analysis Failed',
        message: err.response?.data?.error?.message || 'Error processing batch'
      });
    } finally {
      setBatchAnalyzing(false);
    }
  };

  const isFiltering = Boolean(
    filters.q ||
    filters.source ||
    filters.sentiment ||
    filters.category ||
    filters.status
  );

  const pendingCount = feedbackData.items.filter(
    (it) => it.ai?.status === 'PENDING' || it.ai?.status === 'FAILED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feedback Inbox</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, filter, and review customer feedback with AI-assisted sentiment and categories.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={Sparkles}
              isLoading={batchAnalyzing}
              onClick={handleBatchAnalyze}
              className="text-brand-600 border-brand-200 hover:bg-brand-50"
            >
              Analyze Pending ({pendingCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={loading}
            onClick={() => loadFeedback(feedbackData.page)}
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

      {/* Filter Component */}
      <FeedbackFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Data View */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadFeedback(feedbackData.page)} />
      ) : feedbackData.items.length === 0 ? (
        isFiltering ? (
          <EmptyState
            icon={Inbox}
            title="No matching feedback"
            description="No feedback matches the selected filters or keyword search. Try broadening your criteria."
            actionLabel="Clear Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="No feedback collected yet"
            description="Submit your first customer review or ticket to see LOOP in action."
            actionLabel="Submit Feedback"
            onAction={() => navigate('/submit')}
          />
        )
      ) : (
        <div className="space-y-4">
          <FeedbackTable
            items={feedbackData.items}
            selectedId={selectedItem?._id}
            onSelectRow={handleRowClick}
          />

          <Pagination
            currentPage={feedbackData.page}
            totalPages={feedbackData.totalPages}
            totalItems={feedbackData.total}
            pageSize={feedbackData.limit}
            onPageChange={(newPage) => loadFeedback(newPage)}
          />
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      <FeedbackDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={selectedItem}
        onUpdate={handleItemUpdate}
      />
    </div>
  );
};
