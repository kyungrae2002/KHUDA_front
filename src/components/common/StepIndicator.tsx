import React from 'react';
import { MapPin, Calendar, CircleDollarSign, Car, Check } from 'lucide-react';

interface TripInfo {
  destination: string | null;
  duration: string | null;
  budget: string | null;
  transportation: string | null;
}

interface StepIndicatorProps {
  tripInfo: TripInfo;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ tripInfo }) => {
  const steps = [
    { key: 'destination', label: '목적지', icon: MapPin, value: tripInfo.destination },
    { key: 'duration', label: '기간', icon: Calendar, value: tripInfo.duration },
    { key: 'budget', label: '예산', icon: CircleDollarSign, value: tripInfo.budget },
    { key: 'transportation', label: '이동 수단', icon: Car, value: tripInfo.transportation },
  ];

  const completedCount = steps.filter((step) => !!step.value).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="w-full bg-white border border-slate-200/85 rounded-2xl p-4.5 text-left">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-sans">Progress</span>
          <h3 className="text-sm font-black text-slate-900 mt-0.5">필수 정보 수집</h3>
        </div>
        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/50">
          {completedCount}/4 완료
        </span>
      </div>

      {/* Progress Bar (Sunset gradient matching reference sky theme) */}
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ 
            width: `${progressPercent}%`,
            backgroundImage: 'linear-gradient(to right, #5B8DEF, #E96B5C)'
          }}
        />
      </div>

      {/* Steps Check indicator grid */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = !!step.value;

          return (
            <div
              key={step.key}
              className={`flex flex-col items-center p-2 rounded-xl border transition-all duration-300 ${
                isDone
                  ? 'bg-slate-50/80 border-slate-950 text-slate-950'
                  : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <div
                className={`relative p-2 rounded-lg mb-1 transition-colors ${
                  isDone ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-450'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {isDone && (
                  <div className="absolute -top-1 -right-1 bg-slate-950 text-white rounded-full p-0.5 border border-white">
                    <Check className="h-2 w-2 stroke-[3.5]" />
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isDone ? 'text-slate-900' : 'text-slate-450'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
