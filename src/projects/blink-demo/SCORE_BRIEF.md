# Blink spatial desk — score brief

## Goal

Create a calm, elegant instrumental score for the 47.30-second Blink demo. The
music should feel spacious and precise, with quiet forward motion and only a
few meaningful events. It supports the visible Pi → CLI → spatial-note chain;
it never competes with terminal text or turns the piece into a generic product
promo.

## Avoid

- vocals or spoken material
- corporate ambient uplift
- lo-fi beats
- overt synthwave
- big drums, drops, risers, or trailer impacts
- constant arpeggiation
- dense melody that asks for attention

## Direction

Use a restrained modern chamber/electronic palette: soft tonal air, a small
amount of tactile pulse, low harmonic movement, and natural-feeling decay.
Silence and negative space are part of the arrangement.

The demo is 1419 frames at 30fps. Shape modest events around:

| Edit time | Product event | Musical behavior |
|---:|---|---|
| 00:17.4 | First note appears | First clear harmonic opening; gentle, not triumphant |
| 00:24.1 | First note moves | Short tactile articulation or spatial handoff |
| 00:30.5 | Second note appears | Slightly wider texture; the desk now surrounds the terminal |
| 00:41.0 | Notes hide | Subtract or narrow the field rather than adding impact |
| 00:46.0 | Notes restore | Strongest restrained resolution; warm return with a clean tail |

The first 12 seconds may establish a quiet pulse under accelerated terminal
work. Important product responses return to real time, so musical accents must
remain exact without sounding quantized to UI clicks.

## Delivery

- One chosen instrumental master around 48 seconds; at most one alternate when
  it adds a genuinely different useful direction.
- Durable assets belong under `public/tracks/blink/`.
- Document generator/model, prompt or synthesis method, edit processing,
  duration, loudness, and rights/provenance.
- Integrate the chosen track in `BlinkSpatialDemo.tsx` without reverting the
  exact 1:1 capture geometry or precision typography pass.
- Render or mux a reviewable master and report the exact output path.

## Delivered score

- Chosen master: `public/tracks/blink/blink-spatial-score.wav`
- Provenance sidecar: `public/tracks/blink/blink-spatial-score.provenance.json`
- Generator: MiniMax `music-2.6`, instrumental mode, generated 2026-08-01; exact prompt, request settings, trace ID, and source hash are in the sidecar.
- Edit processing: selected `00:00.000–00:47.300` from the 184.35483-second response, applied -3 dB gain, resampled 44.1 kHz → 48 kHz, and added 0.6-second fade-in plus 1.2-second fade-out from 00:46.100. Final master is stereo 24-bit PCM WAV, 47.300 seconds.
- Measured master: -23.2 LUFS integrated, 9.9 LU loudness range, -3.2 dBFS true peak.
- Integration: `BlinkSpatialDemo.tsx` uses the score at volume 0.84; existing typing and tap layers remain separate and quiet.
- Rights/provenance: no external reference audio or samples were supplied or added; MiniMax account/service terms remain authoritative and exclusivity was not independently audited.
