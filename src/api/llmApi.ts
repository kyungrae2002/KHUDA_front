import { type Message, type SlotOut, type SlotField } from '../types/trip';

// ─── Environment ──────────────────────────────────────────────────────────────

const LLM_API_URL = import.meta.env.VITE_LLM_API_URL || '';
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !LLM_API_URL;

// ─── OpenAI-compatible HTTP helper ───────────────────────────────────────────

interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string; }

async function callLLM(messages: LLMMessage[], opts?: { temperature?: number; max_tokens?: number }): Promise<string> {
  const response = await fetch(`${LLM_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini',
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.max_tokens ?? 800,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '(응답 없음)';
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SLOT_FIELDS: SlotField[] = ['destination', 'date', 'budget', 'headcount', 'transport', 'constraint', 'wishlist'];

function serializeConversation(messages: Message[]): string {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');
}

// ─── System prompts ───────────────────────────────────────────────────────────

function chatSystemPrompt(referenceContext: string | null): string {
  const context = referenceContext
    ? `\n\n아래는 사용자가 업로드한 카카오톡 대화 내용입니다. 이미 언급된 여행 정보는 적극 활용하세요:\n"""\n${referenceContext.slice(0, 3000)}\n"""`
    : '';

  return `당신은 TravelAI, 친근한 한국어 AI 여행 플래너입니다.
7가지 여행 정보를 자연스러운 대화를 통해 수집하는 것이 목표입니다:
1. destination(목적지) 2. date(날짜/기간) 3. budget(예산) 4. headcount(인원)
5. transport(이동 수단) 6. constraint(제약 사항) 7. wishlist(희망 사항)

아직 확인되지 않은 항목만 질문하고, 이미 확인된 내용은 재확인하지 마세요.
모든 항목이 확인되면 "모든 정보가 준비되었습니다 ✅"라고 명확히 알려주세요.
사용자가 영어로 쓰면 영어로, 한국어로 쓰면 한국어로 답하세요.${context}`;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CHAT_RESPONSES = [
  '좋아요! 카카오톡 내용을 참고했습니다. 여행 날짜를 좀 더 구체적으로 알려주세요. 출발일과 귀국일이 언제인가요?',
  '감사합니다! 예산은 어느 정도로 생각하고 계신가요? (1인 기준)',
  '몇 명이서 여행하시나요?',
  '현지에서 주로 어떤 교통수단을 이용하실 예정인가요? (예: 렌트카, 대중교통)',
  '식이 제한이나 접근성 등 특별히 고려할 제약 사항이 있으신가요? 없으면 "없음"이라고 말씀해 주세요.',
  '이번 여행에서 꼭 하고 싶은 것이 있으신가요? (예: 야경, 맛집, 박물관)',
  '모든 정보가 준비되었습니다 ✅ 여행 일정을 만들어 드릴까요?',
];

let mockChatIdx = 0;

const MOCK_SLOTS_PROGRESSION: SlotOut[][] = [
  // Turn 1: destination confirmed from reference
  [
    { field: 'destination', value: '제주도', status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
    { field: 'date', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'budget', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'headcount', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'transport', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'constraint', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'wishlist', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
  ],
  // Turn 2: date confirmed
  [
    { field: 'destination', value: '제주도', status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
    { field: 'date', value: '2025-08-10 ~ 2025-08-13', status: 'confirmed', confidence: 0.9, evidence_message_ids: [3] },
    { field: 'budget', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'headcount', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'transport', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'constraint', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'wishlist', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
  ],
  // Turn 3: budget
  [
    { field: 'destination', value: '제주도', status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
    { field: 'date', value: '2025-08-10 ~ 2025-08-13', status: 'confirmed', confidence: 0.9, evidence_message_ids: [3] },
    { field: 'budget', value: '1인 50만원', status: 'confirmed', confidence: 0.85, evidence_message_ids: [5] },
    { field: 'headcount', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'transport', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'constraint', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'wishlist', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
  ],
  // Turn 4: headcount
  [
    { field: 'destination', value: '제주도', status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
    { field: 'date', value: '2025-08-10 ~ 2025-08-13', status: 'confirmed', confidence: 0.9, evidence_message_ids: [3] },
    { field: 'budget', value: '1인 50만원', status: 'confirmed', confidence: 0.85, evidence_message_ids: [5] },
    { field: 'headcount', value: '2명', status: 'confirmed', confidence: 0.92, evidence_message_ids: [7] },
    { field: 'transport', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'constraint', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'wishlist', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
  ],
  // Turn 5: transport
  [
    { field: 'destination', value: '제주도', status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
    { field: 'date', value: '2025-08-10 ~ 2025-08-13', status: 'confirmed', confidence: 0.9, evidence_message_ids: [3] },
    { field: 'budget', value: '1인 50만원', status: 'confirmed', confidence: 0.85, evidence_message_ids: [5] },
    { field: 'headcount', value: '2명', status: 'confirmed', confidence: 0.92, evidence_message_ids: [7] },
    { field: 'transport', value: '렌트카', status: 'confirmed', confidence: 0.88, evidence_message_ids: [9] },
    { field: 'constraint', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
    { field: 'wishlist', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
  ],
  // Turn 6: constraint
  [
    { field: 'destination', value: '제주도', status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
    { field: 'date', value: '2025-08-10 ~ 2025-08-13', status: 'confirmed', confidence: 0.9, evidence_message_ids: [3] },
    { field: 'budget', value: '1인 50만원', status: 'confirmed', confidence: 0.85, evidence_message_ids: [5] },
    { field: 'headcount', value: '2명', status: 'confirmed', confidence: 0.92, evidence_message_ids: [7] },
    { field: 'transport', value: '렌트카', status: 'confirmed', confidence: 0.88, evidence_message_ids: [9] },
    { field: 'constraint', value: '없음', status: 'confirmed', confidence: 0.8, evidence_message_ids: [11] },
    { field: 'wishlist', value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] },
  ],
  // Turn 7: all confirmed
  [
    { field: 'destination', value: '제주도', status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
    { field: 'date', value: '2025-08-10 ~ 2025-08-13', status: 'confirmed', confidence: 0.9, evidence_message_ids: [3] },
    { field: 'budget', value: '1인 50만원', status: 'confirmed', confidence: 0.85, evidence_message_ids: [5] },
    { field: 'headcount', value: '2명', status: 'confirmed', confidence: 0.92, evidence_message_ids: [7] },
    { field: 'transport', value: '렌트카', status: 'confirmed', confidence: 0.88, evidence_message_ids: [9] },
    { field: 'constraint', value: '없음', status: 'confirmed', confidence: 0.8, evidence_message_ids: [11] },
    { field: 'wishlist', value: '야경, 맛집 탐방', status: 'confirmed', confidence: 0.87, evidence_message_ids: [13] },
  ],
];

let mockSlotIdx = 0;

const getMockDelay = () => 700 + Math.random() * 500;

// ─── 1. sendChatMessage ───────────────────────────────────────────────────────

/**
 * Send the conversation to the LLM and get the assistant's next reply.
 * Uses referenceContext as a system-prompt prefix so the AI knows what's already confirmed.
 */
export async function sendChatMessage(
  messages: Message[],
  referenceContext: string | null
): Promise<string> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, getMockDelay()));
    const reply = MOCK_CHAT_RESPONSES[mockChatIdx % MOCK_CHAT_RESPONSES.length];
    mockChatIdx++;
    return reply;
  }

  const llmMessages: LLMMessage[] = [
    { role: 'system', content: chatSystemPrompt(referenceContext) },
    ...messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  return callLLM(llmMessages, { temperature: 0.7, max_tokens: 600 });
}

// ─── 2. extractSlots ─────────────────────────────────────────────────────────

/**
 * Ask the LLM to extract the current slot state from the full conversation so far.
 * Returns a SlotOut[] for all 7 fields.
 *
 * In production this can be merged with sendChatMessage via tool-use / function calling
 * to avoid a second API round-trip. In this implementation they are separate for clarity.
 */
export async function extractSlots(
  messages: Message[],
  referenceContext: string | null
): Promise<SlotOut[]> {
  if (USE_MOCK) {
    console.log('[extractSlots] ⚠️ USE_MOCK is TRUE. Returning hardcoded mock data instead of calling LLM.');
    await new Promise((r) => setTimeout(r, 200));
    const slots = MOCK_SLOTS_PROGRESSION[Math.min(mockSlotIdx, MOCK_SLOTS_PROGRESSION.length - 1)];
    console.log('[extractSlots] Mock slots returned:', JSON.stringify(slots, null, 2));
    if (mockSlotIdx < MOCK_SLOTS_PROGRESSION.length) mockSlotIdx++;
    return slots;
  }

  const convText = serializeConversation(messages);

  // ── Full-context construction (no truncation) ────────────────────────────
  // Use the full referenceContext — never truncate it.
  // gpt-4o-mini supports ~128k tokens; a KakaoTalk export is typically <50k chars.
  // The only guard is a generous 60k-char cap to avoid accidental abuse.
  const MAX_REF_CHARS = 60_000;
  const refFull = referenceContext ?? '';
  const refTrimmed = refFull.length > MAX_REF_CHARS
    ? refFull.slice(0, MAX_REF_CHARS) + '\n...[truncated]'
    : refFull;

  console.log(
    `[extractSlots] referenceContext length: ${refFull.length} chars` +
    (refFull.length > MAX_REF_CHARS ? ` (trimmed to ${MAX_REF_CHARS})` : ' (full, no trimming)') +
    `, chatMessages: ${messages.length}`
  );

  const refSection = refTrimmed
    ? `\n\n=== UPLOADED KAKAOTALK CONVERSATION (full text) ===\n${refTrimmed}\n=== END OF UPLOADED CONVERSATION ===`
    : '';

  const chatSection = convText
    ? `\n\n=== ADDITIONAL CHATBOT CONVERSATION ===\n${convText}\n=== END OF CHATBOT CONVERSATION ===`
    : '';

  const systemMsg: LLMMessage = {
    role: 'system',
    content: `You are a trip-slot extraction engine. Your ONLY job is to analyze the provided text and extract values for EXACTLY 7 trip-planning fields in a SINGLE PASS.

CRITICAL RULES:
1. Read the ENTIRE provided text before responding. Do NOT stop after finding the first field.
2. Extract ALL 7 fields simultaneously from one full read-through — never defer a field "to ask later".
3. If information for a field is present ANYWHERE in the text, mark it "confirmed" with its value.
4. Only mark a field "undecided" if the information is genuinely absent from the entire text.
5. Mark "conflict" only if contradictory values appear for the same field.
6. Return ONLY a valid JSON array — no markdown fences, no explanation, no extra text.

The 7 fields you MUST extract (all at once):
- destination: Where are they traveling to?
- date: When? (departure + return dates or duration)
- budget: How much budget? (total or per person)
- headcount: How many people?
- transport: What mode of transport will they use locally?
- constraint: Any dietary, accessibility, or other constraints? (if explicitly "none", value = "없음", status = "confirmed")
- wishlist: Any specific wishes or must-do activities?

Required JSON structure (return exactly this, with real values filled in):
[
  {"field":"destination","value":"<extracted value or empty string>","status":"confirmed|undecided|conflict","confidence":0.0,"evidence_message_ids":[]},
  {"field":"date","value":"<extracted value or empty string>","status":"confirmed|undecided|conflict","confidence":0.0,"evidence_message_ids":[]},
  {"field":"budget","value":"<extracted value or empty string>","status":"confirmed|undecided|conflict","confidence":0.0,"evidence_message_ids":[]},
  {"field":"headcount","value":"<extracted value or empty string>","status":"confirmed|undecided|conflict","confidence":0.0,"evidence_message_ids":[]},
  {"field":"transport","value":"<extracted value or empty string>","status":"confirmed|undecided|conflict","confidence":0.0,"evidence_message_ids":[]},
  {"field":"constraint","value":"<extracted value or empty string>","status":"confirmed|undecided|conflict","confidence":0.0,"evidence_message_ids":[]},
  {"field":"wishlist","value":"<extracted value or empty string>","status":"confirmed|undecided|conflict","confidence":0.0,"evidence_message_ids":[]}
]`,
  };

  const userMsg: LLMMessage = {
    role: 'user',
    content: `Analyze the following text(s) and extract ALL 7 trip slots in one pass. Return ONLY the JSON array.${refSection}${chatSection}`,
  };

  console.log('[extractSlots] EXACT PROMPT PAYLOAD BEING SENT TO LLM:');
  console.log('System Message:', systemMsg.content);
  console.log('User Message:', userMsg.content);

  let raw = '';
  try {
    raw = await callLLM([systemMsg, userMsg], { temperature: 0.0, max_tokens: 1500 });
    console.log('[extractSlots] RAW LLM RESPONSE:', raw);
  } catch (error) {
    console.error('[extractSlots] ❌ LLM API CALL FAILED:', error);
    throw error; // Re-throw so caller knows it failed completely
  }

  // Parse JSON — strip any markdown fences if present
  const cleaned = raw.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
    console.log('[extractSlots] PARSED JSON RESULT:', JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.error('[extractSlots] ❌ JSON PARSE FAILED. Raw string was:\n', raw);
    console.error(err);
    return SLOT_FIELDS.map((f) => ({ field: f, value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] }));
  }

  if (!Array.isArray(parsed)) {
    console.error('[extractSlots] ❌ EXPECTED ARRAY, GOT:', typeof parsed, parsed);
    return SLOT_FIELDS.map((f) => ({ field: f, value: '', status: 'undecided', confidence: 0, evidence_message_ids: [] }));
  }

  return parsed as SlotOut[];
}

// ─── 3. buildFinalJson ────────────────────────────────────────────────────────

/**
 * Ask the LLM to generate a clean, structured JSON representation of the full conversation.
 * The JSON will be sent to the backend (POST /sessions/upload) exactly once.
 *
 * The prompt explicitly instructs the LLM to:
 * - Remove noise (system messages, failed clarifications, etc.)
 * - State each slot value unambiguously in the reconstructed messages
 * - Use JSON format: { "messages": [{ "sender": "string", "timestamp": "string", "message": "string" }] }
 */
export async function buildFinalJson(
  messages: Message[],
  referenceContext: string | null
): Promise<string> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    // Build a clean mock JSON from the final slot state
    const finalSlots = MOCK_SLOTS_PROGRESSION[MOCK_SLOTS_PROGRESSION.length - 1];
    const msgs = finalSlots
      .filter((s) => s.status === 'confirmed')
      .map((s) => ({ sender: 'AI', timestamp: '2025-01-01T12:00:00Z', message: `${s.field}: ${s.value}` }));
    return JSON.stringify({ messages: msgs });
  }

  const convText = serializeConversation(messages);
  const refSnippet = referenceContext
    ? `\n\n[Original KakaoTalk reference]\n${referenceContext.slice(0, 2000)}`
    : '';

  const systemMsg: LLMMessage = {
    role: 'system',
    content: `You are a data-cleaning assistant. Reconstruct the trip-planning conversation as a clean, structured JSON object that a backend slot-parser can reliably parse.

Requirements:
1. Output ONLY valid JSON — no markdown formatting, no explanation, no \`\`\`json blocks.
2. The JSON MUST follow this exact structure:
{
  "messages": [
    { "sender": "string", "timestamp": "string", "message": "string" }
  ]
}
3. Each confirmed trip detail must appear as a clear, unambiguous message object.
4. Use the format: <slot_name>: <value> for the message string.
5. Remove all conversational noise, failed clarifications, and off-topic messages.
6. Include all 7 fields: destination, date, budget, headcount, transport, constraint, wishlist${refSnippet}`,
  };

  const userMsg: LLMMessage = {
    role: 'user',
    content: `Here is the full conversation:\n${convText}\n\nGenerate the clean JSON now.`,
  };

  return callLLM([systemMsg, userMsg], { temperature: 0.1, max_tokens: 1500 });
}
