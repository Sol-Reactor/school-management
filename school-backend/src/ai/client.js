// Thin wrapper around the official Anthropic SDK. All Claude calls go through
// here, on the server only. The API key never reaches the browser.
import Anthropic from '@anthropic-ai/sdk';
import config from '../config/env.js';
import { AppError } from '../lib/errors.js';

// Current default from Anthropic's model docs; override with ANTHROPIC_MODEL.
export const DEFAULT_MODEL = 'claude-opus-5-5';
// Models that support server-side refusal fallbacks (fallbacks: "default").
const FALLBACK_MODELS = new Set(['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5']);

export const aiModel = () => config.ANTHROPIC_MODEL || DEFAULT_MODEL;
export const aiConfigured = () => Boolean(config.ANTHROPIC_API_KEY);

/** Operational AI failure with a stable code the UI can map to a friendly message. */
export class AiError extends AppError {
  constructor(code, message, status = 503) {
    super(status, message);
    this.name = 'AiError';
    this.code = code;
  }
}

let client;
const getClient = () => {
  if (!aiConfigured()) throw new AiError('AI_NOT_CONFIGURED', 'AI insights are not set up on this server yet.');
  client ??= new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 90_000 });
  return client;
};

/** Maps SDK errors to AiError (most specific first, never string matching). */
const translate = (err) => {
  if (err instanceof AiError) return err;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new AiError('AI_NOT_CONFIGURED', 'The AI service rejected this server’s credentials.');
  }
  if (err instanceof Anthropic.NotFoundError) {
    return new AiError('AI_NOT_CONFIGURED', 'The configured AI model is not available. Check ANTHROPIC_MODEL.');
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new AiError('AI_BUSY', 'The AI service is busy right now. Please try again in a minute.');
  }
  if (err instanceof Anthropic.APIUserAbortError) {
    return new AiError('AI_ABORTED', 'Generation was cancelled.', 499);
  }
  if (err instanceof Anthropic.APIConnectionError || (err instanceof Anthropic.APIError && (err.status ?? 500) >= 500)) {
    return new AiError('AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again shortly.', 502);
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new AiError('AI_REQUEST_FAILED', 'The AI service could not process this request.', 502);
  }
  return new AiError('AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again shortly.', 502);
};

/**
 * Streams a single-turn completion. `onText` receives text deltas as they arrive.
 * Resolves with { text, model, usage }; rejects with AiError.
 */
export const streamCompletion = async ({ system, user, maxTokens = 8000, effort = 'medium', onText, signal }) => {
  try {
    const model = aiModel();
    const stream = getClient().beta.messages.stream(
      {
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
        output_config: { effort },
        // If a safety classifier declines, the API retries on a suitable model itself.
        ...(FALLBACK_MODELS.has(model) && { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }),
      },
      { signal }
    );

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') onText?.(event.delta.text);
    }
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      throw new AiError('AI_REFUSED', 'The AI declined to write this summary. Please review the data manually.', 422);
    }
    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!text) throw new AiError('AI_EMPTY', 'The AI returned an empty response. Please try again.', 502);
    return { text, model: message.model, usage: message.usage };
  } catch (err) {
    throw translate(err);
  }
};
