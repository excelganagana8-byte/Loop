import React from 'react';
import { Card, CardHeader, CardContent, Badge } from '../../../components/ui/index.js';
import { Tag, AlertCircle } from 'lucide-react';

export const TopIssuesList = ({ categories = [], keyPhrases = [] }) => {
  return (
    <Card>
      <CardHeader
        title="Top Recurring Themes & Keywords"
        description="Most frequent categories and key phrases extracted by AI."
      />
      <CardContent className="space-y-5 pt-3">
        {/* Top Categories */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
            Frequent Categories
          </span>
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No category data yet.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={c.category} size="sm">
                      {c.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {c.count} items
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Key Phrases */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
            Key Mentioned Phrases
          </span>
          {keyPhrases.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No key phrases identified yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keyPhrases.map((kp) => (
                <span
                  key={kp.phrase}
                  className="inline-flex items-center gap-1.5 text-xs bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:border-brand-300 transition-colors"
                >
                  <Tag className="w-3 h-3 text-brand-500" />
                  <span className="font-medium">{kp.phrase}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.2 rounded-full">
                    {kp.count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
