import React, { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, FileSpreadsheet, Braces, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { normalizeConversationFile } from '../../utils/conversationParser';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileDropzoneProps {
  onFileReady: (
    file: File,
    normalizedText: string,
    format: 'txt' | 'csv' | 'json',
    warnings: string[]
  ) => void;
  onParseError?: (error: string) => void;
}

const ACCEPTED_EXTENSIONS = ['txt', 'csv', 'json'];
const ACCEPTED_MIME = {
  'text/plain':       ['.txt'],
  'text/csv':         ['.csv'],
  'application/json': ['.json'],
};

// ─── Icon per extension ───────────────────────────────────────────────────────

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'csv')  return <FileSpreadsheet className="h-7 w-7" />;
  if (ext === 'json') return <Braces className="h-7 w-7" />;
  return <FileText className="h-7 w-7" />;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileReady, onParseError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [warnings, setWarnings]         = useState<string[]>([]);
  const [isParsing, setIsParsing]       = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);
      setWarnings([]);

      if (rejectedFiles.length > 0) {
        const errMsg = '.txt, .csv, .json 파일만 업로드 가능합니다.';
        setError(errMsg);
        onParseError?.(errMsg);
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        const errMsg = `.${ext} 형식은 지원하지 않습니다. .txt, .csv, .json 파일을 사용해 주세요.`;
        setError(errMsg);
        onParseError?.(errMsg);
        return;
      }

      setIsParsing(true);
      const result = await normalizeConversationFile(file);
      setIsParsing(false);

      if (!result.ok) {
        if (result.fallbackText !== undefined) {
          // Fallback: use raw text and warn user
          setSelectedFile(file);
          setError(result.error);
          setWarnings(['파싱에 실패하여 원본 텍스트를 그대로 사용합니다.']);
          onFileReady(file, result.fallbackText, ext as 'txt' | 'csv' | 'json', [
            '파싱에 실패하여 원본 텍스트를 그대로 사용합니다.',
          ]);
        } else {
          setError(result.error);
          onParseError?.(result.error);
        }
        return;
      }

      setSelectedFile(file);
      const w = result.warnings ?? [];
      setWarnings(w);
      onFileReady(file, result.text, result.format, w);
    },
    [onFileReady, onParseError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxFiles: 1,
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    setWarnings([]);
  };

  return (
    <div className="w-full space-y-3">
      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 text-center ${
          isDragActive
            ? 'border-sky-400 bg-sky-50/60 scale-[1.01]'
            : selectedFile
            ? 'border-sky-300 bg-sky-50/30'
            : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/20'
        }`}
      >
        <input {...getInputProps()} />

        {isParsing ? (
          <div className="flex flex-col items-center space-y-3 animate-pulse">
            <div className="bg-sky-100 text-sky-500 p-3 rounded-xl">
              <Upload className="h-7 w-7" />
            </div>
            <p className="text-sm font-black text-slate-700">파일 파싱 중…</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center space-y-3 animate-slide-up">
            <div className="bg-sky-100 text-sky-600 p-3 rounded-xl">
              <FileIcon name={selectedFile.name} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatBytes(selectedFile.size)}</p>
            </div>
            <button
              onClick={handleRemove}
              className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors font-semibold uppercase tracking-wide"
            >
              <X className="h-3 w-3" />
              <span>다른 파일 선택</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-2xl transition-colors duration-300 ${isDragActive ? 'bg-sky-200 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">
                {isDragActive ? '여기에 파일을 놓으세요' : '파일을 끌어다 놓거나 클릭하여 선택'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                카카오톡 대화 내보내기 — <span className="font-semibold">.txt · .csv · .json</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start space-x-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error (shown alongside file if fallback mode) */}
      {error && !warnings.length && (
        <div className="flex items-start space-x-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
