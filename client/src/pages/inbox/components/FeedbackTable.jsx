import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge
} from '../../../components/ui/index.js';
import { MessageSquare, AlertCircle } from 'lucide-react';

export const FeedbackTable = ({
  items = [],
  onSelectRow,
  selectedId
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead className="w-[35%]">Feedback Message</TableHead>
          <TableHead className="w-[18%]">Customer</TableHead>
          <TableHead className="w-[12%]">Source</TableHead>
          <TableHead className="w-[12%]">Sentiment</TableHead>
          <TableHead className="w-[13%]">Category</TableHead>
          <TableHead className="w-[10%]">Status</TableHead>
          <TableHead className="w-[10%] text-right">Date</TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isSelected = selectedId === item._id;
          const aiStatus = item.ai?.status || 'PENDING';

          return (
            <TableRow
              key={item._id}
              onClick={() => onSelectRow(item)}
              className={isSelected ? 'bg-brand-50/60 hover:bg-brand-50/80' : ''}
            >
              {/* Message preview */}
              <TableCell className="font-medium text-slate-800">
                <div className="flex items-start gap-2 max-w-md">
                  <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="truncate block" title={item.message}>
                    {item.message}
                  </span>
                </div>
              </TableCell>

              {/* Customer */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 text-xs truncate max-w-[140px]">
                    {item.customerName}
                  </span>
                  {item.customerEmail ? (
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {item.customerEmail}
                    </span>
                  ) : null}
                </div>
              </TableCell>

              {/* Source */}
              <TableCell>
                <Badge variant="default" size="sm">
                  {item.source ? item.source.replace('_', ' ') : 'OTHER'}
                </Badge>
              </TableCell>

              {/* Sentiment */}
              <TableCell>
                {aiStatus === 'PENDING' ? (
                  <Badge variant="PENDING" size="sm" dot>
                    Analyzing…
                  </Badge>
                ) : aiStatus === 'FAILED' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    AI Unavailable
                  </span>
                ) : item.ai?.sentiment ? (
                  <Badge variant={item.ai.sentiment} size="sm" dot>
                    {item.ai.sentiment}
                  </Badge>
                ) : (
                  <Badge variant="UNKNOWN" size="sm">
                    UNKNOWN
                  </Badge>
                )}
              </TableCell>

              {/* Category */}
              <TableCell>
                {aiStatus === 'PENDING' ? (
                  <span className="text-xs text-slate-400 italic">Processing…</span>
                ) : aiStatus === 'FAILED' ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : (
                  <Badge variant={item.ai?.category || 'OTHER'} size="sm">
                    {item.ai?.category ? item.ai.category.replace('_', ' ') : 'OTHER'}
                  </Badge>
                )}
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge variant={item.status} size="sm" dot>
                  {item.status ? item.status.replace('_', ' ') : 'NEW'}
                </Badge>
              </TableCell>

              {/* Date */}
              <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap">
                {formatDate(item.receivedAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
