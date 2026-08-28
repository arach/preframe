#!/usr/bin/env bun
// Registers the delivered OpenScout V3 films into the Preframe catalog editor as
// Treatments, so they are available for visual review, annotation, compare and
// the revise workflow.
//
//   bun run scripts/register-openscout-v3-treatments.ts [--base http://localhost:3100]
//
// One job per edit, each carrying its three delivered formats. `mode=treatment`
// copies the outputs into public/out and creates a completed render job; the
// canonical files in out/openscout-v3/ are left untouched (the intake service
// only ever copyFile()s — it never renames or unlinks).

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const baseArg = process.argv.indexOf('--base')
const BASE = baseArg !== -1 ? process.argv[baseArg + 1] : 'http://localhost:3100'
const OUT = resolve('out/openscout-v3')

type Treatment = {
  compositionId: string
  name: string
  prompt: string
  files: string[]
}

const TREATMENTS: Treatment[] = [
  {
    compositionId: 'openscout-v3-hype',
    name: 'OpenScout V3 — Edit 1 · Hype / appetizer (21.7s, beat-led)',
    prompt:
      'Short beat-led preview, 21.667 s. Four beats: CONNECT (fleet discovered and online) -> CHOOSE (agent, model and effort in the real picker) -> CONVERSE (agent reply and receipt) -> DISPATCH (describe the task, send it to the host) -> off-white mark. Locked camera, no phone motion; detail lens is the only thing that moves. 50-frame bars at 144 BPM so every cut lands on a downbeat. Canonical #F7F4EA wire mark, verified on rendered pixels.',
    files: [
      'openscout-v3-hype-1920x1080.mp4',
      'openscout-v3-hype-1080x1920.mp4',
      'openscout-v3-hype-1080x1080.mp4',
    ],
  },
  {
    compositionId: 'openscout-v3-explainer',
    name: 'OpenScout V3 — Edit 2 · Extended explainer (45s, ambient)',
    prompt:
      'Ambient explainer, 45.000 s, told through real settings surfaces rather than diagrams. CONNECT -> PERSONALIZE (light/dark on the product own Mode row) -> AUTHORIZE (public key authenticates the bridge) -> ROUTE (first reachable wins: LAN, tailnet, relay) -> COMMUNICATE (conversation styles: the same feynman-2 thread shown as chat bubbles, then the global Chat control with View flipping Messaging to Original on screen, then the same thread re-rendered as a plain document) -> CHOOSE (agent and model) -> OBSERVE (live tail) -> REACH (continue on the paired Mac) -> off-white mark. Style names are the product own: View Original/Messaging, Style Messages/WhatsApp, Detail Normie/Techie. Claims stay within coordination and reachability. Locked camera; existing eerie score reused.',
    files: [
      'openscout-v3-explainer-1920x1080.mp4',
      'openscout-v3-explainer-1080x1920.mp4',
      'openscout-v3-explainer-1080x1080.mp4',
    ],
  },
]

const aspectFor = (file: string) =>
  file.includes('1920x1080') ? '16:9' : file.includes('1080x1920') ? '9:16' : '1:1'

async function main() {
  for (const t of TREATMENTS) {
    const outputs = t.files.map((f) => {
      const path = resolve(OUT, f)
      if (!existsSync(path)) throw new Error(`Missing deliverable: ${path}`)
      return { path, filename: f }
    })

    const payload = {
      mode: 'treatment',
      compositionId: t.compositionId,
      name: t.name,
      prompt: t.prompt,
      outputs,
      params: {
        aspectRatio: outputs.map((o) => aspectFor(o.filename)).join(', '),
        durationSec: t.compositionId === 'openscout-v3-hype' ? 21.667 : 45.0,
      },
      // Stable so a re-run updates rather than duplicating.
      idempotencyKey: `${t.compositionId}-2026-08-13-styles`,
    }

    const res = await fetch(`${BASE}/api/agents/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
    console.log(`\n=== ${t.compositionId} → HTTP ${res.status} ===`)
    console.log(typeof parsed === 'string' ? parsed.slice(0, 800) : JSON.stringify(parsed, null, 2))
    if (!res.ok) process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
