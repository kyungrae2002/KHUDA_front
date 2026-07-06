/**
 * conversationParser.ts
 *
 * Normalizes .txt / .csv / .json conversation exports into a single
 * KakaoTalk-style plain-text string used as LLM context.
 *
 * Target format (one line per message):
 *   [Sender] [Time] Message text
 */
import Papa from 'papaparse';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParseResult =
  | { ok: true; text: string; format: 'txt' | 'csv' | 'json'; warnings?: string[] }
  | { ok: false; error: string; fallbackText?: string };

// ─── Column-name aliases ──────────────────────────────────────────────────────

const SENDER_ALIASES  = ['sender', 'from', 'name', 'user', 'author', 'writer'];
// NOTE: 'date' is intentionally NOT listed here — it's a common column NAME, not a time value.
// Including 'date' caused false positives when a CSV has a "date" column for the trip date slot.
const TIME_ALIASES    = ['timestamp', 'time', 'datetime', 'created_at', 'sent_at', 'sent_time'];
const MESSAGE_ALIASES = ['message', 'text', 'content', 'body', 'msg'];

function findCol(headers: string[], aliases: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

// ─── Format: TXT ─────────────────────────────────────────────────────────────

export function parseTxt(raw: string): ParseResult {
  const lineCount = raw.split('\n').length;
  console.log(`[parseTxt] Raw length: ${raw.length} chars, ${lineCount} lines`);
  return { ok: true, text: raw, format: 'txt' };
}

// ─── Format: CSV ─────────────────────────────────────────────────────────────

export function parseCsv(raw: string): ParseResult {
  console.log(`[parseCsv] Raw input: ${raw.length} chars`);

  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,          // skip blank rows
    transformHeader: (h) => h.trim(),
    // No preview / chunk / worker — parse everything synchronously in one pass
  });

  // ── Diagnostic log: full PapaParse result ──────────────────────────────────
  console.log(`[parseCsv] PapaParse result:
  rows parsed  : ${result.data.length}
  headers      : ${JSON.stringify(result.meta.fields)}
  errors       : ${result.errors.length}`, result.errors.length > 0 ? result.errors : '');

  if (result.errors.length > 0) {
    // Log each error row so we can see exactly where parsing breaks
    result.errors.forEach((e, i) => {
      console.warn(`[parseCsv] PapaParse error[${i}]: row=${e.row}, code=${e.code}, msg=${e.message}`);
    });
  }

  // Fatal: no rows at all
  if (result.data.length === 0) {
    return {
      ok: false,
      error: `CSV 파싱 오류: ${result.errors[0]?.message ?? '행을 읽을 수 없습니다.'}`,
      fallbackText: raw,
    };
  }

  const headers = result.meta.fields ?? [];
  if (headers.length === 0) {
    return { ok: false, error: 'CSV 헤더를 찾을 수 없습니다.', fallbackText: raw };
  }

  const senderCol  = findCol(headers, SENDER_ALIASES)  ?? headers[0];
  const timeCol    = findCol(headers, TIME_ALIASES);
  const messageCol = findCol(headers, MESSAGE_ALIASES) ?? headers[headers.length - 1];

  console.log(`[parseCsv] Column mapping — sender: "${senderCol}", time: "${timeCol ?? 'none'}", message: "${messageCol}"`);

  const warnings: string[] = [];
  if (!findCol(headers, SENDER_ALIASES))  warnings.push(`보내는 사람 열을 자동 감지했습니다: "${senderCol}"`);
  if (!findCol(headers, MESSAGE_ALIASES)) warnings.push(`메시지 열을 자동 감지했습니다: "${messageCol}"`);

  const lines = result.data.map((row, idx) => {
    const sender  = row[senderCol]  ?? 'Unknown';
    const time    = timeCol ? (row[timeCol] ?? '') : '';
    const message = row[messageCol] ?? '';

    if (!message.trim()) {
      console.warn(`[parseCsv] Row ${idx + 1} has empty message field. Row data:`, row);
    }

    return time
      ? `[${sender}] [${time}] ${message}`
      : `[${sender}] ${message}`;
  });

  const normalized = lines.join('\n');
  console.log(`[parseCsv] ✅ Output: ${lines.length} lines, ${normalized.length} chars total`);
  console.log(`[parseCsv] First 3 lines:\n${lines.slice(0, 3).join('\n')}`);
  console.log(`[parseCsv] Last 3 lines:\n${lines.slice(-3).join('\n')}`);

  return {
    ok: true,
    text: normalized,
    format: 'csv',
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ─── Format: JSON ─────────────────────────────────────────────────────────────

type JsonMessage = Record<string, unknown>;

function extractField(obj: JsonMessage, aliases: string[]): string {
  for (const alias of aliases) {
    if (typeof obj[alias] === 'string' && (obj[alias] as string).trim()) {
      return (obj[alias] as string).trim();
    }
    // case-insensitive fallback
    const key = Object.keys(obj).find((k) => k.toLowerCase() === alias);
    if (key && typeof obj[key] === 'string' && (obj[key] as string).trim()) {
      return (obj[key] as string).trim();
    }
  }
  return '';
}

export function parseJson(raw: string): ParseResult {
  console.log(`[parseJson] Raw input: ${raw.length} chars`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'JSON 파싱 실패: 올바른 JSON 형식이 아닙니다.', fallbackText: raw };
  }

  // Unwrap common wrappers: { messages: [...] } / { data: [...] } / { conversations: [...] }
  let arr: unknown = parsed;
  if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
    const obj = arr as Record<string, unknown>;
    const wrapperKey = ['messages', 'data', 'conversations', 'items', 'records'].find(
      (k) => Array.isArray(obj[k])
    );
    if (wrapperKey) arr = obj[wrapperKey];
  }

  if (!Array.isArray(arr)) {
    return {
      ok: false,
      error: 'JSON 구조를 인식할 수 없습니다. 메시지 배열([ { sender, message, ... } ])을 기대했습니다.',
      fallbackText: raw,
    };
  }

  if (arr.length === 0) {
    return { ok: false, error: 'JSON 파일에 메시지가 없습니다.', fallbackText: raw };
  }

  console.log(`[parseJson] Array length: ${arr.length} items`);

  const lines: string[] = [];
  const warnings: string[] = [];
  let fallbackCount = 0;

  for (const item of arr as JsonMessage[]) {
    if (typeof item !== 'object' || item === null) { fallbackCount++; continue; }

    const sender  = extractField(item, SENDER_ALIASES)  || 'Unknown';
    const time    = extractField(item, TIME_ALIASES);
    const message = extractField(item, MESSAGE_ALIASES);

    if (!message) { fallbackCount++; continue; }

    lines.push(time ? `[${sender}] [${time}] ${message}` : `[${sender}] ${message}`);
  }

  if (lines.length === 0) {
    return {
      ok: false,
      error: 'JSON에서 메시지를 추출할 수 없었습니다. sender/message 필드를 확인해 주세요.',
      fallbackText: raw,
    };
  }

  if (fallbackCount > 0) {
    warnings.push(`${fallbackCount}개의 항목을 파싱하지 못했습니다.`);
  }

  const normalized = lines.join('\n');
  console.log(`[parseJson] ✅ Output: ${lines.length} lines, ${normalized.length} chars total`);

  return { ok: true, text: normalized, format: 'json', warnings };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Reads a File and returns a normalized plain-text string
 * used ONLY as LLM context — never sent to the backend directly.
 */
export async function normalizeConversationFile(file: File): Promise<ParseResult> {
  const raw = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  console.log(`[normalizeConversationFile] File: "${file.name}", ext: "${ext}", raw size: ${raw.length} chars`);

  let result: ParseResult;
  switch (ext) {
    case 'txt':  result = parseTxt(raw);  break;
    case 'csv':  result = parseCsv(raw);  break;
    case 'json': result = parseJson(raw); break;
    default:
      result = {
        ok: false,
        error: `지원하지 않는 파일 형식입니다 (.${ext ?? '알 수 없음'}). .txt, .csv, .json 파일만 지원합니다.`,
        fallbackText: raw,
      };
  }

  // ── Checkpoint 1: What survived parsing? ──────────────────────────────────
  if (result.ok) {
    const lineCount = result.text.split('\n').length;
    console.log(
      `[normalizeConversationFile] ✅ Parse succeeded.\n` +
      `  format  : ${result.format}\n` +
      `  lines   : ${lineCount}\n` +
      `  chars   : ${result.text.length}\n` +
      `  full text:\n${result.text}`
    );
  } else {
    console.warn(`[normalizeConversationFile] ❌ Parse failed: ${result.error}`);
  }

  return result;
}
