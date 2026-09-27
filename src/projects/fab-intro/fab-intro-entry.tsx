import { Composition, registerRoot } from 'remotion'
import { FabIntro, FAB_INTRO_FRAMES } from './FabIntro'

const Root: React.FC = () => (
  <Composition
    id="FabIntro"
    component={FabIntro}
    durationInFrames={FAB_INTRO_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
)

registerRoot(Root)
