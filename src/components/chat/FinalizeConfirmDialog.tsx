import React from 'react';
import { type SlotOut, type SlotField } from '../../types/trip';
import { CheckCircle2, Circle, AlertTriangle, Loader2, RefreshCw, Check } from 'lucide-react';

interface FinalizeConfirmDialogProps {
  /** Primary mode: all client slots confirmed — ready to send final CSV */
  mode: 'confirm' | 'correction';
  /** The slots that are confirmed (for mode=confirm) */
  confirmedSlots?: SlotOut[];
  /** The slots that need correction (only for mode=correction) */
  rejectedSlots?: SlotOut[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
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

export const FinalizeConfirmDialog: React.FC<FinalizeConfirmDialogProps> = ({
  mode,
  confirmedSlots = [],
  rejectedSlots = [],
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const isCorrection = mode === 'correction';

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-slide-up">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full mx-4 p-6 space-y-5">

        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          {isCorrection ? (
            <div className="bg-amber-50 text-amber-500 p-3 rounded-2xl">
              <AlertTriangle className="h-7 w-7" />
            </div>
          ) : (
            <div className="bg-sky-50 text-sky-500 p-3 rounded-2xl">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          )}

          <div>
            <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">
              {isCorrection ? '일부 정보 재확인 필요' : '여행 일정 생성'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[260px]">
              {isCorrection
                ? '백엔드에서 아래 항목들이 확인되지 않았습니다. AI가 다시 질문할게요.'
                : '이 정보로 여행 일정을 생성하시겠습니까?'}
            </p>
          </div>
        </div>

        {/* Confirmed slots list (confirm mode only) */}
        {!isCorrection && confirmedSlots.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
            {confirmedSlots.map((slot) => (
              <div key={slot.field} className="flex justify-between items-start text-xs">
                <span className="font-bold text-slate-500 w-16 flex-shrink-0">{SLOT_LABELS[slot.field]}</span>
                <span className="font-semibold text-slate-900 text-right break-words flex-1">{slot.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rejected slots list (correction mode only) */}
        {isCorrection && rejectedSlots.length > 0 && (
          <div className="space-y-2">
            {rejectedSlots.map((slot) => (
              <div key={slot.field} className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs font-bold text-slate-700">{SLOT_LABELS[slot.field]}</span>
                <span className={`inline-flex items-center space-x-0.5 text-[9px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border ${
                  slot.status === 'conflict'
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {slot.status === 'conflict' ? <AlertTriangle className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
                  <span>{slot.status === 'conflict' ? '충돌' : '미확인'}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn-pill-outline w-full py-3 text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isCorrection ? '재전송 중…' : '전송 중…'}</span>
              </>
            ) : (
              <>
                {isCorrection ? <RefreshCw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                <span>{isCorrection ? '이해했어요, 계속 진행' : '생성하기'}</span>
              </>
            )}
          </button>

          {!isLoading && (
            <button
              onClick={onCancel}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-700 transition-colors font-semibold uppercase tracking-wide"
            >
              {isCorrection ? '직접 수정하기' : '취소'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default FinalizeConfirmDialog;
