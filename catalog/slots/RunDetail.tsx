'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  FileText,
  Image as ImageIcon,
  Music,
  Play,
} from 'lucide-react';
import { useCatalog } from '../Provider';
import { useRun } from '../hooks/useRuns';
import { pathForRun, pathForView } from '../lib/routes';
import { CopyLink, MetaChip, PendingChip, RoleChip, StatusPill } from './RunPrimitives';
import { relativeTime } from './RunsView';
import {
  artifactSrc,
  itemsInGroup,
  runHero,
  sortItems,
  type Run,
  type RunItem,
} from '../../lib/runs';

export function RunDetail({ slug }: { slug: string }) {
  const { runItemId, openRunItem, setView } = useCatalog();
  const { run, status } = useRun(slug);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-full items-center justify-center text-white/20 text-[12px] font-mono tracking-wider uppercase">
        Loading run…
      </div>
    );
  }

  if (status === 'missing' || !run) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
        <div className="text-[12px] text-white/45">No run named “{slug}”</div>
        <a
          href={pathForView('runs')}
          onClick={e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            setView('runs');
          }}
          className="text-[11px] font-mono text-cyan-300/60 hover:text-cyan-200"
        >
          ← All runs
        </a>
      </div>
    );
  }

  return (
    <RunDossier
      run={run}
      selectedId={runItemId}
      onSelect={id => openRunItem(run.slug, id)}
      onBack={() => setView('runs')}
    />
  );
}

// ---------------------------------------------------------------------------
// Dossier
// ---------------------------------------------------------------------------

function RunDossier({
  run,
  selectedId,
  onSelect,
  onBack,
}: {
  run: Run;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onBack: () => void;
}) {
  const hero = runHero(run);
  const selected = selectedId ? run.items.find(i => i.id === selectedId) ?? null : null;

  /**
   * The stage shows the selected member when it is playable, otherwise the
   * run's hero. Selecting a script or a still therefore highlights the row
   * without yanking the film off screen.
   */
  const staged = selected && (selected.kind === 'video' || selected.kind === 'audio') ? selected : hero;

  /**
   * The deliverables switcher, clustered by section — with two edits in one run
   * a flat row of "16:9 9:16 1:1 16:9 9:16 1:1" tells you nothing.
   */
  const variantGroups = useMemo(() => {
    const deliverables = sortItems(
      run.items.filter(i => i.role === 'final' || i.role === 'variant'),
    );
    const groupLabel = new Map(run.groups.map(g => [g.id, g.label]));
    const clusters: Array<{ id: string; label: string; items: RunItem[] }> = [];
    for (const item of deliverables) {
      const id = item.groupId ?? '';
      let cluster = clusters.find(c => c.id === id);
      if (!cluster) {
        cluster = { id, label: groupLabel.get(id) ?? 'Deliverables', items: [] };
        clusters.push(cluster);
      }
      cluster.items.push(item);
    }
    return clusters;
  }, [run.items, run.groups]);

  const ungrouped = itemsInGroup(run, null).filter(i => i.role !== 'final' && i.role !== 'variant');

  return (
    <div className="h-full overflow-y-auto frame-scrollbar">
      <div className="max-w-[1180px] mx-auto px-6 pb-16">
        <RunHeader run={run} onBack={onBack} />

        {staged && (
          <Stage
            run={run}
            item={staged}
            variantGroups={variantGroups}
            selectedId={staged.id}
            onSelect={onSelect}
          />
        )}

        {run.brief && <Brief brief={run.brief} />}

        {run.groups.map(group => {
          const items = itemsInGroup(run, group.id).filter(
            i => !(staged && i.id === staged.id && (i.role === 'final' || i.role === 'variant')),
          );
          if (items.length === 0) return null;
          return (
            <Section key={group.id} title={group.label} description={group.description} count={items.length}>
              {items.map(item => (
                <ItemRow
                  key={item.id}
                  run={run}
                  item={item}
                  selected={item.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
            </Section>
          );
        })}

        {ungrouped.length > 0 && (
          <Section title="Other" count={ungrouped.length}>
            {ungrouped.map(item => (
              <ItemRow
                key={item.id}
                run={run}
                item={item}
                selected={item.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function RunHeader({ run, onBack }: { run: Run; onBack: () => void }) {
  return (
    <div className="pt-6 pb-5 border-b border-white/[0.05]">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors mb-3"
      >
        <ArrowLeft size={10} />
        All runs
      </button>

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">Run</span>
            <StatusPill status={run.status} />
            {run.tags?.map(tag => (
              <span
                key={tag}
                className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/22"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-[19px] text-white/90 font-medium leading-tight">{run.title}</h1>
          {run.description && (
            <p className="text-[12px] text-white/45 mt-1.5 max-w-[70ch] leading-relaxed">
              {run.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-[9.5px] font-mono uppercase tracking-[0.12em] text-white/25">
            <span>{run.items.length} artifacts</span>
            <span>·</span>
            <span>{run.groups.length} sections</span>
            <span>·</span>
            <span>updated {relativeTime(run.updatedAt)}</span>
            <span className="font-normal tracking-normal text-white/18 normal-case">
              {pathForRun(run.slug)}
            </span>
          </div>
        </div>
        <CopyLink path={pathForRun(run.slug)} label="Copy run link" />
      </div>
    </div>
  );
}

/** Hero player plus the format switcher for the delivered variants. */
function Stage({
  run,
  item,
  variantGroups,
  selectedId,
  onSelect,
}: {
  run: Run;
  item: RunItem;
  variantGroups: Array<{ id: string; label: string; items: RunItem[] }>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const portrait = String(item.meta?.format ?? '') === '9:16';
  const src = artifactSrc(run, item);

  return (
    <div className="pt-6">
      <div className="flex gap-5 items-start flex-wrap">
        {/* Proportional basis rather than flex-1: the stage and its notes shrink
            together inside the panel and only stack on a genuinely narrow one. */}
        <div
          className={`relative rounded-lg overflow-hidden border border-white/[0.07] bg-black ${
            portrait ? 'w-[280px] shrink-0' : 'flex-[2_1_360px] min-w-0 max-w-[760px]'
          }`}
        >
          {item.state !== 'ready' ? (
            <div className="aspect-video flex flex-col items-center justify-center gap-2 bg-white/[0.015]">
              <PendingChip />
              <span className="text-[10px] font-mono text-white/25">
                {item.ref.path ?? item.label}
              </span>
            </div>
          ) : item.kind === 'audio' ? (
            <div className="p-5 flex flex-col gap-3 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-white/60">
                <Music size={14} />
                <span className="text-[12px]">{item.label}</span>
              </div>
              {src && <audio src={src} controls className="w-full" />}
            </div>
          ) : src ? (
            <video
              key={src}
              src={src}
              controls
              preload="metadata"
              playsInline
              className="w-full block max-h-[62vh]"
            />
          ) : (
            <div className="aspect-video flex items-center justify-center text-[11px] font-mono text-white/20">
              No file — {item.ref.path ?? item.label}
            </div>
          )}
        </div>

        <div className="flex-[1_1_240px] min-w-0 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2">
              <RoleChip role={item.role} />
              {item.preferred && (
                <span className="text-[8.5px] font-mono uppercase tracking-[0.16em] text-emerald-300/60">
                  preferred
                </span>
              )}
            </div>
            <div className="text-[13px] text-white/85 mt-1">{item.label}</div>
            {item.description && (
              <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{item.description}</p>
            )}
          </div>

          <ItemLinks run={run} item={item} />

          {variantGroups.some(g => g.items.length > 0) && (
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/22">
                Deliverables
              </div>
              {variantGroups.map(group => (
                <div key={group.id} className="flex flex-col gap-1">
                  <div className="text-[9px] text-white/28 truncate">{group.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelect(v.id)}
                        title={`${v.label}${v.state !== 'ready' ? ' — not rendered yet' : ''}`}
                        className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
                          v.id === selectedId
                            ? 'border-cyan-400/40 bg-cyan-400/[0.12] text-cyan-100'
                            : v.state !== 'ready'
                              ? 'border-amber-400/15 bg-amber-400/[0.04] text-amber-200/50 hover:border-amber-400/30'
                              : 'border-white/[0.08] bg-white/[0.02] text-white/45 hover:text-white/75 hover:border-white/[0.16]'
                        }`}
                      >
                        {String(v.meta?.variantLabel ?? v.meta?.format ?? v.label)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Brief({ brief }: { brief: string }) {
  return (
    <Section title="Brief">
      <div className="text-[12px] text-white/50 leading-relaxed whitespace-pre-wrap max-w-[76ch] font-light">
        {brief}
      </div>
    </Section>
  );
}

function Section({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-8">
      <div className="flex items-baseline gap-2 pb-2.5 border-b border-white/[0.05]">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">{title}</h2>
        {count != null && <span className="text-[9px] font-mono text-white/20">{count}</span>}
        {description && (
          <span className="text-[10px] text-white/25 ml-2 truncate">{description}</span>
        )}
      </div>
      <div className="pt-2.5 flex flex-col gap-1">{children}</div>
    </section>
  );
}

const KIND_ICON = {
  video: Play,
  audio: Music,
  image: ImageIcon,
  code: Code2,
  doc: FileText,
  link: ArrowUpRight,
} as const;

function ItemRow({
  run,
  item,
  selected,
  onSelect,
}: {
  run: Run;
  item: RunItem;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { openFile } = useCatalog();
  const ref = useRef<HTMLDivElement>(null);
  const Icon = KIND_ICON[item.kind] ?? ArrowUpRight;
  const src = artifactSrc(run, item);

  // A deep link should land on the artifact, not near it.
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selected]);

  const openable = item.kind === 'code' && item.state === 'ready' && item.ref.path;

  return (
    <div
      ref={ref}
      onClick={() => onSelect(item.id)}
      className={`group flex items-center gap-3 px-2.5 py-2 rounded-md border transition-colors cursor-pointer ${
        selected
          ? 'border-cyan-400/30 bg-cyan-400/[0.06]'
          : 'border-transparent hover:border-white/[0.07] hover:bg-white/[0.02]'
      }`}
    >
      <span className="shrink-0 text-white/22 group-hover:text-white/40 transition-colors">
        <Icon size={13} />
      </span>

      {item.kind === 'image' && src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-16 h-9 object-cover rounded-sm border border-white/[0.06] shrink-0"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-white/75 truncate">{item.label}</span>
          <RoleChip role={item.role} />
          {item.state !== 'ready' && <PendingChip />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9.5px] font-mono text-white/22 truncate">
            {item.ref.path ?? item.ref.url ?? item.ref.nativeHref}
          </span>
          {item.description && (
            <span className="text-[10px] text-white/28 truncate hidden md:inline">
              — {item.description}
            </span>
          )}
        </div>
      </div>

      {typeof item.meta?.format === 'string' && <MetaChip>{item.meta.format}</MetaChip>}

      {item.kind === 'audio' && src && (
        <audio
          src={src}
          controls
          preload="none"
          onClick={e => e.stopPropagation()}
          className="h-7 w-[210px] shrink-0"
        />
      )}

      <div
        className="flex items-center gap-1 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        {openable && (
          <button
            type="button"
            onClick={() => openFile(item.ref.path!)}
            title="Open in code panel"
            className="px-1.5 py-1 rounded border border-white/[0.08] bg-white/[0.02] text-white/35 hover:text-cyan-200/90 hover:border-cyan-400/25 transition-colors"
          >
            <Code2 size={10} />
          </button>
        )}
        <ItemLinks run={run} item={item} compact />
      </div>
    </div>
  );
}

/** Native view link + the run deep link, which is always stable. */
function ItemLinks({ run, item, compact }: { run: Run; item: RunItem; compact?: boolean }) {
  const deepLink = pathForRun(run.slug, item.id);

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'flex-wrap'}`}>
      {item.ref.nativeHref && (
        <a
          href={item.ref.nativeHref}
          title={`Open ${item.ref.nativeHref}`}
          className={`inline-flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.02] text-white/38 hover:text-cyan-200/90 hover:border-cyan-400/25 transition-colors ${
            compact ? 'px-1.5 py-1' : 'px-2 py-1'
          }`}
        >
          <ArrowUpRight size={10} />
          {!compact && (
            <span className="text-[9px] font-mono uppercase tracking-[0.12em]">Open</span>
          )}
        </a>
      )}
      <CopyLink
        path={item.ref.nativeHref ?? deepLink}
        label={`Copy link to ${item.label}`}
        compact={compact}
      />
    </div>
  );
}
