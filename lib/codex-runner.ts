import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface CodexRunnerOptions {
  cwd?: string;
  model?: string;
  executable?: string;
  sandbox?: 'read-only' | 'workspace-write' | 'danger-full-access';
  approvalPolicy?: 'untrusted' | 'on-request' | 'on-failure' | 'never';
  /** Reuse one app-server process across requests (default: true). */
  persistent?: boolean;
}

export interface CodexCompleteOptions {
  system: string;
  userMessage: string;
  model?: string;
  cwd?: string;
  timeoutMs?: number;
}

export interface CodexCompleteResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  threadId: string;
  turnId: string;
}

type JsonRpcResponse = {
  id: string | number;
  result?: unknown;
  error?: { message?: string };
};

type JsonRpcNotification = {
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcServerRequest = {
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

type TurnWaiter = {
  turnId: string;
  threadId: string;
  resolve: (result: CodexCompleteResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  model: string;
  textByItemId: Map<string, string>;
  inputTokens: number;
  outputTokens: number;
};

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

let sharedRunner: CodexRunner | null = null;

export function getCodexRunner(options?: CodexRunnerOptions): CodexRunner {
  if (!sharedRunner) {
    sharedRunner = new CodexRunner(options);
  }
  return sharedRunner;
}

export async function shutdownCodexRunner(): Promise<void> {
  if (!sharedRunner) return;
  await sharedRunner.shutdown();
  sharedRunner = null;
}

const CODEX_CANDIDATES = [
  process.env.CODEX_PATH,
  '/Applications/Codex.app/Contents/Resources/codex',
  '/Applications/ChatGPT.app/Contents/Resources/codex',
  join(homedir(), '.local', 'bin', 'codex'),
  '/usr/local/bin/codex',
  '/opt/homebrew/bin/codex',
  'codex',
].filter((value): value is string => !!value);

function resolveCodexExecutable(explicit?: string): string {
  if (explicit) return explicit;
  for (const candidate of CODEX_CANDIDATES) {
    if (candidate === 'codex' || existsSync(candidate)) return candidate;
  }
  return 'codex';
}

function parseJsonLine(line: string): JsonRpcResponse | JsonRpcNotification | JsonRpcServerRequest | null {
  try {
    return JSON.parse(line) as JsonRpcResponse | JsonRpcNotification | JsonRpcServerRequest;
  } catch {
    return null;
  }
}

function isResponse(message: unknown): message is JsonRpcResponse {
  return Boolean(message && typeof message === 'object' && 'id' in message && ('result' in message || 'error' in message));
}

function isServerRequest(message: unknown): message is JsonRpcServerRequest {
  return Boolean(
    message &&
    typeof message === 'object' &&
    'id' in message &&
    'method' in message &&
    !('result' in message) &&
    !('error' in message),
  );
}

function isNotification(message: unknown): message is JsonRpcNotification {
  return Boolean(message && typeof message === 'object' && 'method' in message && !('id' in message));
}

function extractTextDelta(params: Record<string, unknown>): string {
  if (typeof params.delta === 'string') return params.delta;
  if (typeof params.text === 'string') return params.text;
  const delta = params.delta as Record<string, unknown> | undefined;
  if (typeof delta?.text === 'string') return delta.text;
  return '';
}

export class CodexRunner {
  private readonly defaults: Required<Pick<CodexRunnerOptions, 'cwd' | 'sandbox' | 'approvalPolicy' | 'persistent'>> & {
    model: string;
    executable: string;
  };

  private process: ChildProcessWithoutNullStreams | null = null;
  private lineBuffer = '';
  private nextRequestId = 1;
  private readonly pendingRequests = new Map<string | number, PendingRequest>();
  private starting: Promise<void> | null = null;
  private activeTurn: TurnWaiter | null = null;
  private workChain = Promise.resolve();
  private initialized = false;

  constructor(options: CodexRunnerOptions = {}) {
    this.defaults = {
      cwd: options.cwd ?? process.cwd(),
      model: options.model ?? 'gpt-5.5',
      executable: resolveCodexExecutable(options.executable),
      sandbox: options.sandbox ?? 'read-only',
      approvalPolicy: options.approvalPolicy ?? 'never',
      persistent: options.persistent ?? true,
    };
  }

  /** Start (or reuse) the app-server process without running a turn. */
  async warmup(): Promise<void> {
    await this.ensureStarted();
  }

  async complete(opts: CodexCompleteOptions): Promise<CodexCompleteResult> {
    const task = () => this.runTurn(opts);
    const result = this.workChain.then(task, task);
    this.workChain = result.then(() => undefined, () => undefined);
    return result;
  }

  async shutdown(): Promise<void> {
    const child = this.process;
    this.process = null;
    this.starting = null;
    this.initialized = false;
    this.lineBuffer = '';
    this.failActiveTurn(new Error('Codex runner shut down'));

    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error('Codex runner shut down'));
    }
    this.pendingRequests.clear();

    if (child && child.exitCode === null && !child.killed) {
      child.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 250));
      if (child.exitCode === null && !child.killed) {
        child.kill('SIGKILL');
      }
    }
  }

  private async runTurn(opts: CodexCompleteOptions): Promise<CodexCompleteResult> {
    await this.ensureStarted();

    const model = opts.model || this.defaults.model;
    const cwd = opts.cwd || this.defaults.cwd;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const started = await this.request<{ thread: { id: string } }>('thread/start', {
      cwd,
      approvalPolicy: this.defaults.approvalPolicy,
      sandbox: this.defaults.sandbox,
      baseInstructions: opts.system,
      ephemeral: true,
      experimentalRawEvents: false,
      persistExtendedHistory: false,
      model,
    });

    const threadId = started.thread.id;
    const turn = await this.request<{ turn: { id: string } }>('turn/start', {
      threadId,
      cwd,
      input: [{ type: 'text', text: opts.userMessage, text_elements: [] }],
    });

    return await new Promise<CodexCompleteResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.failActiveTurn(new Error(`Codex turn timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.activeTurn = {
        turnId: turn.turn.id,
        threadId,
        resolve,
        reject,
        timeout,
        model,
        textByItemId: new Map(),
        inputTokens: 0,
        outputTokens: 0,
      };
    });
  }

  private async ensureStarted(): Promise<void> {
    if (this.process && this.initialized && this.process.exitCode === null && !this.process.killed) {
      return;
    }

    if (this.starting) {
      return this.starting;
    }

    this.starting = this.startProcess();
    try {
      await this.starting;
    } finally {
      this.starting = null;
    }
  }

  private async startProcess(): Promise<void> {
    const runtimeDir = join(homedir(), '.preframe', 'codex-runner');
    await mkdir(runtimeDir, { recursive: true });
    await writeFile(join(runtimeDir, 'last-start.txt'), new Date().toISOString());

    const child = spawn(this.defaults.executable, ['app-server'], {
      cwd: this.defaults.cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process = child;
    this.lineBuffer = '';
    this.initialized = false;

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', chunk => this.handleStdoutChunk(String(chunk)));
    child.once('error', error => {
      this.failSession(new Error(`Codex app-server failed: ${error.message}`));
    });
    child.once('exit', (code, signal) => {
      if (!this.process) return;
      this.failSession(
        new Error(
          `Codex app-server exited${code !== null ? ` with code ${code}` : ''}${signal ? ` (${signal})` : ''}`,
        ),
      );
    });

    await this.request('initialize', {
      clientInfo: {
        name: 'preframe-runner',
        title: 'Preframe Codex Runner',
        version: '0.1.0',
      },
      capabilities: {
        experimentalApi: true,
      },
    });
    this.notify('initialized');
    this.initialized = true;
  }

  private failSession(error: Error): void {
    this.process = null;
    this.initialized = false;
    this.failActiveTurn(error);
    for (const pending of this.pendingRequests.values()) {
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  private failActiveTurn(error: Error): void {
    const active = this.activeTurn;
    if (!active) return;
    clearTimeout(active.timeout);
    this.activeTurn = null;
    active.reject(error);
  }

  private handleStdoutChunk(chunk: string): void {
    this.lineBuffer += chunk;
    while (true) {
      const newlineIndex = this.lineBuffer.indexOf('\n');
      if (newlineIndex === -1) break;

      const line = this.lineBuffer.slice(0, newlineIndex).trim();
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);
      if (!line) continue;

      const message = parseJsonLine(line);
      if (!message) continue;

      if (isResponse(message)) {
        this.handleResponse(message);
        continue;
      }

      if (isServerRequest(message)) {
        this.writeMessage({
          id: message.id,
          error: {
            code: -32000,
            message: `Unsupported server request: ${message.method}`,
          },
        });
        continue;
      }

      if (isNotification(message)) {
        this.handleNotification(message);
      }
    }
  }

  private handleResponse(message: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(message.id);
    if (!pending) return;
    this.pendingRequests.delete(message.id);
    if (message.error) {
      pending.reject(new Error(message.error.message || 'Codex app-server request failed'));
      return;
    }
    pending.resolve(message.result);
  }

  private notificationTurnId(params: Record<string, unknown>): string | null {
    if (typeof params.turnId === 'string') return params.turnId;
    const turn = params.turn as Record<string, unknown> | undefined;
    return typeof turn?.id === 'string' ? turn.id : null;
  }

  private handleNotification(message: JsonRpcNotification): void {
    const params = message.params ?? {};
    const turnId = this.notificationTurnId(params);
    const active = this.activeTurn;

    switch (message.method) {
      case 'thread/tokenUsage/updated': {
        if (!active || !turnId || active.turnId !== turnId) return;
        const usage = (params.tokenUsage as Record<string, unknown> | undefined)?.last as Record<string, number> | undefined
          ?? (params.tokenUsage as Record<string, unknown> | undefined)?.total as Record<string, number> | undefined;
        if (usage) {
          active.inputTokens = usage.inputTokens ?? usage.input_tokens ?? active.inputTokens;
          active.outputTokens = usage.outputTokens ?? usage.output_tokens ?? active.outputTokens;
        }
        return;
      }
      case 'item/agentMessage/delta': {
        if (!active || !turnId || active.turnId !== turnId) return;
        const itemId = typeof params.itemId === 'string' ? params.itemId : 'default';
        const delta = extractTextDelta(params);
        if (!delta) return;
        active.textByItemId.set(itemId, `${active.textByItemId.get(itemId) ?? ''}${delta}`);
        return;
      }
      case 'item/completed': {
        if (!active || !turnId || active.turnId !== turnId) return;
        const item = params.item as Record<string, unknown> | undefined;
        const itemId = typeof item?.id === 'string' ? item.id : null;
        if (item?.type === 'agentMessage' && itemId && typeof item.text === 'string') {
          active.textByItemId.set(itemId, item.text);
        }
        return;
      }
      case 'turn/completed': {
        if (!active || !turnId || active.turnId !== turnId) return;
        const turn = params.turn as Record<string, unknown> | undefined;
        const usage = turn?.usage as Record<string, number> | undefined
          ?? (params.usage as Record<string, number> | undefined);
        if (turn?.status === 'failed') {
          const err = turn.error as Record<string, unknown> | undefined;
          this.failActiveTurn(new Error(typeof err?.message === 'string' ? err.message : 'Codex turn failed'));
          return;
        }

        const text = [...active.textByItemId.values()].join('\n').trim();
        clearTimeout(active.timeout);
        this.activeTurn = null;
        active.resolve({
          text,
          inputTokens: usage?.input_tokens ?? usage?.inputTokens ?? active.inputTokens,
          outputTokens: usage?.output_tokens ?? usage?.outputTokens ?? active.outputTokens,
          model: active.model,
          threadId: typeof params.threadId === 'string' ? params.threadId : active.threadId,
          turnId: active.turnId,
        });
        return;
      }
      default:
        return;
    }
  }

  private request<T = unknown>(method: string, params?: unknown): Promise<T> {
    const id = this.nextRequestId++;
    const payload = { id, method, params };
    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: value => resolve(value as T),
        reject,
      });
      this.writeMessage(payload);
    });
  }

  private notify(method: string, params?: unknown): void {
    this.writeMessage({ method, params });
  }

  private writeMessage(payload: Record<string, unknown>): void {
    const child = this.process;
    if (!child?.stdin.writable) {
      throw new Error('Codex app-server stdin is not writable');
    }
    child.stdin.write(`${JSON.stringify(payload)}\n`);
  }
}
