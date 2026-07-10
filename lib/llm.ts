import Anthropic from '@anthropic-ai/sdk';
import { getCodexRunner } from './codex-runner';
import { callOpenAIText } from './openai-llm';
import { readProviderConfig, type ModelConfig } from './provider';

export interface LlmCallOptions {
  system: string;
  userMessage: string;
  maxTokens: number;
  /** Override the configured LLM slot (e.g. inference provider hints). */
  config?: ModelConfig;
}

export interface LlmCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  backend: string;
}

export function isLlmConfigured(config: ModelConfig = readProviderConfig()): boolean {
  if (!config.model) return false;
  if (config.format === 'codex') return true;
  return !!config.apiKey;
}

export async function callLlm(opts: LlmCallOptions): Promise<LlmCallResult> {
  const config = opts.config ?? readProviderConfig();
  if (!isLlmConfigured(config)) {
    throw new Error('LLM is not configured — open Settings and configure the LLM slot');
  }

  if (config.format === 'codex') {
    const result = await getCodexRunner({ model: config.model }).complete({
      system: opts.system,
      userMessage: opts.userMessage,
      model: config.model,
    });
    return {
      text: result.text,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      model: result.model,
      backend: 'codex-runner',
    };
  }

  if (config.format === 'openai') {
    const result = await callOpenAIText(config, opts);
    return {
      text: result.text,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      model: result.model,
      backend: result.api,
    };
  }

  const client = new Anthropic({
    apiKey: config.apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });
  const response = await client.messages.create({
    model: config.model,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: 'user', content: opts.userMessage }],
  });
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  return {
    text,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    model: config.model,
    backend: 'anthropic',
  };
}