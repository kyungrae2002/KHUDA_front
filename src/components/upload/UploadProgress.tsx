import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

export const UploadProgress: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center py-16 space-y-5 animate-slide-up">
    <LoadingSpinner size="lg" />
    <div className="text-center space-y-1">
      <p className="text-sm font-black text-slate-800">대화 내용을 분석하고 있습니다</p>
      <p className="text-xs text-slate-400">AI가 여행 정보를 추출하는 중입니다. 잠시만 기다려 주세요.</p>
    </div>
    <div className="flex space-x-1.5 mt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

export default UploadProgress;
