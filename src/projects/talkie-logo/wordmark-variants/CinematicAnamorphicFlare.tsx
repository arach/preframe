/** anamorphic-flare: horizontal lens flare sweeps across wordmark during entrance. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

export const WordmarkAnamorphicFlare: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  // Flare sweeps from left to right over 1.2s starting at 0.3s
  const flareStart = 0.3 * FPS;
  const flareDuration = 1.2 * FPS;
  const flareP = interpolate(frame, [flareStart, flareStart + flareDuration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease),
  });
  const flareCx = flareP * s.totalW * 1.3 - s.totalW * 0.15;
  const flareOpacity = flareP > 0 && flareP < 1 ? Math.sin(flareP * Math.PI) * 0.6 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <defs>
          <radialGradient id="flare-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E68A3C" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#FF5346" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
          >{letter}</text>
        ))}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
        {/* Horizontal flare streak */}
        <ellipse cx={flareCx} cy={s.totalH * 0.48} rx={s.totalW * 0.25} ry={s.totalH * 0.015}
          fill="url(#flare-core)" opacity={flareOpacity}
        />
        {/* Cyan halo */}
        <ellipse cx={flareCx} cy={s.totalH * 0.48} rx={s.totalW * 0.35} ry={s.totalH * 0.005}
          fill="#00BFFF" opacity={flareOpacity * 0.3}
        />
      </svg>
    </AbsoluteFill>
  );
};
