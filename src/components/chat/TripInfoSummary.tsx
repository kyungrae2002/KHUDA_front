import React, { useState } from 'react';
import { type SlotOut, type SlotField } from '../../types/trip';
import {
  MapPin, Calendar, CircleDollarSign, Users, Car, ShieldAlert, Star,
  CheckCircle2, Circle, AlertTriangle, Check, X as XIcon, Edit2
} from 'lucide-react';

interface TripInfoSummaryProps {
  slots: SlotOut[];
  onUpdateSlot?: (field: SlotField, value: string) => void;
}

// ─── Config per slot field ────────────────────────────────────────────────────

const SLOT_CONFIG: Record<SlotField, { label: string; icon: React.ElementType; placeholder: string }> = {
  destination: { label: '목적지', icon: MapPin, placeholder: '아직 미확인' },
  date:        { label: '날짜/기간', icon: Calendar, placeholder: '아직 미확인' },
  budget:      { label: '예산', icon: CircleDollarSign, placeholder: '아직 미확인' },
  headcount:   { label: '인원', icon: Users, placeholder: '아직 미확인' },
  transport:   { label: '이동 수단', icon: Car, placeholder: '아직 미확인' },
  constraint:  { label: '제약 사항', icon: ShieldAlert, placeholder: '없음' },
  wishlist:    { label: '희망 사항', icon: Star, placeholder: '자유롭게 말씀해 주세요' },
};

const FIELD_ORDER: SlotField[] = [
  'destination', 'date', 'budget', 'headcount', 'transport', 'constraint', 'wishlist',
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SlotOut['status'] }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 className="h-2.5 w-2.5" />
        <span>확인됨</span>
      </span>
    );
  }
  if (status === 'conflict') {
    return (
      <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
        <AlertTriangle className="h-2.5 w-2.5" />
        <span>충돌</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
      <Circle className="h-2.5 w-2.5" />
      <span>미확인</span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TripInfoSummary: React.FC<TripInfoSummaryProps> = ({ slots, onUpdateSlot }) => {
  const [editingField, setEditingField] = useState<SlotField | null>(null);
  const [editValue, setEditValue] = useState('');

  // Build a lookup map for quick access
  const slotMap: Partial<Record<SlotField, SlotOut>> = {};
  slots.forEach((s) => { slotMap[s.field] = s; });

  const confirmedCount = slots.filter((s) => s.status === 'confirmed').length;
  const hasConflict = slots.some((s) => s.status === 'conflict');

  const startEdit = (field: SlotField, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingField(null);
  };

  const saveEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (editingField && onUpdateSlot) {
      onUpdateSlot(editingField, editValue.trim());
    }
    setEditingField(null);
  };

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
          여행 정보 수집 현황
        </span>
        {hasConflict && (
          <span className="text-[9px] font-bold text-red-500 flex items-center space-x-0.5">
            <AlertTriangle className="h-3 w-3" />
            <span>충돌 해결 필요</span>
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${(confirmedCount / 7) * 100}%`,
            backgroundImage: hasConflict
              ? 'linear-gradient(to right, #DC2626, #F97316)'
              : 'linear-gradient(to right, #5B8DEF, #E96B5C)',
          }}
        />
      </div>

      {/* Slot cards */}
      <div className="space-y-2">
        {FIELD_ORDER.map((field) => {
          const slot = slotMap[field];
          const config = SLOT_CONFIG[field];
          const Icon = config.icon;
          const status = slot?.status ?? 'undecided';
          const value = slot?.value || '';
          const isConfirmed = status === 'confirmed';
          const isConflict = status === 'conflict';
          const isEditing = editingField === field;

          return (
            <div
              key={field}
              onClick={() => !isEditing && startEdit(field, value)}
              className={`group flex items-center space-x-3 p-3 rounded-xl border transition-all duration-300 ${
                isEditing ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100 cursor-default' : 'cursor-pointer hover:border-slate-300 hover:shadow-sm'
              } ${
                !isEditing && isConfirmed
                  ? 'bg-white border-slate-950'
                  : !isEditing && isConflict
                  ? 'bg-red-50/60 border-red-300'
                  : !isEditing ? 'bg-white border-slate-150' : ''
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 p-1.5 rounded-lg ${
                  isEditing
                    ? 'bg-sky-500 text-white'
                    : isConfirmed
                    ? 'bg-slate-950 text-white'
                    : isConflict
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Label + value / Input */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {config.label}
                  </span>
                  {!isEditing && (
                    <Edit2 className="h-2.5 w-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                
                {isEditing ? (
                  <div className="flex items-center space-x-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 min-w-0 bg-white border border-sky-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 placeholder-slate-300"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(e);
                        if (e.key === 'Escape') cancelEdit(e as any);
                      }}
                      placeholder={config.placeholder}
                    />
                    <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors">
                      <Check className="h-3 w-3" />
                    </button>
                    <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-200 rounded transition-colors">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <p
                    className={`text-xs font-semibold truncate mt-0.5 ${
                      isConfirmed
                        ? 'text-slate-900'
                        : isConflict
                        ? 'text-red-700'
                        : 'text-slate-400 italic'
                    }`}
                  >
                    {isConfirmed ? value : isConflict ? `⚠ ${value || '충돌 감지됨'}` : config.placeholder}
                  </p>
                )}
              </div>

              {/* Badge */}
              {!isEditing && <StatusBadge status={status} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TripInfoSummary;

