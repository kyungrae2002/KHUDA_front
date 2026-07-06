import React, { useState } from 'react';
import { Eye, EyeOff, FileText, AlertTriangle } from 'lucide-react';

interface FilePreviewProps {
  fileName: string;
  content: string;
  format: 'txt' | 'csv' | 'json';
  warnings?: string[];
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  fileName,
  content,
  format,
  warnings = [],
}) => {
  const [expanded, setExpanded] = useState(false);

  const preview = expanded ? content : content.slice(0, 600);
  const isTruncated = content.length > 600 && !expanded;
  const lineCount = content.split('\n').length;

  const formatLabel: Record<string, string> = { txt: 'TXT', csv: 'CSV', json: 'JSON' };

  return (
    <div className="w-full space-y-2">
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="h-4 w-4 text-sky-500 flex-shrink-0" />
            <span className="text-xs font-black text-slate-800 truncate">{fileName}</span>
            <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">
              {formatLabel[format] ?? format.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-medium">{lineCount}줄</span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wide"
            >
              {expanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{expanded ? '접기' : '전체 보기'}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <pre className="px-4 py-3 text-[10px] leading-relaxed text-slate-600 font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
          {preview}
          {isTruncated && (
            <span className="text-slate-400 italic">
              {'\n'}… ({content.length - 600}자 더 있음 —{' '}
              <button
                onClick={() => setExpanded(true)}
                className="underline hover:text-slate-700 transition-colors"
              >
                전체 보기
              </button>
              )
            </span>
          )}
        </pre>

        {/* Local-only badge */}
        <div className="px-4 py-2 bg-sky-50/80 border-t border-sky-100 flex items-center space-x-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-600">
            ✓ 로컬 파싱 완료 — 백엔드에 전송되지 않습니다
          </span>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start space-x-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilePreview;
