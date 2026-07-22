'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCatalog } from '../Provider';
import { useFx } from '../FxContext';
import { apiClient } from '../lib/api-client';
import {
  CRAFT_AGENT_CONTEXT,
  craftContextLabel,
  formatCraftContext,
  videoCraftSlice,
  type CraftSelection,
} from '../lib/craft-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Free-form studio craft chat. Uses Preframe LLM settings via /api/inference
 * and injects live selection (video / FX / view) each turn.
 */
export function CraftChat() {
  const pathname = usePathname();
  const {
    view,
    filter,
    selectedVideo,
    projectVideo,
    videoId,
  } = useCatalog();
  const { fxSelectedId, fxParams } = useFx();

  const selection = useMemo<CraftSelection>(() => {
    const surface =
      view === 'fx'
        ? 'fx'
        : view === 'music' || view === 'new-music'
          ? 'music'
          : view === 'assets'
            ? 'assets'
            : view === 'queue'
              ? 'queue'
              : view === 'frames'
                ? 'frames'
                : selectedVideo || projectVideo
                  ? 'video-detail'
                  : 'catalog';

    return {
      surface,
      route: pathname,
      view: view ?? null,
      filter: filter !== 'all' ? filter : null,
      video: videoCraftSlice(selectedVideo ?? projectVideo),
      fx:
        view === 'fx' && fxSelectedId
          ? { id: fxSelectedId, params: fxParams }
          : null,
      music:
        view === 'music' || view === 'new-music'
          ? { instrumental: true, model: 'music-2.6' }
          : null,
      notes:
        videoId && !selectedVideo
          ? `videoId in URL but not loaded yet: ${videoId}`
          : undefined,
    };
  }, [
    view,
    filter,
    pathname,
    selectedVideo,
    projectVideo,
    videoId,
    fxSelectedId,
    fxParams,
  ]);

  const contextText = useMemo(() => formatCraftContext(selection), [selection]);
  const contextLabel = useMemo(() => craftContextLabel(selection), [selection]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const userMsg: ChatMessage = { id: newId(), role: 'user', text: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setBusy(true);
      setError(null);

      const history = nextMessages
        .slice(-10)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n\n');

      try {
        const res = await apiClient.post('/api/inference', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: CRAFT_AGENT_CONTEXT,
            prompt: trimmed,
            context: `${contextText}\n\n## Recent conversation\n${history}`,
            maxTokens: 1600,
            jsonOutput: false,
          }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `Inference failed (${res.status})`);
        }
        const reply = (data.text || '').trim() || '(empty reply)';
        setMessages(prev => [...prev, { id: newId(), role: 'assistant', text: reply }]);
      } catch (err: any) {
        setError(err?.message || 'Chat failed');
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, messages, contextText],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 font-mono text-[12px]">
      {/* Context strip */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <Sparkles size={12} className="text-cyan-400/70 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Craft</div>
          <div className="text-[11px] text-white/55 truncate" title={contextText}>
            {contextLabel}
            <span className="text-white/25"> · free-form · technical detail</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="p-1.5 rounded-sm text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
            title="Clear chat"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto frame-scrollbar p-3 space-y-3">
        {messages.length === 0 && !busy && (
          <div className="text-white/30 space-y-2 py-6 px-1 select-none">
            <p className="text-white/45">Talk about what&apos;s selected — music beds, FX looks, composition structure.</p>
            <ul className="space-y-1 text-[11px] text-white/28 list-disc pl-4">
              <li>Make this more specific for a 30s instrumental</li>
              <li>What params matter for this FX under UI?</li>
              <li>Draft a treatment prompt for this clip</li>
            </ul>
          </div>
        )}
        {messages.map(m => (
          <div
            key={m.id}
            className={`rounded-sm px-2.5 py-2 whitespace-pre-wrap leading-relaxed ${
              m.role === 'user'
                ? 'bg-cyan-400/[0.06] border border-cyan-400/15 text-white/80 ml-6'
                : 'bg-white/[0.03] border border-white/[0.06] text-white/70 mr-4'
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-white/35 text-[11px] px-1">
            <Loader2 size={12} className="animate-spin" />
            Thinking with current selection…
          </div>
        )}
        {error && (
          <div className="text-[11px] text-red-300/80 px-2 py-1.5 rounded-sm border border-red-400/20 bg-red-400/[0.06]">
            {error}
            <div className="text-white/30 mt-1">Needs LLM configured in Settings → Models.</div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="shrink-0 border-t border-white/[0.06] p-2 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="Ask about direction, params, prompts…"
          disabled={busy}
          className="flex-1 resize-none bg-white/[0.03] border border-white/[0.08] rounded-sm px-2.5 py-2 text-[12px] text-white/75 placeholder:text-white/20 outline-none focus:border-white/[0.18] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 px-3 py-2 rounded-sm text-[10px] font-mono uppercase tracking-wider border border-cyan-400/25 text-cyan-200/85 hover:bg-cyan-400/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
