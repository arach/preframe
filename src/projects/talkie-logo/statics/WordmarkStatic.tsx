/** Static wordmark render for icon assembly. */
import { AbsoluteFill, staticFile } from 'remotion';
import { COLORS, WORDMARK } from '../tokens';

const TALKIE_FONT = '"Talkie Medium", "JetBrains Mono", ui-monospace, monospace';

export const WordmarkStatic: React.FC = () => {
  const wordmarkSize = 156;
  const u = wordmarkSize / WORDMARK.fontUPM;
  const totalW = WORDMARK.totalAdvanceUPM * u;
  const totalH = wordmarkSize * 1.05;
  const baseline = wordmarkSize * 0.82;
  const dotCx = WORDMARK.iStemCenterUPM * u;
  const dotR = wordmarkSize * 0.075;
  const dotCy = baseline - WORDMARK.iStemTopUPM * u - dotR * 2.5;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{`
        @font-face {
          font-family: "Talkie Medium";
          src: url("${staticFile('fonts/Talkie-Medium.ttf')}") format("truetype");
          font-weight: 500;
          font-style: normal;
        }
      `}</style>
      <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ display: 'block', width: totalW, height: totalH }}>
        <text x={0} y={baseline} fontFamily={TALKIE_FONT} fontWeight={500} fontSize={wordmarkSize} fill={COLORS.studioCream}>
          talkie
        </text>
        <circle cx={dotCx} cy={dotCy} r={dotR} fill={COLORS.hotMic} />
      </svg>
    </AbsoluteFill>
  );
};
