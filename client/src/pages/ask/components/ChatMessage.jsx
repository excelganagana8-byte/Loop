import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/ui/index.js';
import { Sparkles, User, CheckCircle2, Quote, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export const ChatMessage = ({ message }) => {
  const navigate = useNavigate();
  const [showCitations, setShowCitations] = useState(true);
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-2xl bg-brand-600 text-white rounded-2xl rounded-tr-sm p-4 text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 font-bold text-xs mt-1">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  const { content, citations = [], grounded = true } = message;

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
        <Sparkles className="w-4 h-4 text-brand-400" />
      </div>

      <div className="flex-1 max-w-3xl space-y-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm p-5 shadow-sm text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-3">
          <div>{content}</div>

          {/* Grounding Verification Badge */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-emerald-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Grounded in workspace data</span>
            </div>

            {citations.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                <span>{citations.length} Verified Citation{citations.length > 1 ? 's' : ''}</span>
                {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Citations List */}
        {showCitations && citations.length > 0 && (
          <div className="space-y-2 pl-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Direct Feedback Citations:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {citations.map((cite, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/inbox')}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-400 hover:bg-brand-50/20 cursor-pointer transition-colors text-xs space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-800 truncate flex items-center gap-1">
                      <Quote className="w-3 h-3 text-brand-500" />
                      {cite.customerName || 'Customer'}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" />
                  </div>
                  <p className="text-slate-600 italic line-clamp-2">
                    "{cite.snippet}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
