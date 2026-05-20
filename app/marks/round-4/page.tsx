import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { MarksGallery } from './MarksGallery';

interface Candidate {
  id: string;
  name: string;
  svg: string;
  bucket: string;
  pairId?: string; // for C-bucket idle/recording pairs
  state?: 'idle' | 'recording';
}

interface Bucket {
  id: string;
  label: string;
  description: string;
  candidates: Candidate[];
}

const BUCKETS: Array<Omit<Bucket, 'candidates'>> = [
  {
    id: 'A-oscilloscope',
    label: 'A · Oscilloscope',
    description: 'Voice rendered as line. The trace is the mark.',
  },
  {
    id: 'B-tape-reel',
    label: 'B · Tape reel',
    description: 'Twin circles + ribbon. The palette already speaks this vocabulary.',
  },
  {
    id: 'C-two-state',
    label: 'C · Two-state native shape',
    description: 'A primitive whose idle form becomes the recording form via the same primitive.',
  },
  {
    id: 'D-walkie-p',
    label: 'D · Walkie + p',
    description: 'Figural pair. Lower confidence, higher memorability if it lands.',
  },
];

function loadBucket(bucketId: string): Candidate[] {
  const dir = join(process.cwd(), 'assets', 'talkie-marks-round-4', bucketId);
  const files = readdirSync(dir).filter(f => f.endsWith('-1024.svg'));

  return files.sort().map(filename => {
    const svg = readFileSync(join(dir, filename), 'utf8');
    const id = filename.replace('-1024.svg', '');
    let name = id;
    let pairId: string | undefined;
    let state: 'idle' | 'recording' | undefined;

    // Detect C-bucket pairs: e.g. "C1-lozenge-to-wave-idle"
    const stateMatch = id.match(/^(.+)-(idle|recording)$/);
    if (stateMatch) {
      pairId = stateMatch[1];
      state = stateMatch[2] as 'idle' | 'recording';
      name = pairId.replace(/^[A-D]\d+-/, '').replace(/-/g, ' ') + ` · ${state}`;
    } else {
      name = id.replace(/^[A-D]\d+-/, '').replace(/-/g, ' ');
    }

    return { id, name, svg, bucket: bucketId, pairId, state };
  });
}

export default function MarksRound4Page() {
  const buckets: Bucket[] = BUCKETS.map(b => ({
    ...b,
    candidates: loadBucket(b.id),
  }));

  return <MarksGallery buckets={buckets} />;
}
