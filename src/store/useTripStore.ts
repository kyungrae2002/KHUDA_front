import { create } from 'zustand';
import {
  type Message,
  type SlotOut,
  type StoredItinerary,
} from '../types/trip';

// ─── State & Actions Interface ────────────────────────────────────────────────

interface TripState {
  // Normalized KakaoTalk export text — used ONLY as LLM context, never sent to the backend
  referenceContext: string | null;
  // AI chatbot conversation
  chatMessages: Message[];
  // LLM-tracked slot state (frontend-only, updated every turn via extractSlots)
  clientSlots: SlotOut[];
  // Backend-confirmed slot state — set once after POST /sessions/upload, ground truth for corrections
  backendSlots: SlotOut[] | null;
  // Backend session ID — set after the first (and usually only) POST /sessions/upload
  sessionId: number | null;
  days: number | null;
  itinerary: StoredItinerary | null;
  // Granular loading flags
  isSendingMessage: boolean;
  isExtractingSlots: boolean;
  isBuildingFinalJson: boolean;
  isUploadingFinalJson: boolean;
  isGeneratingItinerary: boolean;

  // Actions
  setReferenceContext: (text: string) => void;
  addChatMessage: (msg: Message) => void;
  setChatMessages: (msgs: Message[]) => void;
  setClientSlots: (slots: SlotOut[]) => void;
  setBackendSlots: (slots: SlotOut[]) => void;
  setSessionId: (id: number) => void;
  setDays: (days: number) => void;
  setItinerary: (itinerary: StoredItinerary) => void;
  setSendingMessage: (v: boolean) => void;
  setExtractingSlots: (v: boolean) => void;
  setBuildingFinalJson: (v: boolean) => void;
  setUploadingFinalJson: (v: boolean) => void;
  setGeneratingItinerary: (v: boolean) => void;
  resetTrip: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTripStore = create<TripState>((set) => ({
  referenceContext: null,
  chatMessages: [],
  clientSlots: [],
  backendSlots: null,
  sessionId: null,
  days: null,
  itinerary: null,
  isSendingMessage: false,
  isExtractingSlots: false,
  isBuildingFinalJson: false,
  isUploadingFinalJson: false,
  isGeneratingItinerary: false,

  setReferenceContext: (text) => set({ referenceContext: text }),

  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  setChatMessages: (msgs) => set({ chatMessages: msgs }),

  setClientSlots: (slots) => set({ clientSlots: slots }),

  setBackendSlots: (slots) => set({ backendSlots: slots }),

  setSessionId: (id) => set({ sessionId: id }),

  setDays: (days) => set({ days }),

  setItinerary: (itinerary) => set({ itinerary }),

  setSendingMessage: (v) => set({ isSendingMessage: v }),

  setExtractingSlots: (v) => set({ isExtractingSlots: v }),

  setBuildingFinalJson: (v) => set({ isBuildingFinalJson: v }),

  setUploadingFinalJson: (v) => set({ isUploadingFinalJson: v }),

  setGeneratingItinerary: (v) => set({ isGeneratingItinerary: v }),

  resetTrip: () =>
    set({
      referenceContext: null,
      chatMessages: [],
      clientSlots: [],
      backendSlots: null,
      sessionId: null,
      days: null,
      itinerary: null,
      isSendingMessage: false,
      isExtractingSlots: false,
      isBuildingFinalJson: false,
      isUploadingFinalJson: false,
      isGeneratingItinerary: false,
    }),
}));

export default useTripStore;
