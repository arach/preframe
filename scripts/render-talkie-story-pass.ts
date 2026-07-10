#!/usr/bin/env bun
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dir, '..');
const OUT_DIR = join(ROOT, 'public', 'out');
const WORK_DIR = join(ROOT, '.compositions', 'talkie-story-pass-01');
const SEG_DIR = join(WORK_DIR, 'segments');
const OUTPUT = join(OUT_DIR, 'talkie-story-pass-01.mp4');

const FONT_REGULAR = '/System/Library/Fonts/Supplemental/Arial.ttf';
const FONT_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';

interface SourceSegment {
  type: 'source';
  id: string;
  input: string;
  start: number;
  duration: number;
  title: string;
  subtitle: string;
}

interface CardSegment {
  type: 'card';
  id: string;
  duration: number;
  title: string;
  subtitle: string;
}

type Segment = SourceSegment | CardSegment;

const segments: Segment[] = [
  {
    type: 'card',
    id: '00-open',
    duration: 2.1,
    title: 'Talkie',
    subtitle: 'Capture the thought. Route the work. Recover the thread.',
  },
  {
    type: 'source',
    id: '01-memory',
    input: join(ROOT, 'public', 'demos', 'talkie-thought-lands.mov'),
    start: 0.7,
    duration: 4.2,
    title: '1. The memory is local',
    subtitle: 'A fast thought becomes a record you can inspect again.',
  },
  {
    type: 'source',
    id: '02-library',
    input: join(ROOT, 'public', 'demos', 'talkie-thought-lands.mov'),
    start: 8.0,
    duration: 4.1,
    title: '2. The trail is readable',
    subtitle: 'The library view turns messy prior context into something scannable.',
  },
  {
    type: 'source',
    id: '03-route',
    input: join(ROOT, 'public', 'demos', 'talkie-voice-to-agent.mov'),
    start: 4.6,
    duration: 4.6,
    title: '3. Voice becomes a route',
    subtitle: 'A workflow graph gives the agent handoff a visible path.',
  },
  {
    type: 'source',
    id: '04-handoff',
    input: join(ROOT, 'public', 'demos', 'talkie-voice-to-agent.mov'),
    start: 9.2,
    duration: 4.7,
    title: '4. The handoff holds',
    subtitle: 'The viewer gets time to understand what will happen next.',
  },
  {
    type: 'source',
    id: '05-resume',
    input: join(ROOT, 'public', 'demos', 'talkie-work-reconstruction.mov'),
    start: 0.0,
    duration: 5.5,
    title: '5. Resume from context',
    subtitle: 'The same structure becomes a place to restart the work.',
  },
  {
    type: 'card',
    id: '06-close',
    duration: 2.0,
    title: 'Capture -> Route -> Resume',
    subtitle: 'The next pass needs more live action, but this is now a produced story baseline.',
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

function renderCard(segment: CardSegment, output: string) {
  const filter = [
    'format=yuv420p',
    `drawbox=x=0:y=0:w=iw:h=ih:color=0x050608@1:t=fill`,
    `drawbox=x=136:y=196:w=132:h=6:color=0x58d7ff@0.95:t=fill`,
    `drawtext=fontfile='${FONT_BOLD}':text='${escDrawtext(segment.title)}':x=136:y=250:fontsize=92:fontcolor=white:alpha='if(lt(t,0.35),t/0.35,1)'`,
    `drawtext=fontfile='${FONT_REGULAR}':text='${escDrawtext(segment.subtitle)}':x=140:y=380:fontsize=34:fontcolor=0xc8d2dc:line_spacing=12:alpha='if(lt(t,0.55),t/0.55,1)'`,
    `drawtext=fontfile='${FONT_REGULAR}':text='SOURCE PASS 01':x=140:y=890:fontsize=18:fontcolor=0x6f7b88`,
  ].join(',');

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
    '[0:v]deflicker=mode=pm:size=10,fps=30,split=2[base][fgsrc]',
    '[base]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,gblur=sigma=34,eq=brightness=-0.18:saturation=0.72[bg]',
    '[fgsrc]scale=-1:930,format=yuva420p[fg]',
    [
      '[bg][fg]overlay=(W-w)/2:(H-h)/2-8',
      'drawbox=x=0:y=0:w=1920:h=1080:color=0x000000@0.18:t=fill',
      'drawbox=x=92:y=792:w=980:h=150:color=0x050608@0.76:t=fill',
      'drawbox=x=92:y=792:w=6:h=150:color=0x58d7ff@0.95:t=fill',
      `drawtext=fontfile='${FONT_BOLD}':text='${escDrawtext(segment.title)}':x=126:y=815:fontsize=42:fontcolor=white`,
      `drawtext=fontfile='${FONT_REGULAR}':text='${escDrawtext(segment.subtitle)}':x=126:y=875:fontsize=25:fontcolor=0xd7dde6`,
      `drawtext=fontfile='${FONT_REGULAR}':text='${escDrawtext(basename(segment.input))}':x=1425:y=1006:fontsize=18:fontcolor=0x788390`,
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
    if (segment.type === 'card') renderCard(segment, output);
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
    id: 'talkie-story-pass-01',
    title: 'Talkie Story Pass 01',
    output: 'out/talkie-story-pass-01.mp4',
    width: 1920,
    height: 1080,
    fps: 30,
    segments,
    renderedAt: new Date().toISOString(),
  }, null, 2));

  console.log(`Rendered ${OUTPUT}`);
}

main();
