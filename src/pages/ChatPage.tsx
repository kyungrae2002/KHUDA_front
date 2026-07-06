import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { sendChatMessage, extractSlots, buildFinalJson } from '../api/llmApi';
import { uploadConversation } from '../api/sessionApi';
import { createItinerary } from '../api/itineraryApi';
import { buildJsonBlob, buildFallbackJsonBlob } from '../utils/jsonBuilder';
import BackButton from '../components/common/BackButton';
import TripInfoSummary from '../components/chat/TripInfoSummary';
import ChatWindow from '../components/chat/ChatWindow';
import DaysInput from '../components/chat/DaysInput';
import FinalizeConfirmDialog from '../components/chat/FinalizeConfirmDialog';
import { type SlotField, type SlotOut } from '../types/trip';
import { parseDaysFromDateString } from '../utils/dateParser';
import { Sparkles } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REQUIRED_SLOTS: SlotField[] = ['destination', 'date', 'budget', 'headcount', 'transport'];

function getTimestamp() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function allConfirmed(slots: SlotOut[]): boolean {
  const confirmed = new Set(slots.filter((s) => s.status === 'confirmed').map((s) => s.field));
  return REQUIRED_SLOTS.every((f) => confirmed.has(f));
}

function makeMsg(role: 'user' | 'assistant', content: string) {
  return { id: `${role}-${Date.now()}-${Math.random()}`, role, content, timestamp: getTimestamp() };
}

// ─── Component ────────────────────────────────────────────────────────────────

type DialogState = 'none' | 'confirm' | 'correction';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    referenceContext,
    chatMessages,
    clientSlots,
    sessionId,
    isSendingMessage,
    isExtractingSlots,
    isBuildingFinalJson,
    isUploadingFinalJson,
    isGeneratingItinerary,
    addChatMessage,
    setClientSlots,
    setBackendSlots,
    setSessionId,
    setItinerary,
    setSendingMessage,
    setExtractingSlots,
    setBuildingFinalJson,
    setUploadingFinalJson,
    setGeneratingItinerary,
  } = useTripStore();

  const [dialogState, setDialogState] = useState<DialogState>('none');
  const [rejectedSlots, setRejectedSlots] = useState<SlotOut[]>([]);
  const [itineraryError, setItineraryError] = useState(false);
  const [showDaysInput, setShowDaysInput] = useState(false);
  const [autoComputedDays, setAutoComputedDays] = useState<number | null>(null);
  const openingInjected = useRef(false);
  const itineraryRequestId = useRef(0);

  // ── Initial slot extraction + dynamic opening message on mount ───────────
  useEffect(() => {
    if (openingInjected.current || chatMessages.length > 0) return;
    openingInjected.current = true;

    const SLOT_LABEL: Record<SlotField, string> = {
      destination: '목적지', date: '날짜/기간', budget: '예산',
      headcount: '인원', transport: '이동 수단', constraint: '제약 사항', wishlist: '희망 사항',
    };

    async function initExtractAndGreet() {
      // No reference file — generic greeting, no extraction needed
      if (!referenceContext) {
        addChatMessage(makeMsg(
          'assistant',
          '안녕하세요! AI 여행 플래너 TravelAI입니다. ✈️\n목적지, 날짜, 예산, 인원, 이동 수단을 알려주시면 맞춤 일정을 만들어 드릴게요. 어디로 여행을 떠나고 싶으신가요?'
        ));
        return;
      }

      // ① Call extractSlots with empty chat history — only referenceContext is the source
      setExtractingSlots(true);
      let initialSlots: SlotOut[] = [];
      try {
        console.log('[ChatPage] Running initial slot extraction from referenceContext...');
        initialSlots = await extractSlots([], referenceContext);
        console.log('[ChatPage] Initial slot extraction result:', initialSlots);
        setClientSlots(initialSlots);

      } catch (err) {
        console.warn('[ChatPage] Initial slot extraction failed:', err);
        initialSlots = [];
      } finally {
        setExtractingSlots(false);
      }

      // ② Build dynamic opening message from the actual extraction result
      const confirmed = initialSlots.filter((s) => s.status === 'confirmed' && s.value);
      const undecided = initialSlots.filter((s) => s.status === 'undecided' || !s.value);
      const conflict  = initialSlots.filter((s) => s.status === 'conflict');

      let greeting = '안녕하세요! 업로드하신 카카오톡 대화를 분석했어요. 🔍\n\n';

      if (confirmed.length > 0) {
        greeting += '**✅ 이미 확인된 정보:**\n';
        greeting += confirmed.map((s) => `• ${SLOT_LABEL[s.field]}: ${s.value}`).join('\n');
        greeting += '\n\n';
      } else {
        greeting += '아직 여행 정보를 충분히 파악하지 못했어요.\n\n';
      }

      if (conflict.length > 0) {
        greeting += '**⚠️ 충돌 감지 (다시 확인 필요):**\n';
        greeting += conflict.map((s) => `• ${SLOT_LABEL[s.field]}: ${s.value || '정보 충돌'}`).join('\n');
        greeting += '\n\n';
      }

      if (undecided.length > 0) {
        greeting += '**❓ 아직 확인이 필요한 항목:**\n';
        greeting += undecided.map((s) => `• ${SLOT_LABEL[s.field]}`).join('\n');
        greeting += '\n\n';
        greeting += '위 항목들을 알려주시면 맞춤 여행 일정을 바로 만들어 드릴 수 있어요!';
      } else if (conflict.length > 0) {
        greeting += '충돌이 있는 항목만 다시 확인해 주시면 바로 일정을 생성할 수 있어요.';
      } else {
        greeting += '모든 정보가 확인됐어요! 여행 일정을 바로 생성할 수 있습니다. ✅';
      }

      addChatMessage(makeMsg('assistant', greeting));

    }

    initExtractAndGreet();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Main: send user message ────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg = makeMsg('user', text);
    addChatMessage(userMsg);
    setSendingMessage(true);

    const currentMessages = [...chatMessages, userMsg];

    try {
      // 1. Get AI reply
      const reply = await sendChatMessage(currentMessages, referenceContext);
      const aiMsg = makeMsg('assistant', reply);
      addChatMessage(aiMsg);

      const allMessages = [...currentMessages, aiMsg];

      // 2. Extract slot state (background — non-blocking for UX)
      setExtractingSlots(true);
      extractSlots(allMessages, referenceContext)
        .then((slots) => {
          setClientSlots(slots);
        })
        .catch((err) => console.warn('extractSlots failed (non-critical):', err))
        .finally(() => setExtractingSlots(false));

    } catch (err) {
      console.error('sendChatMessage failed:', err);
      addChatMessage(makeMsg('assistant', '죄송합니다, 일시적인 오류가 발생했습니다. 다시 시도해 주세요.'));
    } finally {
      setSendingMessage(false);
    }
  }, [chatMessages, referenceContext, addChatMessage, setSendingMessage, setExtractingSlots, setClientSlots]);

  // ── Handle manual slot edit ────────────────────────────────────────────────
  const handleUpdateSlot = useCallback((field: SlotField, value: string) => {
    // 1. Update the store immediately
    const updatedSlots = clientSlots.map((s) => 
      s.field === field ? { ...s, value, status: 'confirmed' as const } : s
    );
    setClientSlots(updatedSlots);

    // 2. Inject a system message so the LLM knows about the edit on the next turn
    const SLOT_LABELS: Record<SlotField, string> = {
      destination: '목적지', date: '날짜', budget: '예산',
      headcount: '인원', transport: '이동 수단', constraint: '제약 사항', wishlist: '희망 사항',
    };
    const label = SLOT_LABELS[field];
    
    // We send this as a 'user' message with a system format so it gets appended 
    // to the chat history, ensuring the AI acknowledges it naturally.
    const sysMsg = `[시스템 알림: 사용자가 직접 '${label}' 항목을 '${value}'(으)로 수정 및 확정했습니다.]`;
    
    // We could just add the message, but triggering handleSendMessage makes the AI 
    // respond and acknowledge it immediately, which feels more natural.
    handleSendMessage(sysMsg);
  }, [clientSlots, setClientSlots, handleSendMessage]);

  // ── Finalize: build JSON → upload once → check backend response ────────────
  const handleFinalize = useCallback(async () => {
    setBuildingFinalJson(true);
    let jsonText: string;

    try {
      jsonText = await buildFinalJson(chatMessages, referenceContext);
    } catch (err) {
      console.warn('buildFinalJson failed, using fallback:', err);
      // Fallback: build from clientSlots directly
      const fallbackBlob = buildFallbackJsonBlob(clientSlots.map(s => ({ field: s.field, value: s.value })));
      setBuildingFinalJson(false);
      setUploadingFinalJson(true);
      try {
        const res = await uploadConversation(fallbackBlob);
        return handleUploadResponse(res);
      } finally {
        setUploadingFinalJson(false);
      }
    }

    setBuildingFinalJson(false);
    setUploadingFinalJson(true);

    try {
      const jsonBlob = buildJsonBlob(jsonText);
      const res = await uploadConversation(jsonBlob);
      handleUploadResponse(res);
    } catch (err) {
      console.error('[Finalize] Backend request failed:', err);
      if (axios.isAxiosError(err)) {
        console.error('[Finalize] status:', err.response?.status);
        console.error('[Finalize] response data:', err.response?.data);
        console.error('[Finalize] request config:', err.config?.url, err.config?.method);
        console.error('[Finalize] was it a timeout/network error?', err.code, err.message);
      }
      addChatMessage(makeMsg('assistant', '백엔드 전송에 실패했습니다. (콘솔 로그를 확인해주세요)'));
      setDialogState('none');
    } finally {
      setUploadingFinalJson(false);
    }
  }, [chatMessages, referenceContext, clientSlots]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle the backend's upload response ───────────────────────────────────
  const handleUploadResponse = useCallback((res: Awaited<ReturnType<typeof uploadConversation>>) => {
    setSessionId(res.session_id);
    setBackendSlots(res.slots);

    const stillBad = res.slots.filter((s) => s.status === 'undecided' || s.status === 'conflict');

    if (stillBad.length > 0) {
      // Correction loop: backend disagrees — return to chat with follow-up
      setRejectedSlots(stillBad);
      setDialogState('correction');
      setClientSlots(res.slots); // treat backend as ground truth
    } else {
      setDialogState('none');
      
      const dateSlot = res.slots.find((s) => s.field === 'date');
      const parsedDays = dateSlot ? parseDaysFromDateString(dateSlot.value) : null;
      setAutoComputedDays(parsedDays);
      setShowDaysInput(true);

      if (parsedDays !== null) {
        // Auto-proceed to itinerary generation using an IIFE
        const myRequestId = ++itineraryRequestId.current;
        (async () => {
          setGeneratingItinerary(true);
          setItineraryError(false);
          try {
            const resItin = await createItinerary(res.session_id, parsedDays);
            if (itineraryRequestId.current !== myRequestId) return; // superseded by an override
            setItinerary({
              narrative: resItin.narrative.days,
              iterationsUsed: resItin.iterations_used,
              violations: resItin.violations,
            });
            navigate('/plan');
          } catch (err) {
            if (itineraryRequestId.current !== myRequestId) return; // superseded by an override
            console.error('createItinerary failed:', err);
            setItineraryError(true);
            setShowDaysInput(true); // Ensure DaysInput is visible to show error
          } finally {
            if (itineraryRequestId.current === myRequestId) {
              setGeneratingItinerary(false);
            }
          }
        })();
      }
    }
  }, [setSessionId, setBackendSlots, setClientSlots, setGeneratingItinerary, setItinerary, navigate]);

  // ── Correction loop: AI asks follow-up about rejected slots ───────────────
  const handleCorrectionContinue = useCallback(() => {
    setDialogState('none');

    const fieldLabels: Record<SlotField, string> = {
      destination: '목적지', date: '날짜', budget: '예산',
      headcount: '인원', transport: '이동 수단', constraint: '제약 사항', wishlist: '희망 사항',
    };

    const fields = rejectedSlots.map((s) => fieldLabels[s.field]).join(', ');
    const followUp = `백엔드 분석 결과, 아직 확인이 필요한 항목이 있어요: **${fields}**. 다시 한번 명확하게 알려주시겠어요?`;

    addChatMessage(makeMsg('assistant', followUp));
  }, [rejectedSlots, addChatMessage]);

  // ── Itinerary generation ───────────────────────────────────────────────────
  const handleConfirmDays = useCallback(async (days: number) => {
    if (!sessionId) { alert('세션 정보가 없습니다.'); return; }
    const myRequestId = ++itineraryRequestId.current;
    setGeneratingItinerary(true);
    setItineraryError(false);
    try {
      const res = await createItinerary(sessionId, days);
      if (itineraryRequestId.current !== myRequestId) return; // superseded by a newer request
      setItinerary({
        narrative: res.narrative.days,
        iterationsUsed: res.iterations_used,
        violations: res.violations,
      });
      navigate('/plan');
    } catch (err) {
      if (itineraryRequestId.current !== myRequestId) return; // superseded by a newer request
      console.error('createItinerary failed:', err);
      setItineraryError(true);
      setShowDaysInput(true);
    } finally {
      if (itineraryRequestId.current === myRequestId) {
        setGeneratingItinerary(false);
      }
    }
  }, [sessionId, setGeneratingItinerary, setItinerary, navigate]);

  // ── Let the user override an in-flight auto-computed generation ────────────
  const handleOverrideDays = useCallback(() => {
    itineraryRequestId.current += 1; // invalidate the in-flight auto-generation, if any
    setGeneratingItinerary(false);
    setItineraryError(false);
  }, [setGeneratingItinerary]);

  // ── Loading overlay label ──────────────────────────────────────────────────
  const isFinalizingStage = isBuildingFinalJson || isUploadingFinalJson;

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50/40 text-slate-900">
      <BackButton to="/upload" label="Back to upload" />

      {/* Finalize / Correction dialog */}
      {(dialogState === 'confirm' || dialogState === 'correction') && (
        <FinalizeConfirmDialog
          mode={dialogState}
          confirmedSlots={clientSlots.filter((s) => s.status === 'confirmed')}
          rejectedSlots={rejectedSlots}
          onConfirm={dialogState === 'confirm' ? handleFinalize : handleCorrectionContinue}
          onCancel={() => {
            setDialogState('none');
          }}
          isLoading={isFinalizingStage}
        />
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-12 pb-6 md:pt-14 md:pb-8 flex flex-col lg:flex-row gap-6">

        {/* Left panel */}
        <aside className="w-full lg:w-[340px] xl:w-[360px] flex-shrink-0 flex flex-col space-y-4 lg:h-[calc(100vh-80px)] lg:overflow-y-auto pr-0 lg:pr-1">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-left">
            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-2">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Step 2 of 3 · Chat</span>
            </div>
            <h2 className="text-sm font-black text-slate-950">여행 정보 수집 중</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              AI가 대화를 분석해 7가지 여행 슬롯을 채웁니다.
              {isExtractingSlots && (
                <span className="text-sky-500 font-semibold"> 분석 중…</span>
              )}
            </p>
          </div>

          <TripInfoSummary slots={clientSlots} onUpdateSlot={handleUpdateSlot} />
        </aside>

        <section className="flex-1 min-w-0 flex flex-col lg:h-[calc(100vh-80px)] space-y-4">
          <ChatWindow
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLLMLoading={isSendingMessage}
            isUploadingSlots={isFinalizingStage}
            allSlotsConfirmed={allConfirmed(clientSlots)}
            onGenerateItinerary={() => setDialogState('confirm')}
          />

          {showDaysInput && (
            <DaysInput
              onConfirm={handleConfirmDays}
              onOverride={handleOverrideDays}
              isLoading={isGeneratingItinerary}
              hasError={itineraryError}
              autoDays={autoComputedDays}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default ChatPage;
