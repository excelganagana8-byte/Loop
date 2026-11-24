import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FEEDBACK_SOURCES,
  FEEDBACK_SOURCE_LIST
} from 'loop-shared';
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardContent,
  CardFooter
} from '../../../components/ui/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { createFeedback } from '../../../api/feedback.api.js';
import { Send, CheckCircle2, RotateCcw } from 'lucide-react';

const formSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120),
  customerEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  source: z.enum(FEEDBACK_SOURCE_LIST, {
    errorMap: () => ({ message: 'Please select a source' })
  }),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(5000, 'Max 5000 characters'),
  receivedAt: z.string().optional()
});

const SOURCE_OPTIONS = [
  { value: FEEDBACK_SOURCES.APP_REVIEW, label: 'App Review' },
  { value: FEEDBACK_SOURCES.SUPPORT_TICKET, label: 'Support Ticket' },
  { value: FEEDBACK_SOURCES.SURVEY, label: 'Survey Response' },
  { value: FEEDBACK_SOURCES.SALES_NOTE, label: 'Sales Note' },
  { value: FEEDBACK_SOURCES.OTHER, label: 'Other' },
];

export const FeedbackForm = ({ onSuccess }) => {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      source: FEEDBACK_SOURCES.SUPPORT_TICKET,
      message: '',
      receivedAt: new Date().toISOString().split('T')[0]
    }
  });

  const messageValue = watch('message', '');

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        receivedAt: values.receivedAt ? new Date(values.receivedAt).toISOString() : new Date().toISOString()
      };
      const res = await createFeedback(payload);
      addToast({
        type: 'success',
        title: 'Feedback Submitted',
        message: 'Feedback saved and queued for AI analysis.'
      });
      reset();
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to submit feedback';
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: errorMsg
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader
        title="Submit Customer Feedback"
        description="Enter feedback manually from any customer touchpoint. AI classification starts automatically."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              placeholder="e.g. Alex Mercer"
              error={errors.customerName?.message}
              {...register('customerName')}
            />
            <Input
              label="Customer Email"
              type="email"
              placeholder="e.g. alex@example.com"
              error={errors.customerEmail?.message}
              {...register('customerEmail')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Feedback Source *"
              options={SOURCE_OPTIONS}
              error={errors.source?.message}
              {...register('source')}
            />
            <Input
              label="Date Received"
              type="date"
              error={errors.receivedAt?.message}
              {...register('receivedAt')}
            />
          </div>

          <Textarea
            label="Feedback Message *"
            placeholder="Paste or write the customer feedback here..."
            rows={5}
            maxLength={5000}
            value={messageValue}
            error={errors.message?.message}
            {...register('message')}
          />
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={() => reset()}
          >
            Reset Form
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Send}
            isLoading={submitting}
          >
            Submit Feedback
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
