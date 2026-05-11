# Lattices Episodic Video Pipeline

Chained 5-segment cinematic video generation using MiniMax T2V.

## The Five Segments

| # | Title | Camera | Duration |
|---|---|---|---|
| 1 | Genesis | [Push in] — Grid materializes from void | 10s |
| 2 | Penetration | [Truck right] — Through the center cell | 10s |
| 3 | Cathedral | [Pan up] — Floating data panes orbit | 10s |
| 4 | Contact | [Zoom out] — Figure touches the grid, ripples | 10s |
| 5 | Cosmos | [Wide shot] — Universe of lattices | 10s |

## Techniques

- **Frame chaining**: Last frame extracted via ffmpeg, fed back as `first_frame_image` to next segment
- **Continuity prompts**: "Continue seamlessly from previous frame" prefix on every prompt
- **Camera directives**: [Push in], [Truck right], [Pan up], [Zoom out] — Minimax supports these
- **Stitching**: ffmpeg concat demuxer for the final master

## Usage

```bash
./lattices-episodic.py --mode full    # Generate all 5 segments + master
./lattices-episodic.py --mode single --segment 3   # Just segment 3
```

## Output

```
inventory/videos/episodic/
├── segment-01.mp4
├── segment-02.mp4
├── segment-03.mp4
├── segment-04.mp4
├── segment-05.mp4
├── frame-01-last.jpg   # Extracted for chaining
├── frame-02-last.jpg
├── ...
└── lattices-episodic-master.mp4   # Final stitched ~50s
```

## Daily Limits

MiniMax allows 2 videos/day on current plan. For a full 5-segment run,
this pipeline takes 3 days (or upgrade plan).
