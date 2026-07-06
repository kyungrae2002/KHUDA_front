import React, { useState } from 'react';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface DaysInputProps {
  onConfirm: (days: number) => void;
  isLoading: boolean;
  hasError?: boolean;
  autoDays?: number | null;
}

export const DaysInput: React.FC<DaysInputProps> = ({ onConfirm, isLoading, hasError, autoDays }) => {
  const [days, setDays] = useState(autoDays || 3);
  const [showOverride, setShowOverride] = useState(false);

  const decrement = () => setDays((d) => Math.max(1, d - 1));
  const increment = () => setDays((d) => Math.min(14, d + 1));

  if (autoDays && isLoading && !showOverride) {
    return (
      <div className="w-full bg-white border border-slate-950 rounded-2xl p-5 animate-slide-up text-center">
        <LoadingSpinner size="md" text={
          <div className="flex flex-col items-center">
            <div>{autoDays}일 일정을 생성하고 있습니다...</div>
            <div className="text-[10px] mt-1.5 text-slate-400 font-normal">장소를 꼼꼼히 찾고 있어요, 최대 1-2분 정도 걸릴 수 있어요</div>
          </div>
        } />
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-950 rounded-2xl p-5 animate-slide-up text-left">
      <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
        Step 2 of 2
      </span>
      <h3 className="text-sm font-black text-slate-900 mt-1 mb-1">여행 일수를 선택하세요</h3>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        몇 박 며칠의 일정을 원하시나요? AI가 최적의 동선을 생성합니다.
      </p>

      {/* Stepper */}
      <div className="flex items-center space-x-4 mb-5">
        <button
          onClick={decrement}
          disabled={days <= 1 || isLoading}
          className="btn-pill-outline py-2 px-3 disabled:opacity-30"
          aria-label="일수 줄이기"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="text-center">
          <span className="text-3xl font-black text-slate-950">{days}</span>
          <span className="text-sm text-slate-500 font-semibold ml-1">일</span>
        </div>

        <button
          onClick={increment}
          disabled={days >= 14 || isLoading}
          className="btn-pill-outline py-2 px-3 disabled:opacity-30"
          aria-label="일수 늘리기"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-2">
          <LoadingSpinner size="md" text={
            <div className="flex flex-col items-center">
              <div>여행 일정을 생성하고 있습니다...</div>
              <div className="text-[10px] mt-1.5 text-slate-400 font-normal">장소를 꼼꼼히 찾고 있어요, 최대 1-2분 정도 걸릴 수 있어요</div>
            </div>
          } />
        </div>
      ) : hasError ? (
        <div className="space-y-3">
          <p className="text-xs text-red-500 font-semibold text-center">일정 생성 시간이 초과되었거나 오류가 발생했습니다.</p>
          <button
            onClick={() => onConfirm(days)}
            className="btn-pill-outline w-full py-3 uppercase tracking-wider text-xs border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600"
          >
            <span>다시 시도하기</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onConfirm(days)}
          className="btn-pill-outline w-full py-3 uppercase tracking-wider text-xs"
        >
          <span>{days}일 일정 생성하기</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default DaysInput;

