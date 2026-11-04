// Haya Insights API. The summary endpoint streams server-sent events, so it uses
// fetch() (axios can't read a streaming body in the browser).
import api from './api';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export class InsightError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const insightsApi = {
  getSummary: (studentId) => api.get(`/insights/students/${studentId}/summary`).then((r) => r.data),
  atRisk: () => api.get('/insights/at-risk').then((r) => r.data),
  explainRisk: (studentId, regenerate = false) =>
    api.post(`/insights/at-risk/${studentId}/explain`, { regenerate }).then((r) => r.data),

  /**
   * Generates (or returns a cached) progress summary.
   * Calls onDelta(text) for each streamed chunk; resolves with the saved insight.
   */
  async generateSummary(studentId, { regenerate = false, onDelta, onMeta, signal } = {}) {
    const res = await fetch(`${API_BASE}/insights/students/${studentId}/summary`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ regenerate }),
      signal,
    });

    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || type.includes('application/json')) {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new InsightError(body.message ?? 'Could not generate a summary.', body.code, res.status);
      return { insight: body.insight, cached: true };
    }

    // Parse the SSE stream: blocks separated by a blank line, "event:" + "data:" lines.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = null;
    for (;;) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = /^event: (.+)$/m.exec(block)?.[1];
        const data = JSON.parse(/^data: (.+)$/m.exec(block)?.[1] ?? 'null');
        if (event === 'meta') onMeta?.(data);
        else if (event === 'delta') onDelta?.(data.text);
        else if (event === 'done') done = data.insight;
        else if (event === 'error') throw new InsightError(data.message, data.code, 502);
      }
    }
    if (!done) throw new InsightError('The summary stream ended unexpectedly. Please try again.', 'AI_STREAM_ENDED');
    return { insight: done, cached: false };
  },
};
