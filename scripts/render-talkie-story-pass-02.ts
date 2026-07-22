#!/usr/bin/env bun
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dir, '..');
const OUT_DIR = join(ROOT, 'public', 'out');
const WORK_DIR = join(ROOT, '.compositions', 'talkie-story-pass-02');
const SEG_DIR = join(WORK_DIR, 'segments');
const OUTPUT = join(OUT_DIR, 'talkie-story-pass-02.mp4');

const FONT_MONO = '/System/Library/Fonts/SFNSMono.ttf';

interface SourceSegment {
  type: 'source';
  id: string;
  input: string;
  start: number;
  duration: number;
  caption: string;
  anchor: string;
}

interface BlackRuleSegment {
  type: 'black-rule';
  id: string;
  duration: number;
  caption?: string;
  captionFadeOut?: boolean;
}

type Segment = SourceSegment | BlackRuleSegment;

const THOUGHT_LANDS = join(ROOT, 'public', 'demos', 'talkie-thought-lands.mov');
const VOICE_TO_AGENT = join(ROOT, 'public', 'demos', 'talkie-voice-to-agent.mov');
const WORK_RECONSTRUCTION = join(ROOT, 'public', 'demos', 'talkie-work-reconstruction.mov');

const segments: Segment[] = [
  { type: 'black-rule', id: '00-open', duration: 1.0 },
  {
    type: 'source', id: '01-clean',
    input: THOUGHT_LANDS, start: 1.066, duration: 2.401,
    caption: 'talkie. clean.',
    anchor: 't_context_proof_start -> talkie-home-hold',
  },
  {
    type: 'source', id: '02-local',
    input: THOUGHT_LANDS, start: 5.077, duration: 2.439,
    caption: 'the thought is local.',
    anchor: 't_context_proof -> local-records-settle',
  },
  {
    type: 'source', id: '03-readable',
    input: THOUGHT_LANDS, start: 9.125, duration: 3.037,
    caption: 'and stays readable.',
    anchor: 't_saved_text -> context-proof-hold',
  },
  {
    type: 'source', id: '04-route',
    input: VOICE_TO_AGENT, start: 2.635, duration: 0.900,
    caption: 'voice picks a route.',
    anchor: 'workflow-list-hold',
  },
  {
    type: 'source', id: '05-resolve',
    input: VOICE_TO_AGENT, start: 6.993, duration: 2.878,
    caption: 'the path resolves.',
    anchor: 't_payload_resolved -> payload-hold',
  },
  {
    type: 'source', id: '06-handoff',
    input: VOICE_TO_AGENT, start: 11.530, duration: 3.477,
    caption: 'the agent picks it up.',
    anchor: 't_handoff -> agent-ack-hold',
  },
  {
    type: 'source', id: '07-records',
    input: WORK_RECONSTRUCTION, start: 2.567, duration: 0.902,
    caption: 'records remain.',
    anchor: 'records-list-hold',
  },
  {
    type: 'source', id: '08-context',
    input: WORK_RECONSTRUCTION, start: 7.407, duration: 2.429,
    caption: 'context is queryable.',
    anchor: 't_summary_build -> context-stack-hold',
  },
  {
    type: 'source', id: '09-resume',
    input: WORK_RECONSTRUCTION, start: 12.546, duration: 2.202,
    caption: 'you can pick it up again.',
    anchor: 't_resume_point -> resume-point-hold',
  },
  {
    type: 'black-rule', id: '10-close',
    duration: 1.0, caption: 'talkie.', captionFadeOut: true,
  },
];

function run(args: string[]) {
  execFileSync('ffmpeg', args, { cwd: ROOT, stdio: 'inherit' });
}

function escDrawtext(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function renderBlackRule(segment: BlackRuleSegment, output: string) {
  const parts: string[] = [
    'format=yuv420p',
    `drawbox=x=894:y=540:w=132:h=2:color=0x58d7ff@0.95:t=fill`,
  ];
  if (segment.caption) {
    const alpha = segment.captionFadeOut
      ? `if(lt(t,0.22),t/0.22,if(gt(t,${segment.duration - 0.4}),max(0,1-(t-${segment.duration - 0.4})/0.4),1))`
      : `if(lt(t,0.22),t/0.22,1)`;
    parts.push(
      `drawtext=fontfile='${FONT_MONO}':text='${escDrawtext(segment.caption)}':x=80:y=976:fontsize=26:fontcolor=0xa8b4c0:alpha='${alpha}'`,
    );
  }
  const filter = parts.join(',');

  run([
    '-hide_banner', '-y',
    '-f', 'lavfi', '-i', `color=c=black:s=1920x1080:d=${segment.duration}:r=30`,
    '-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=48000`,
    '-t', String(segment.duration),
    '-vf', filter,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k',
    output,
  ]);
}

function renderSource(segment: SourceSegment, output: string) {
  const filter = [
    '[0:v]deflicker=mode=pm:size=10,fps=30,scale=-1:1080:force_original_aspect_ratio=decrease[fg]',
    '[fg]pad=1920:1080:(ow-iw)/2:0:color=black,format=yuv420p[bg]',
    [
      '[bg]null',
      `drawtext=fontfile='${FONT_MONO}':text='${escDrawtext(segment.caption)}':x=80:y=976:fontsize=26:fontcolor=0xa8b4c0:alpha='if(lt(t,0.22),t/0.22,1)'`,
    ].join(','),
  ].join(';');

  run([
    '-hide_banner', '-y',
    '-ss', String(segment.start),
    '-t', String(segment.duration),
    '-i', segment.input,
    '-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=48000`,
    '-filter_complex', `${filter}[v]`,
    '-map', '[v]', '-map', '1:a',
    '-t', String(segment.duration),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k',
    output,
  ]);
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  rmSync(SEG_DIR, { recursive: true, force: true });
  mkdirSync(SEG_DIR, { recursive: true });

  const outputs: string[] = [];
  for (const segment of segments) {
    const output = join(SEG_DIR, `${segment.id}.mp4`);
    if (segment.type === 'black-rule') renderBlackRule(segment, output);
    else renderSource(segment, output);
    outputs.push(output);
  }

  const listPath = join(SEG_DIR, 'concat.txt');
  writeFileSync(listPath, outputs.map((path) => `file '${path.replace(/'/g, "'\\''")}'`).join('\n'));

  run([
    '-hide_banner', '-y',
    '-f', 'concat', '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    OUTPUT,
  ]);

  writeFileSync(join(WORK_DIR, 'composition.json'), JSON.stringify({
    id: 'talkie-story-pass-02',
    title: 'Talkie Story Pass 02',
    output: 'out/talkie-story-pass-02.mp4',
    width: 1920,
    height: 1080,
    fps: 30,
    segments,
    renderedAt: new Date().toISOString(),
  }, null, 2));

  console.log(`Rendered ${OUTPUT}`);
}

main();
