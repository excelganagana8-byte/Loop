import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, Badge } from '../../../components/ui/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { importCsv } from '../../../api/feedback.api.js';
import {
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export const CsvUploadTab = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        addToast({
          type: 'error',
          title: 'Invalid File Format',
          message: 'Please select a valid .csv file'
        });
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `customerName,customerEmail,message,source,receivedAt
Sarah Connor,sarah@skynet-survivor.org,Reporting dashboard latency exceeds 8 seconds on initial login,SUPPORT_TICKET,2026-01-15
Alex Mercer,alex@mercer.dev,Would love a native dark mode toggle for night shifts,APP_REVIEW,2026-01-16
Jordan Belfort,jordan@stratton.io,Sales rep answered our onboarding question within 60 seconds,SURVEY,2026-01-17`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'loop-feedback-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setResult(null);

    try {
      const res = await importCsv(selectedFile);
      setResult(res.data);
      addToast({
        type: res.data.imported > 0 ? 'success' : 'info',
        title: 'Import Completed',
        message: `Imported ${res.data.imported} feedback items (${res.data.rejected.length} rejected).`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to process CSV file'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Bulk CSV Ingestion"
          description="Import batches of customer feedback with per-row validation and error diagnostics."
          action={
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          }
        />
        <CardContent className="space-y-6">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-brand-500 bg-brand-50/20'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-3 text-brand-600">
              <Upload className="w-5 h-5" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Click to browse or drop your CSV file here
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports standard CSV files up to 5MB</p>
              </div>
            )}
          </div>

          {/* Accepted Headers Reference */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <span className="font-semibold text-slate-800 block">Accepted Columns / Headers:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <code className="text-brand-600 font-mono font-semibold">customerName</code>: Name of customer (required)
              </div>
              <div>
                <code className="text-brand-600 font-mono font-semibold">message</code>: Feedback content (required, max 5000)
              </div>
              <div>
                <code className="text-brand-600 font-mono font-semibold">customerEmail</code>: Valid email address (optional)
              </div>
              <div>
                <code className="text-brand-600 font-mono font-semibold">source</code>: APP_REVIEW | SUPPORT_TICKET | SURVEY | SALES_NOTE | OTHER
              </div>
              <div>
                <code className="text-brand-600 font-mono font-semibold">receivedAt</code>: Date string e.g. 2026-01-15 (optional)
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              disabled={!selectedFile || uploading}
              onClick={handleReset}
            >
              Clear
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={Upload}
              isLoading={uploading}
              disabled={!selectedFile}
              onClick={handleUpload}
            >
              Upload & Process CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Diagnostics Results */}
      {result && (
        <Card className="border-slate-200 shadow-sm animate-in fade-in duration-200">
          <CardHeader
            title="Import Diagnostics"
            description="Summary of valid rows imported and invalid rows rejected."
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs text-emerald-700 font-semibold block">Successfully Imported</span>
                  <span className="text-xl font-bold text-emerald-900">{result.imported} rows</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs text-amber-700 font-semibold block">Rejected / Skipped</span>
                  <span className="text-xl font-bold text-amber-900">{result.rejected.length} rows</span>
                </div>
              </div>
            </div>

            {/* Rejected Rows Table */}
            {result.rejected.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block mb-2">
                  Rejected Row Details:
                </span>
                <div className="max-h-48 overflow-y-auto border border-rose-200 rounded-lg divide-y divide-rose-100 bg-rose-50/20 text-xs">
                  {result.rejected.map((r, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-800">Row {r.row}</span>
                      <span className="text-rose-600">{r.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.imported > 0 && (
              <div className="pt-3 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => navigate('/inbox')}
                >
                  View in Feedback Inbox
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
