import React, { useState } from 'react';
import {
  Drawer,
  Badge,
  Button,
  Card,
  CardHeader,
  CardContent
} from '../../../components/ui/index.js';
import { FEEDBACK_STATUS } from 'loop-shared';
import { useToast } from '../../../context/ToastContext.jsx';
import { updateFeedbackStatus, reanalyzeFeedback } from '../../../api/feedback.api.js';
import {
  Sparkles,
  User,
  Mail,
  Calendar,
  Layers,
  RotateCw,
  Check,
  Tag,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const STATUSES = [
  { value: FEEDBACK_STATUS.NEW, label: 'New' },
  { value: FEEDBACK_STATUS.IN_REVIEW, label: 'In Review' },
  { value: FEEDBACK_STATUS.RESOLVED, label: 'Resolved' },
  { value: FEEDBACK_STATUS.ARCHIVED, label: 'Archived' },
];

export const FeedbackDetailDrawer = ({
  item,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { addToast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  if (!item) return null;

  const handleStatusChange = async (newStatus) => {
    if (newStatus === item.status) return;
    setUpdatingStatus(true);
    try {
      const res = await updateFeedbackStatus(item._id, newStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Feedback marked as ${newStatus.replace('_', ' ')}`
      });
      if (onUpdate) {
        onUpdate(res.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error?.message || err.message
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await reanalyzeFeedback(item._id);
      if (res.data.ai?.status === 'DONE') {
        addToast({
          type: 'success',
          title: 'Analysis Complete',
          message: 'Claude classified sentiment & category successfully.'
        });
      } else {
        addToast({
          type: 'info',
          title: 'AI Unavailable',
          message: 'Anthropic API key unconfigured or call failed. Item marked FAILED.'
        });
      }
      if (onUpdate) {
        onUpdate(res.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Analysis Request Failed',
        message: err.response?.data?.error?.message || 'AI service error'
      });
    } finally {
      setReanalyzing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const aiStatus = item.ai?.status || 'PENDING';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Feedback Details"
      subtitle={`ID: ${item._id}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Status Changer Bar */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Workflow Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {STATUSES.map((s) => {
              const isActive = item.status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(s.value)}
                  className={`text-xs font-semibold py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isActive && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer & Metadata Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" /> Customer:
            </span>
            <span className="font-semibold text-slate-800">{item.customerName}</span>
          </div>

          {item.customerEmail && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
              </span>
              <span className="text-slate-700 font-mono text-[11px]">{item.customerEmail}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Channel:
            </span>
            <Badge variant="default" size="sm">
              {item.source ? item.source.replace('_', ' ') : 'OTHER'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Received:
            </span>
            <span className="text-slate-600">{formatDate(item.receivedAt)}</span>
          </div>
        </div>

        {/* Customer Message Body */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Original Message
          </label>
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap shadow-sm">
            {item.message}
          </div>
        </div>

        {/* AI Intelligence Section */}
        <Card className="border-brand-200/60 bg-gradient-to-b from-brand-50/20 to-transparent">
          <CardHeader
            title={
              <span className="flex items-center gap-2 text-brand-900 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-brand-600" /> AI Classification
              </span>
            }
            action={
              <Button
                variant="outline"
                size="sm"
                icon={RotateCw}
                isLoading={reanalyzing}
                onClick={handleReanalyze}
              >
                {aiStatus === 'FAILED' ? 'Retry Analysis' : 'Re-analyze'}
              </Button>
            }
          />
          <CardContent className="space-y-4 pt-4">
            {/* Fallback Mode Alert if FAILED */}
            {aiStatus === 'FAILED' ? (
              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-800 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>AI unavailable — retry</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Anthropic API key is not configured or the analysis request encountered a temporary error.
                  The feedback item remains safe and usable. Click "Retry Analysis" to re-process.
                </p>
              </div>
            ) : aiStatus === 'PENDING' ? (
              <div className="p-4 rounded-lg border border-sky-200 bg-sky-50/60 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
                <span className="text-xs font-medium text-sky-800">
                  AI analysis in progress (running asynchronously)...
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Sentiment</span>
                    <Badge variant={item.ai?.sentiment || 'UNKNOWN'} size="md" dot>
                      {item.ai?.sentiment || 'UNKNOWN'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Category</span>
                    <Badge variant={item.ai?.category || 'OTHER'} size="md">
                      {item.ai?.category ? item.ai.category.replace('_', ' ') : 'OTHER'}
                    </Badge>
                  </div>
                </div>

                {/* AI Summary */}
                <div>
                  <span className="text-xs text-slate-500 block mb-1">AI One-Line Summary</span>
                  <p className="text-xs font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                    {item.ai?.summary || (
                      <span className="text-slate-400 italic">No summary generated yet.</span>
                    )}
                  </p>
                </div>

                {/* Key Phrases */}
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Key Phrases</span>
                  {item.ai?.keyPhrases && item.ai.keyPhrases.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.ai.keyPhrases.map((phrase, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] bg-white text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                        >
                          <Tag className="w-3 h-3 text-brand-500" />
                          {phrase}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No key phrases extracted.</span>
                  )}
                </div>

                {/* Confidence & Model metadata */}
                {item.ai?.confidence !== undefined && item.ai.confidence > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Model Confidence: {Math.round(item.ai.confidence * 100)}%</span>
                    {item.ai.model && <span>Model: {item.ai.model}</span>}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Drawer>
  );
};
