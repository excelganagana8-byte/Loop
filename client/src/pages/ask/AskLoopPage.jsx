import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../../api/ask.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ChatMessage } from './components/ChatMessage.jsx';
import { StarterQuestions } from './components/StarterQuestions.jsx';
import { Button, Card } from '../../components/ui/index.js';
import {
  Sparkles,
  Send,
  RotateCcw,
  ShieldCheck,
  Loader2,
  HelpCircle
} from 'lucide-react';

export const AskLoopPage = () => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText = input) => {
    const q = questionText.trim();
    if (!q || loading) return;

    const userMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion({ question: q });
      const assistantMessage = {
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations,
        grounded: res.data.grounded
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Query Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to answer question'
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to retrieve an answer at this time. Please check your workspace feedback data and try again.',
          citations: [],
          grounded: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Ask LOOP</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Grounded Q&A
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Natural-language queries synthesized and verified against your workspace's customer feedback.
          </p>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={handleReset}
          >
            New Query
          </Button>
        )}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {messages.length === 0 ? (
          <div className="py-8 space-y-8 max-w-2xl mx-auto">
            {/* Welcome banner */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">What would you like to know?</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ask questions about trends, customer complaints, pricing feedback, or feature praise.
                Every response is cross-checked against your real data.
              </p>
            </div>

            {/* Starter prompts */}
            <StarterQuestions onSelect={(prompt) => handleSend(prompt)} />

            {/* Grounding guarantee callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                <strong>Zero hallucinated figures:</strong> LOOP precomputes counts in code and verifies citations before presenting answers.
              </span>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => <ChatMessage key={index} message={msg} />)
        )}

        {/* Thinking loader */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm text-xs text-slate-500 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Searching customer touchpoints & verifying statistics...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Sticky Input Bar */}
      <div className="shrink-0 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-sm space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your customer feedback... (Press Enter to submit)"
            rows={2}
            className="flex-1 resize-none border-0 focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent p-1 focus:outline-none"
          />
          <Button
            variant="primary"
            size="md"
            icon={Send}
            isLoading={loading}
            disabled={!input.trim()}
            onClick={() => handleSend()}
          >
            Ask
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Shift+Enter for newline
          </span>
          <span>Only queries feedback in your active workspace</span>
        </div>
      </div>
    </div>
  );
};
