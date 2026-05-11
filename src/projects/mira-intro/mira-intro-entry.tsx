import { Composition, registerRoot } from 'remotion'
import { MiraIntro, MIRA_INTRO_FRAMES } from './MiraIntro'

const Root: React.FC = () => (
  <Composition
    id="MiraIntro"
    component={MiraIntro}
    durationInFrames={MIRA_INTRO_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
)

registerRoot(Root)
