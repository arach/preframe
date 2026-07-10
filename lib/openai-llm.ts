import OpenAI from 'openai';
import type { ModelConfig } from './provider';

export interface OpenAITextCallOptions {
  system: string;
  userMessage: string;
  maxTokens: number;
  jsonOutput?: boolean;
}

export interface OpenAITextCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  api: 'responses' | 'chat-completions';
}

/** Native OpenAI / Codex path uses the Responses API; third-party OpenAI-compat keeps chat completions. */
export function usesOpenAIResponsesApi(config: ModelConfig): boolean {
  if (config.format !== 'openai') return false;
  const base = config.baseUrl.trim().replace(/\/$/, '');
  if (!base) return true;
  return base.includes('api.openai.com');
}

function createClient(config: ModelConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
  });
}

function extractResponsesUsage(response: OpenAI.Responses.Response): {
  inputTokens: number;
  outputTokens: number;
} {
  return {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  };
}

export async function callOpenAIText(
  config: ModelConfig,
  opts: OpenAITextCallOptions,
): Promise<OpenAITextCallResult> {
  const client = createClient(config);

  if (usesOpenAIResponsesApi(config)) {
    const response = await client.responses.create({
      model: config.model,
      instructions: opts.system,
      input: opts.userMessage,
      max_output_tokens: opts.maxTokens,
      ...(opts.jsonOutput
        ? { text: { format: { type: 'json_object' as const } } }
        : {}),
    });

    const usage = extractResponsesUsage(response);
    return {
      text: response.output_text ?? '',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      model: config.model,
      api: 'responses',
    };
  }

  const response = await client.chat.completions.create({
    model: config.model,
    max_completion_tokens: opts.maxTokens,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.userMessage },
    ],
    ...(opts.jsonOutput ? { response_format: { type: 'json_object' as const } } : {}),
  });

  return {
    text: response.choices[0]?.message?.content ?? '',
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    model: config.model,
    api: 'chat-completions',
  };
}