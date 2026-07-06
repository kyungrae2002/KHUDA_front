import React from 'react';
import { type Message } from '../../types/trip';
import { Compass, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

/** Transforms **bold** and \n into rendered elements without an external lib. */
function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} className="block min-h-[1.1rem]">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          )
        )}
      </span>
    );
  });
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAI = message.role === 'assistant';

  return (
    <div
      className={`flex items-start w-full space-x-3 my-3 animate-slide-up ${
        !isAI ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      {/* Avatar */}
      {isAI ? (
        <div className="flex-shrink-0 bg-slate-950 text-white p-2 rounded-xl">
          <Compass className="h-4 w-4" />
        </div>
      ) : (
        <div className="flex-shrink-0 bg-slate-100 text-slate-600 p-2 rounded-xl border border-slate-200">
          <User className="h-4 w-4" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[76%] flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAI
              ? 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-sm'
              : 'bg-slate-950 text-white rounded-tr-sm'
          }`}
        >
          <div className="space-y-0.5">{renderContent(message.content)}</div>
        </div>
        <span className="text-[9px] text-slate-400 mt-1 px-1 font-medium select-none">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
