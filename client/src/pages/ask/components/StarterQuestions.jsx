import React from 'react';
import { Sparkles, Bug, Star, DollarSign, Zap } from 'lucide-react';

const STARTER_PROMPTS = [
  {
    icon: Bug,
    text: 'What are the most frequent bugs or errors reported?'
  },
  {
    icon: Star,
    text: 'What features or capabilities do customers love the most?'
  },
  {
    icon: Zap,
    text: 'What are the top feature requests from recent feedback?'
  },
  {
    icon: DollarSign,
    text: 'Are there any recurring complaints regarding pricing or billing?'
  }
];

export const StarterQuestions = ({ onSelect }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-brand-600" />
        <span>Suggested Starter Questions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {STARTER_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelect(item.text)}
              className="text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/20 text-xs font-medium text-slate-700 transition-all shadow-2xs flex items-start gap-2.5 group"
            >
              <div className="p-1 rounded-md bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="leading-snug">{item.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
