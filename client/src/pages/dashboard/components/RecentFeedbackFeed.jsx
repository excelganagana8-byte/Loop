import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '../../../components/ui/index.js';
import { ArrowRight, User, Clock } from 'lucide-react';

export const RecentFeedbackFeed = ({ items = [] }) => {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader
        title="Recent Customer Feedback"
        description="Latest submissions across all channels."
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/inbox')}
          >
            View All
          </Button>
        }
      />
      <CardContent className="pt-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-4 text-center">No recent feedback recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate('/inbox')}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {item.customerName}
                    </span>
                    <Badge variant={item.source || 'OTHER'} size="sm">
                      {item.source ? item.source.replace(/_/g, ' ') : 'OTHER'}
                    </Badge>
                    <Badge variant={item.ai?.sentiment || 'UNKNOWN'} size="sm" dot>
                      {item.ai?.sentiment || 'UNKNOWN'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{item.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(item.receivedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
