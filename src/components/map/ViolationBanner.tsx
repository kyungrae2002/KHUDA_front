import React, { useState } from 'react';
import { type ViolationOut } from '../../types/trip';
import { AlertTriangle, X } from 'lucide-react';

interface ViolationBannerProps {
  violations: ViolationOut[];
}

export const ViolationBanner: React.FC<ViolationBannerProps> = ({ violations }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || violations.length === 0) return null;

  return (
    <div className="w-full bg-red-50 border-b border-red-200 px-4 md:px-6 py-3 animate-slide-up">
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
        <div className="flex items-start space-x-3 text-left">
          <AlertTriangle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-red-700 uppercase tracking-wide mb-1">
              {violations.length}개의 제약 조건 충돌이 발생했습니다
            </p>
            <ul className="space-y-0.5">
              {violations.map((v, i) => (
                <li key={i} className="text-xs text-red-600">
                  • [{v.type}] {v.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ViolationBanner;
