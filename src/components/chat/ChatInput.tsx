import React, { useState, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSendMessage(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSend();
    }
  };

  return (
    <div className="w-full flex items-center space-x-2 bg-white border border-slate-200 rounded-full px-2 py-1 focus-within:border-slate-400 transition-colors">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'AI가 답변 중입니다...' : '메시지를 입력하세요...'}
        className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none border-0 focus:ring-0 px-3 py-2 disabled:opacity-40"
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="btn-pill-outline py-1.5 px-4 text-xs disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        aria-label="전송"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default ChatInput;
