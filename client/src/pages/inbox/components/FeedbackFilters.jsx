import React from 'react';
import {
  FEEDBACK_SOURCES,
  FEEDBACK_STATUS,
  AI_SENTIMENTS,
  AI_CATEGORIES
} from 'loop-shared';
import { Input, Select, Button } from '../../../components/ui/index.js';
import { Search, X, RotateCcw, Filter } from 'lucide-react';

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: FEEDBACK_SOURCES.APP_REVIEW, label: 'App Review' },
  { value: FEEDBACK_SOURCES.SUPPORT_TICKET, label: 'Support Ticket' },
  { value: FEEDBACK_SOURCES.SURVEY, label: 'Survey' },
  { value: FEEDBACK_SOURCES.SALES_NOTE, label: 'Sales Note' },
  { value: FEEDBACK_SOURCES.OTHER, label: 'Other' },
];

const SENTIMENT_OPTIONS = [
  { value: '', label: 'All Sentiments' },
  { value: AI_SENTIMENTS.POSITIVE, label: 'Positive' },
  { value: AI_SENTIMENTS.NEGATIVE, label: 'Negative' },
  { value: AI_SENTIMENTS.NEUTRAL, label: 'Neutral' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: AI_CATEGORIES.BUG, label: 'Bug' },
  { value: AI_CATEGORIES.FEATURE_REQUEST, label: 'Feature Request' },
  { value: AI_CATEGORIES.PRICING, label: 'Pricing' },
  { value: AI_CATEGORIES.USABILITY, label: 'Usability' },
  { value: AI_CATEGORIES.CUSTOMER_SUPPORT, label: 'Customer Support' },
  { value: AI_CATEGORIES.PERFORMANCE, label: 'Performance' },
  { value: AI_CATEGORIES.PRAISE, label: 'Praise' },
  { value: AI_CATEGORIES.OTHER, label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: FEEDBACK_STATUS.NEW, label: 'New' },
  { value: FEEDBACK_STATUS.IN_REVIEW, label: 'In Review' },
  { value: FEEDBACK_STATUS.RESOLVED, label: 'Resolved' },
  { value: FEEDBACK_STATUS.ARCHIVED, label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: '-receivedAt', label: 'Newest First' },
  { value: 'receivedAt', label: 'Oldest First' },
];

export const FeedbackFilters = ({
  filters,
  onChange,
  onReset
}) => {
  const hasActiveFilters = Boolean(
    filters.q ||
    filters.source ||
    filters.sentiment ||
    filters.category ||
    filters.status ||
    filters.sort !== '-receivedAt'
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Input
          placeholder="Search customer feedback by keyword, name, or email..."
          icon={Search}
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
        {filters.q && (
          <button
            type="button"
            onClick={() => onChange({ q: '' })}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
        <Select
          options={SOURCE_OPTIONS}
          value={filters.source}
          onChange={(e) => onChange({ source: e.target.value })}
          placeholder=""
        />

        <Select
          options={SENTIMENT_OPTIONS}
          value={filters.sentiment}
          onChange={(e) => onChange({ sentiment: e.target.value })}
          placeholder=""
        />

        <Select
          options={CATEGORY_OPTIONS}
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder=""
        />

        <Select
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          placeholder=""
        />

        <Select
          options={SORT_OPTIONS}
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          placeholder=""
        />
      </div>

      {/* Active filters status / reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-brand-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters active</span>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset all</span>
          </button>
        </div>
      )}
    </div>
  );
};
