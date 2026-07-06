/**
 * jsonBuilder.ts
 *
 * Converts the LLM's final structured output into a JSON Blob
 * suitable for upload to POST /sessions/upload.
 */

/**
 * Convert a JSON object (from llmApi.buildFinalJson) into a Blob
 * ready to be attached as `file` field in FormData.
 */
export function buildJsonBlob(jsonData: unknown): Blob {
  let parsed: any;
  
  if (typeof jsonData === 'string') {
    try {
      const cleaned = jsonData.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn('Failed to parse jsonText in buildJsonBlob', e);
      parsed = { messages: [{ sender: 'AI', timestamp: new Date().toISOString(), message: String(jsonData) }] };
    }
  } else {
    parsed = jsonData;
  }

  let finalPayload = { messages: [] as any[] };
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.messages)) {
      finalPayload.messages = parsed.messages;
    } else if (Array.isArray(parsed)) {
      finalPayload.messages = parsed;
    } else {
      finalPayload.messages = [parsed];
    }
  }

  if (Array.isArray(finalPayload.messages)) {
    finalPayload.messages = finalPayload.messages.map((msg: any) => {
      let ts = msg.timestamp;
      if (!ts) {
        ts = new Date().toISOString();
      } else {
        let d = new Date(ts);
        if (isNaN(d.getTime())) {
          // If invalid, try prepending today's date (handles bare times like "09:15")
          const today = new Date().toISOString().split('T')[0];
          // Try adding seconds if it's just HH:mm
          const timePart = ts.length === 5 ? `${ts}:00` : ts;
          d = new Date(`${today}T${timePart}`);
          
          if (isNaN(d.getTime())) {
            // Try with space instead of T
            d = new Date(`${today} ${ts}`);
          }
        }
        
        ts = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
      }
      return { ...msg, timestamp: ts };
    });
  }

  const finalString = JSON.stringify(finalPayload);
  console.log('[buildJsonBlob] Exact final JSON payload with fixed timestamps:', JSON.stringify(finalPayload, null, 2));
  
  return new Blob([finalString], { type: 'application/json' });
}

/**
 * Helper: build a minimal JSON from an array of slot values,
 * used as a fallback if the LLM's JSON generation fails.
 */
export function buildFallbackJsonBlob(
  slots: { field: string; value: string }[]
): Blob {
  const messages = slots
    .filter((s) => s.value)
    .map((s) => ({
      sender: 'AI',
      timestamp: new Date().toISOString(),
      message: `${s.field}: ${s.value}`,
    }));
    
  const finalPayload = { messages };
  const finalString = JSON.stringify(finalPayload);
  console.log('[buildFallbackJsonBlob] Exact final JSON payload:', JSON.stringify(finalPayload, null, 2));

  return new Blob([finalString], { type: 'application/json' });
}
