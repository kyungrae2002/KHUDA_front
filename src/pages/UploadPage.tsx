import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import BackButton from '../components/common/BackButton';
import FileDropzone from '../components/upload/FileDropzone';
import FilePreview from '../components/upload/FilePreview';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

type PageState = 'idle' | 'ready' | 'error';

// ─── KakaoTalk export guide ───────────────────────────────────────────────────

const KakaoGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
          카카오톡 대화 내보내는 방법
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-4 py-4 bg-white text-xs text-slate-600 space-y-2 leading-relaxed animate-slide-up">
          <p className="font-bold text-slate-800">📱 카카오톡 앱에서</p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
            <li>대화방 오른쪽 상단 메뉴(⋮) 탭</li>
            <li><strong>대화 내보내기</strong> 선택</li>
            <li><strong>텍스트로 내보내기</strong> 선택</li>
            <li>저장된 <code className="bg-slate-100 px-1 rounded">.txt</code> 파일을 위 업로드 영역에 끌어다 놓기</li>
          </ol>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            * 업로드된 파일은 AI 대화 컨텍스트로만 사용되며, 백엔드 서버에 전송되지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ParsedFileInfo {
  file: File;
  text: string;
  format: 'txt' | 'csv' | 'json';
  warnings: string[];
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { setReferenceContext, resetTrip } = useTripStore();

  const [pageState, setPageState] = useState<PageState>('idle');
  const [parsedInfo, setParsedInfo] = useState<ParsedFileInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileReady = (
    file: File,
    normalizedText: string,
    format: 'txt' | 'csv' | 'json',
    warnings: string[]
  ) => {
    setReferenceContext(normalizedText);
    setParsedInfo({ file, text: normalizedText, format, warnings });
    setPageState('ready');
    setErrorMessage(null);
  };

  const handleParseError = (error: string) => {
    setErrorMessage(error);
    setPageState('error');
    setParsedInfo(null);
  };

  const handleStartChat = () => {
    if (!parsedInfo) return;
    // Reset chatMessages but keep referenceContext
    resetTrip();
    setReferenceContext(parsedInfo.text);
    navigate('/chat');
  };

  const handleRetry = () => {
    setPageState('idle');
    setParsedInfo(null);
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-screen bg-slate-50/40 text-slate-900">
      <BackButton to="/" label="Back" />

      <main className="w-full max-w-xl mx-auto px-5 py-16 md:py-20 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2 pt-6">
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-bold tracking-widest text-sky-600 uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Step 1 of 3 · Upload</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight">
            카카오톡 파일 업로드
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            여행을 계획했던 카카오톡 대화 파일을 올려주세요.
            <br />
            <span className="text-sky-600 font-semibold">.txt · .csv · .json</span> 형식 지원
          </p>
        </div>

        {/* Error state */}
        {pageState === 'error' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700 leading-relaxed">
              {errorMessage}
            </div>
            <button onClick={handleRetry} className="btn-pill-outline w-full py-3 uppercase tracking-widest text-xs">
              <RefreshCw className="h-4 w-4" />
              <span>다시 시도</span>
            </button>
          </div>
        )}

        {/* Idle + Ready state share the same dropzone */}
        {(pageState === 'idle' || pageState === 'ready') && (
          <div className="space-y-5 animate-slide-up">
            <FileDropzone
              onFileReady={handleFileReady}
              onParseError={handleParseError}
            />

            {/* File preview — shown after successful parse */}
            {pageState === 'ready' && parsedInfo && (
              <FilePreview
                fileName={parsedInfo.file.name}
                content={parsedInfo.text}
                format={parsedInfo.format}
                warnings={parsedInfo.warnings}
              />
            )}

            {/* Start chat button — only active when file is parsed */}
            <button
              onClick={handleStartChat}
              disabled={pageState !== 'ready'}
              className="btn-pill-outline w-full py-3.5 uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI와 대화 시작하기</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>

            <KakaoGuide />
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadPage;
