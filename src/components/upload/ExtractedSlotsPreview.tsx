import React from 'react';
import { type SlotOut, type SlotField } from '../../types/trip';
import { CheckCircle2, Circle, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExtractedSlotsPreviewProps {
  slots: SlotOut[];
  rawUnparsedCount: number;
  onContinue: () => void;
}

const SLOT_LABELS: Record<SlotField, string> = {
  destination: '목적지',
  date:        '날짜/기간',
  budget:      '예산',
  headcount:   '인원',
  transport:   '이동 수단',
  constraint:  '제약 사항',
  wishlist:    '희망 사항',
};

const FIELD_ORDER: SlotField[] = [
  'destination', 'date', 'budget', 'headcount', 'transport', 'constraint', 'wishlist',
];

function StatusBadge({ status }: { status: SlotOut['status'] }) {
  if (status === 'confirmed') return (
    <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5">
      <CheckCircle2 className="h-2.5 w-2.5" /><span>확인됨</span>
    </span>
  );
  if (status === 'conflict') return (
    <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
      <AlertTriangle className="h-2.5 w-2.5" /><span>충돌</span>
    </span>
  );
  return (
    <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
      <Circle className="h-2.5 w-2.5" /><span>미확인</span>
    </span>
  );
}

export const ExtractedSlotsPreview: React.FC<ExtractedSlotsPreviewProps> = ({
  slots,
  rawUnparsedCount,
  onContinue,
}) => {
  const slotMap: Partial<Record<SlotField, SlotOut>> = {};
  slots.forEach((s) => { slotMap[s.field] = s; });

  const confirmedCount = slots.filter((s) => s.status === 'confirmed').length;
  const undecidedCount = slots.filter((s) => s.status === 'undecided').length;
  const conflictCount  = slots.filter((s) => s.status === 'conflict').length;

  return (
    <div className="w-full space-y-5 animate-slide-up">
      {/* Summary header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
        <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">분석 결과</span>
        <h3 className="text-base font-black text-slate-950 mt-1">카카오톡 대화에서 추출된 정보</h3>

        <div className="flex items-center space-x-3 mt-3 flex-wrap gap-2">
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>확인됨 {confirmedCount}개</span>
          </span>
          {undecidedCount > 0 && (
            <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-3 py-1 text-xs font-bold">
              <Circle className="h-3 w-3" />
              <span>미확인 {undecidedCount}개</span>
            </span>
          )}
          {conflictCount > 0 && (
            <span className="inline-flex items-center space-x-1 bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1 text-xs font-bold">
              <AlertTriangle className="h-3 w-3" />
              <span>충돌 {conflictCount}개</span>
            </span>
          )}
        </div>

        {rawUnparsedCount > 0 && (
          <div className="mt-3 flex items-start space-x-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{rawUnparsedCount}개의 메시지를 인식하지 못했습니다. AI 대화에서 직접 보완할 수 있습니다.</span>
          </div>
        )}
      </div>

      {/* Slot cards */}
      <div className="space-y-2">
        {FIELD_ORDER.map((field) => {
          const slot = slotMap[field];
          const status = slot?.status ?? 'undecided';
          const value  = slot?.value || '';
          const isConfirmed = status === 'confirmed';
          const isConflict  = status === 'conflict';

          return (
            <div
              key={field}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                isConfirmed ? 'bg-white border-slate-900'
                : isConflict ? 'bg-red-50/60 border-red-200'
                : 'bg-white border-slate-150'
              }`}
            >
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {SLOT_LABELS[field]}
                </span>
                <p className={`text-xs font-semibold truncate mt-0.5 ${
                  isConfirmed ? 'text-slate-900'
                  : isConflict ? 'text-red-700'
                  : 'text-slate-400 italic'
                }`}>
                  {isConfirmed ? value : isConflict ? `⚠ ${value || '충돌 감지됨'}` : 'AI와 대화로 확인 예정'}
                </p>
              </div>
              <StatusBadge status={status} />
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="btn-pill-outline w-full py-3.5 uppercase tracking-widest text-xs"
      >
        <span>AI와 대화 시작하기</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ExtractedSlotsPreview;
