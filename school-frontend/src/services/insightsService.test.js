import { afterEach, describe, expect, it, vi } from 'vitest';
import { InsightError, insightsApi } from './insightsService';

const sseResponse = (blocks) => {
  const encoder = new TextEncoder();
  const text = blocks.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join('');
  // Split mid-event to prove the parser buffers partial chunks.
  const chunks = [text.slice(0, 17), text.slice(17, 60), text.slice(60)];
  const body = new ReadableStream({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
};

afterEach(() => vi.unstubAllGlobals());

describe('insightsApi.generateSummary', () => {
  it('streams deltas and resolves with the saved insight', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([
      ['meta', { model: 'claude-opus-5-5', canned: false }],
      ['delta', { text: 'Amina is ' }],
      ['delta', { text: 'doing well.' }],
      ['done', { insight: { id: 'i1', content: 'Amina is doing well.' } }],
    ])));
    const deltas = [];
    const result = await insightsApi.generateSummary('s1', { onDelta: (t) => deltas.push(t) });
    expect(deltas.join('')).toBe('Amina is doing well.');
    expect(result).toEqual({ insight: { id: 'i1', content: 'Amina is doing well.' }, cached: false });
    expect(fetch).toHaveBeenCalledWith('/api/insights/students/s1/summary', expect.objectContaining({ method: 'POST', credentials: 'include' }));
  });

  it('returns a cached summary sent as plain JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ cached: true, insight: { id: 'old' } })));
    await expect(insightsApi.generateSummary('s1')).resolves.toEqual({ insight: { id: 'old' }, cached: true });
  });

  it('turns a stream error event into an InsightError with its code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([
      ['meta', { model: 'x' }],
      ['error', { code: 'AI_BUSY', message: 'Busy' }],
    ])));
    const err = await insightsApi.generateSummary('s1').catch((e) => e);
    expect(err).toBeInstanceOf(InsightError);
    expect(err.code).toBe('AI_BUSY');
  });

  it('surfaces HTTP errors such as the per-user rate limit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ code: 'AI_RATE_LIMITED', message: 'Slow down' }, { status: 429 })));
    const err = await insightsApi.generateSummary('s1').catch((e) => e);
    expect(err).toMatchObject({ code: 'AI_RATE_LIMITED', status: 429, message: 'Slow down' });
  });
});
