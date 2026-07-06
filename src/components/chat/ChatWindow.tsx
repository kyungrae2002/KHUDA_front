import React, { useEffect, useRef } from 'react';
import { type Message } from '../../types/trip';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLLMLoading: boolean;       // waiting for LLM reply
  isUploadingSlots: boolean;   // background slot upload in progress
  allSlotsConfirmed?: boolean; // if true, show Generate button
  onGenerateItinerary?: () => void; // callback when Generate is clicked
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isLLMLoading,
  isUploadingSlots,
  allSlotsConfirmed,
  onGenerateItinerary,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLLMLoading]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm relative">
      {/* Slot-upload indicator — subtle, top of chat */}
      {isUploadingSlots && (
        <div className="flex items-center justify-center space-x-2 py-1.5 bg-blue-50 border-b border-blue-100 text-blue-500 text-[10px] font-semibold uppercase tracking-wider">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
          </span>
          <span>여행 정보 분석 중...</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-[360px] max-h-[calc(100vh-270px)] md:max-h-[calc(100vh-220px)] bg-slate-50/20 pb-16">
        {messages
          .filter((m) => m.role !== 'system')
          .map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

        {/* LLM typing indicator */}
        {isLLMLoading && (
          <div className="flex items-center space-x-3 my-3">
            <div className="flex-shrink-0 bg-slate-950 text-white p-2 rounded-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 text-slate-500 text-xs px-4 py-2.5 rounded-2xl rounded-tl-sm animate-pulse">
              AI가 답변을 작성하고 있습니다...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Generate button (floats above input) */}
      {allSlotsConfirmed && (
        <div className="absolute bottom-[72px] left-0 right-0 px-4 flex justify-center z-10 animate-slide-up pointer-events-none">
          <button
            onClick={onGenerateItinerary}
            className="pointer-events-auto shadow-lg bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 px-6 rounded-full text-sm flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95"
          >
            <span>✨</span>
            <span>여행 일정 생성하기</span>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200/60">
        <ChatInput onSendMessage={onSendMessage} disabled={isLLMLoading} />
      </div>
    </div>
  );
};

export default ChatWindow;
